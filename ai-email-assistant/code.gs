/**
 * Inbox Copilot (Gmail label + Sheets log + Draft reply) using OpenAI Assistant (Agents API)
 *
 * Flow:
 * - Every X minutes, search Gmail for unprocessed threads
 * - For each latest message:
 *   - Send to OpenAI Assistant (agent) for analysis + draft reply (JSON)
 *   - Apply label AI/<Category>
 *   - Mark AI/Processed
 *   - Create Gmail Draft reply (NOT sent)
 *   - Log to Google Sheet
 *
 * Setup (Script Properties):
 * - OPENAI_API_KEY
 * - OPENAI_ASSISTANT_ID   (e.g. asst_...)
 * Optional:
 * - TARGET_LABEL          (if set, only process emails with this label)
 *
 * Make Gmail labels (optional, auto-created if missing):
 * - AI/Sales, AI/Support, AI/Partner, AI/Ops, AI/Other, AI/Processed, AI/Failed
 *
 * Sheet:
 * - Open a Google Sheet, Extensions -> Apps Script, paste this
 * - Ensure a sheet tab named "Inbox Log" exists (auto-created if missing)
 */

const LABEL_PREFIX = "AI/";
const PROCESSED_LABEL = "AI/Processed";
const FAILED_LABEL = "AI/Failed";
const SHEET_NAME = "Inbox Log";

const MAX_THREADS_PER_RUN = 10;
const NEWER_THAN_DAYS = 3;

// Assistant run polling
const RUN_POLL_MS = 800;
const RUN_MAX_POLLS = 30; // ~24s

function runInboxCopilot() {
  const apiKey = getProp_("OPENAI_API_KEY");
  const assistantId = getProp_("OPENAI_ASSISTANT_ID");
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY in Script Properties.");
  if (!assistantId) throw new Error("Missing OPENAI_ASSISTANT_ID in Script Properties.");

  const targetLabelName = getProp_("TARGET_LABEL"); // optional
  const processedLabel = getOrCreateLabel_(PROCESSED_LABEL);
  const failedLabel = getOrCreateLabel_(FAILED_LABEL);

  const query = targetLabelName
    ? `label:${escapeLabelQuery_(targetLabelName)} -label:${escapeLabelQuery_(PROCESSED_LABEL)} -label:${escapeLabelQuery_(FAILED_LABEL)} newer_than:${NEWER_THAN_DAYS}d`
    : `in:inbox -label:${escapeLabelQuery_(PROCESSED_LABEL)} -label:${escapeLabelQuery_(FAILED_LABEL)} newer_than:${NEWER_THAN_DAYS}d`;

  const threads = GmailApp.search(query, 0, MAX_THREADS_PER_RUN);
  if (!threads.length) return; // clean exit: no new emails

  const sheet = getSheet_();

  for (const thread of threads) {
    try {
      const messages = thread.getMessages();
      const msg = messages[messages.length - 1];

      // extra safety: if already processed, skip
      if (thread.getLabels().some(l => l.getName() === PROCESSED_LABEL)) continue;

      const from = msg.getFrom();
      const subject = msg.getSubject();
      const body = getPlainBody_(msg);

      // Call assistant (agent)
      const analysis = analyzeWithAssistant_(apiKey, assistantId, { from, subject, body });

      // Apply category label
      const categoryLabelName = LABEL_PREFIX + titleCase_(analysis.category || "other");
      const categoryLabel = getOrCreateLabel_(categoryLabelName);
      thread.addLabel(categoryLabel);

      // Mark processed (state stored in Gmail labels)
      thread.addLabel(processedLabel);

      // Create Gmail draft reply (NOT sent)
      const replySubject = ensureReSubject_(analysis.reply && analysis.reply.subject, subject);

      const rawReplyBody = (analysis.reply && analysis.reply.body) ? analysis.reply.body : "";
      const sanitized = sanitizeDraft_(rawReplyBody);
      const replyBody = sanitized.text;

      const draft = msg.createDraftReply(replyBody, { subject: replySubject });

      // Optional: record what got stripped
      const sanitizeNote = sanitized.removed && sanitized.removed.length
        ? Array.from(new Set(sanitized.removed)).join(" | ").slice(0, 500)
        : "";

      // Log to sheet
      sheet.appendRow([
        new Date(),
        msg.getId(),
        from,
        subject,
        analysis.category,
        analysis.urgency,
        analysis.sentiment,
        analysis.routing && analysis.routing.team ? analysis.routing.team : "",
        analysis.extracted && analysis.extracted.request_summary ? analysis.extracted.request_summary : "",
        categoryLabelName,
        draft.getId(),
        sanitizeNote,
        analysis.confidence
      ]);

    } catch (err) {
      // Don’t fail the whole trigger run. Mark thread as failed so it doesn't retry forever.
      try { thread.addLabel(failedLabel); } catch (e) {}
      try {
        const sheet = getSheet_();
        sheet.appendRow([
          new Date(),
          "ERROR",
          "",
          "",
          "",
          "",
          "",
          "",
          (err && err.message) ? err.message : String(err),
          FAILED_LABEL,
          "",
          "",
          ""
        ]);
      } catch (e) {}
      continue;
    }
  }
}

