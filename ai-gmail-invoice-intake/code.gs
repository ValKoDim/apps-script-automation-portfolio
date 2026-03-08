/**
 * Gmail Invoice Intake + OpenAI Structured Extraction
 * Works with gpt-4o-mini structured outputs (JSON schema).
 * Handles PDF + DOCX, does classification + extraction in one AI call.
 */

const CONFIG = {
  INTAKE_LABEL: "AI-Invoice-Intake",
  PROCESSED_LABEL: "AI-Invoice-Processed",
  REVIEW_LABEL: "AI-Invoice-Review",
  SHEET_NAME: "intake_log",
  MAX_THREADS_PER_RUN: 10,
  AUTO_APPROVE_CONFIDENCE: 0.85,
  FAILSAFE_CONFIDENCE_REVIEW: 0.6,
  MATH_TOLERANCE: 0.02
};

/**
 * Main: scan and process up to MAX threads
 */
function runIntakeOnce() {
  const sheet = getLogSheet_();
  ensureHeaders_(sheet);

  const intakeLabel = getOrCreateLabel_(CONFIG.INTAKE_LABEL);
  const processedLabel = getOrCreateLabel_(CONFIG.PROCESSED_LABEL);
  const reviewLabel = getOrCreateLabel_(CONFIG.REVIEW_LABEL);

  const threads = intakeLabel.getThreads(0, CONFIG.MAX_THREADS_PER_RUN);
  if (!threads.length) return;

  threads.forEach(thread => {
    const msgs = thread.getMessages();

    msgs.forEach(msg => {
      const mid = msg.getId();
      const from = msg.getFrom();
      const subj = msg.getSubject();

      msg.getAttachments({includeInlineImages: false})
         .forEach(att => {
        const t = att.getContentType();
        if (!["application/pdf", "application/msword",
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
            .includes(t)) return;

        const fn = att.getName() || "document";

        if (alreadyLogged_(sheet, mid, fn)) return;

        try {
          const extracted = extractWithOpenAI_(att);
          const validation = validate_(extracted);

          // FAILSAFE: borderline non-invoices → review label
          if (extracted.doc_type === "other" &&
              extracted.extraction_confidence < CONFIG.FAILSAFE_CONFIDENCE_REVIEW) {
            thread.addLabel(reviewLabel);
          }

          const status = decideStatus_(extracted, validation);

          appendLogRow_(sheet, {
            ts: new Date(),
            email_id: mid,
            message_id: mid,
            thread_id: thread.getId(),
            sender: from,
            subject: subj,
            filename: fn,
            extracted,
            flags: validation.flags,
            status,
            raw_json: JSON.stringify(extracted)
          });

        } catch (err) {
          // Log error and flag for review
          appendLogRow_(sheet, {
            ts: new Date(),
            email_id: mid,
            message_id: mid,
            thread_id: thread.getId(),
            sender: from,
            subject: subj,
            filename: fn,
            extracted: {
              doc_type: "other",
              vendor: {name:"ERROR",vat_id:null},
              invoice_number:null, invoice_date:null,
              currency:null, subtotal:null, tax:null, total:null,
              extraction_confidence: 0,
              warnings:[String(err)]
            },
            flags: ["ERROR_PROCESSING"],
            status: "needs_review",
            raw_json: JSON.stringify({error:String(err)})
          });
          thread.addLabel(reviewLabel);
        }
      });
    });

    thread.removeLabel(intakeLabel);
    thread.addLabel(processedLabel);
  });
}

/**
 * Calls OpenAI Responses API with Structured Outputs (json_schema)
 */
function extractWithOpenAI_(blob) {
  const props = PropertiesService.getScriptProperties();
  const key = props.getProperty("OPENAI_API_KEY");
  const model = props.getProperty("OPENAI_MODEL") || "gpt-4o-mini";
  if (!key) throw new Error("OPENAI_API_KEY not set");

  const b64 = Utilities.base64Encode(blob.getBytes());

  // Schema definition
  const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    doc_type: { type: "string", enum: ["invoice", "receipt", "other"] },

    vendor: {
      type: "object",
      additionalProperties: false,
      properties: {
        name: { type: "string" },
        vat_id: { type: ["string", "null"] }
      },
      required: ["name", "vat_id"]   // ← FIX IS HERE
    },

    invoice_number: { type: ["string", "null"] },
    invoice_date: { type: ["string", "null"] },
    currency: { type: ["string", "null"] },
    subtotal: { type: ["number", "null"] },
    tax: { type: ["number", "null"] },
    total: { type: ["number", "null"] },

    extraction_confidence: {
      type: "number",
      minimum: 0,
      maximum: 1
    },

    warnings: {
      type: "array",
      items: { type: "string" }
    }
  },

  required: [
    "doc_type",
    "vendor",
    "invoice_number",
    "invoice_date",
    "currency",
    "subtotal",
    "tax",
    "total",
    "extraction_confidence",
    "warnings"
  ]
};


  const payload = {
    model,
    input: [{
      role: "user",
      content: [
        {
          type: "input_text",
          text: [
            "Classify this document as invoice, receipt, or other.",
            "Extract financial fields only if invoice/receipt.",
            "Do not guess missing values; use null.",
            "Return strict JSON matching the schema."
          ].join("\n")
        },
        {
          type: "input_file",
          filename: blob.getName() || "document",
          file_data: "data:application/pdf;base64," + b64
        }
      ]
    }],
    text: {
      format: {
        type: "json_schema",
        name: "finance_document",
        schema: schema
      }
    }
  };

  const resp = UrlFetchApp.fetch(
    "https://api.openai.com/v1/responses",
    {
      method: "post",
      contentType: "application/json",
      headers: {Authorization: "Bearer " + key},
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    }
  );

  if (resp.getResponseCode() !== 200) {
    throw new Error(resp.getContentText());
  }

  const j = JSON.parse(resp.getContentText());
  const out = j.output
    .flatMap(o => o.content || [])
    .find(c => c.type === "output_text");

  if (!out || !out.text) {
    throw new Error("No structured output");
  }
  return JSON.parse(out.text);
}

/**
 * Basic validation & flags
 */
function validate_(e) {
  const flags = [];

  if (e.doc_type === "other") {
    flags.push("NON_FINANCIAL_DOC");
    return {flags};
  }
  if (!e.vendor.name) flags.push("MISSING_VENDOR");
  if (!e.invoice_date) flags.push("MISSING_DATE");
  if (!e.currency) flags.push("MISSING_CURRENCY");
  if (e.total == null) flags.push("MISSING_TOTAL");

  if (typeof e.subtotal === "number" &&
      typeof e.tax === "number" &&
      typeof e.total === "number") {
    if (Math.abs(e.subtotal + e.tax - e.total) > CONFIG.MATH_TOLERANCE) {
      flags.push("TOTAL_MISMATCH");
    }
  }

  if (e.extraction_confidence < 0.7) flags.push("LOW_CONFIDENCE");
  if (Array.isArray(e.warnings) && e.warnings.length) flags.push("HAS_WARNINGS");

  return {flags};
}

function decideStatus_(e, val) {
  if (e.doc_type === "other") return "ignored";
  if (val.flags.includes("TOTAL_MISMATCH") ||
      val.flags.includes("LOW_CONFIDENCE")) return "needs_review";
  if (e.extraction_confidence >= CONFIG.AUTO_APPROVE_CONFIDENCE) return "approved";
  return "needs_review";
}

/**
 * Sheets helpers
 */
function getLogSheet_() {
  const s = SpreadsheetApp.getActive().getSheetByName(CONFIG.SHEET_NAME);
  if (!s) throw new Error("Sheet not found");
  return s;
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() > 0) return;
  sheet.appendRow([
    "timestamp","email_id","message_id","thread_id","sender","subject","filename",
    "doc_type","vendor_name","vendor_vat_id","invoice_number","invoice_date","currency",
    "subtotal","tax","total","ai_confidence","flags","status","raw_json"
  ]);
  sheet.setFrozenRows(1);
}

function appendLogRow_(sheet, d) {
  const e = d.extracted;
  sheet.appendRow([
    d.ts, d.email_id, d.message_id, d.thread_id,
    d.sender, d.subject, d.filename,
    e.doc_type,
    e.vendor?.name || null,
    e.vendor?.vat_id || null,
    e.invoice_number,
    e.invoice_date,
    e.currency,
    e.subtotal,
    e.tax,
    e.total,
    e.extraction_confidence,
    (d.flags || []).join("; "),
    d.status,
    d.raw_json
  ]);
}

function alreadyLogged_(sheet, messageId, filename) {
  const lr = sheet.getLastRow();
  if (lr < 2) return false;
  const data = sheet.getRange(2,1,lr-1,7).getValues();
  return data.some(r => r[2] === messageId && r[6] === filename);
}

function getOrCreateLabel_(n) {
  return GmailApp.getUserLabelByName(n) || GmailApp.createLabel(n);
}