/**
 * Calls OpenAI Assistants API (agent):
 * - create thread
 * - add message
 * - run
 * - poll
 * - read assistant message
 * Includes: strict-JSON instruction + tolerant JSON parsing + one retry on parse failure.
 */
function analyzeWithAssistant_(apiKey, assistantId, email) {
  function runAndWait_(threadId) {
    const run = openaiRequest_(apiKey, "POST", `/v1/threads/${threadId}/runs`, {
      assistant_id: assistantId
    });

    let status = run.status;
    const runId = run.id;

    for (let i = 0; i < RUN_MAX_POLLS; i++) {
      if (status === "completed") return runId;
      if (status === "failed" || status === "cancelled" || status === "expired") {
        throw new Error(`Assistant run ended with status=${status}`);
      }
      Utilities.sleep(RUN_POLL_MS);
      const r = openaiRequest_(apiKey, "GET", `/v1/threads/${threadId}/runs/${runId}`, null);
      status = r.status;
    }
    throw new Error("Assistant run timed out (increase RUN_MAX_POLLS/RUN_POLL_MS).");
  }

  // 1) Create thread
  const thread = openaiRequest_(apiKey, "POST", "/v1/threads", {});
  const threadId = thread.id;

  // 2) Add user message with the email content
  const content = [
    "Analyze this inbound email and return ONLY the JSON described in your instructions.",
    "IMPORTANT: Output MUST be valid JSON only. Do NOT wrap in ``` or ```json fences. Do NOT include any extra text.",
    "",
    `From: ${email.from}`,
    `Subject: ${email.subject}`,
    "Body:",
    email.body
  ].join("\n");

  openaiRequest_(apiKey, "POST", `/v1/threads/${threadId}/messages`, {
    role: "user",
    content
  });

  // 3) Run + wait
  runAndWait_(threadId);

  // 4) Read latest assistant message text
  const msgs = openaiRequest_(apiKey, "GET", `/v1/threads/${threadId}/messages?limit=10`, null);
  const assistantMsg = (msgs.data || []).find(m => m.role === "assistant");
  if (!assistantMsg) throw new Error("No assistant message returned.");

  const text = extractTextFromAssistantMessage_(assistantMsg);

  // 5) Parse JSON with graceful fallback + one retry if needed
  let json;
  try {
    json = safeJsonParse_(text);
  } catch (e) {
    // Ask the assistant to re-output ONLY valid JSON, no fences, no commentary.
    openaiRequest_(apiKey, "POST", `/v1/threads/${threadId}/messages`, {
      role: "user",
      content: [
        "Your last response was NOT valid JSON (it may have had code fences or incomplete tokens).",
        "Reply again with ONLY valid JSON (no ``` fences, no extra text).",
        "Make sure booleans are true/false and the JSON is complete."
      ].join("\n")
    });

    runAndWait_(threadId);

    const msgs2 = openaiRequest_(apiKey, "GET", `/v1/threads/${threadId}/messages?limit=20`, null);
    const assistantMsg2 = (msgs2.data || []).find(m => m.role === "assistant");
    if (!assistantMsg2) throw new Error("No assistant message returned after retry.");

    const text2 = extractTextFromAssistantMessage_(assistantMsg2);
    json = safeJsonParse_(text2); // if still fails, let it throw
  }

  // 6) Minimal validation
  if (!json || !json.category || !json.reply || typeof json.reply.body !== "string") {
    throw new Error("Assistant returned invalid JSON shape.");
  }

  return json;
}

/** OpenAI HTTP helper for Apps Script */
function openaiRequest_(apiKey, method, path, bodyOrNull) {
  const url = "https://api.openai.com" + path;

  const params = {
    method,
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + apiKey,
      "OpenAI-Beta": "assistants=v2"
    },
    muteHttpExceptions: true
  };

  if (bodyOrNull !== null && bodyOrNull !== undefined) {
    params.payload = JSON.stringify(bodyOrNull);
  }

  const res = UrlFetchApp.fetch(url, params);
  const status = res.getResponseCode();
  const text = res.getContentText();

  if (status < 200 || status >= 300) {
    throw new Error(`OpenAI ${method} ${path} failed (${status}): ${text}`);
  }
  return JSON.parse(text);
}

/** Extract concatenated text from assistant message parts */
function extractTextFromAssistantMessage_(msg) {
  const parts = msg.content || [];
  let out = "";
  for (const p of parts) {
    if (p.type === "text" && p.text && p.text.value) out += p.text.value;
  }
  return (out || "").trim();
}

/**
 * Tolerant JSON parser:
 * - removes ```json fences
 * - tries direct JSON.parse
 * - fallback: extracts first {...} block
 */
function safeJsonParse_(s) {
  if (!s) throw new Error("Empty assistant output.");

  let t = String(s).trim();

  // Strip ```json fences
  t = t.replace(/^```(?:json)?\s*/i, "");
  t = t.replace(/```$/i, "");
  t = t.trim();

  // Direct parse
  try {
    return JSON.parse(t);
  } catch (e) {
    // Fallback: extract JSON object block
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const candidate = t.slice(start, end + 1);
      try {
        return JSON.parse(candidate);
      } catch (e2) {
        throw new Error("Assistant JSON parse failed. Snippet: " + candidate.slice(0, 250));
      }
    }
    throw new Error("Assistant did not return JSON. Snippet: " + t.slice(0, 250));
  }
}

/**
 * Removes citation artifacts and internal-reference tokens from draft text.
 * Conservative: targets patterns commonly produced by RAG (e.g. , [1], (source), "†source").
 * Returns { text, removed[] } where removed is a list of matched artifacts (deduped later).
 */
function sanitizeDraft_(text) {
  let t = String(text || "");

  // Normalize line endings
  t = t.replace(/\r\n/g, "\n");

  const removed = [];

  function collectAndReplace_(pattern, replacement) {
    const matches = t.match(pattern);
    if (matches && matches.length) {
      for (const m of matches) removed.push(m);
    }
    t = t.replace(pattern, replacement);
  }

  // 1) Strong RAG citation blocks like:  or  or 【...】
  collectAndReplace_(/【[^】]{1,80}】/g, "");

  // 2) Footnote-like bracket refs: [1], [12], [source], [citation], [ref]
  // Keep conservative: remove only small bracket tokens.
  collectAndReplace_(/\[(?:\s*\d{1,3}\s*|(?:source|sources|citation|citations|ref|refs)\s*)\]/gi, "");

  // 3) Parenthetical source tokens: (source), (citation), (ref)
  collectAndReplace_(/\((?:\s*(?:source|sources|citation|citations|ref|refs)\s*)\)/gi, "");

  // 4) Loose dagger/source tokens that sometimes appear: "†source"
  collectAndReplace_(/†\s*(?:source|sources|citation|citations|ref|refs)\b/gi, "");

  // 5) Collapse excessive whitespace introduced by removals
  // - remove spaces before punctuation
  t = t.replace(/\s+([,.;:!?])/g, "$1");
  // - collapse 3+ newlines to max 2
  t = t.replace(/\n{3,}/g, "\n\n");
  // - trim trailing spaces on lines
  t = t.replace(/[ \t]+\n/g, "\n");
  // - trim ends
  t = t.trim();

  return { text: t, removed };
}

/** Gmail/Sheets helpers */
function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  return sh;
}
function getProp_(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}
function getOrCreateLabel_(name) {
  return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name);
}
function titleCase_(s) {
  return (s || "").charAt(0).toUpperCase() + (s || "").slice(1).toLowerCase();
}
function escapeLabelQuery_(labelName) {
  return `"${labelName.replace(/"/g, '\\"')}"`;
}
function getPlainBody_(msg) {
  // Cap to reduce costs and avoid giant signatures
  const plain = msg.getPlainBody() || "";
  return plain.slice(0, 6000);
}
function ensureReSubject_(replySubject, originalSubject) {
  const s = (replySubject || "").trim();
  if (!s) return "Re: " + originalSubject;
  if (/^re:/i.test(s)) return s;
  return "Re: " + originalSubject;
}
