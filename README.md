# 🚀 Google Apps Script Workflow Automations

Welcome to my repository showcasing a collection of automation projects built using **Google Apps Script**. These projects demonstrate how to integrate Google Workspace (Gmail, Sheets, Drive) with external APIs like **WooCommerce** and **OpenAI** to automate key business processes, saving time and reducing manual effort.

## 📌 Repository Overview

This repository contains five distinct projects, each addressing a specific manual workflow challenge:

### 🤖 AI-Powered Automations (New!)
1.  **[AI Email Assistant (Inbox Copilot)](./ai-email-assistant/)** – Uses OpenAI's Assistant API to analyze, categorize, and draft replies for incoming Gmail messages.
2.  **[AI Gmail Invoice Intake](./ai-gmail-invoice-intake/)** – Automatically extracts data from invoice attachments (PDF/DOCX) using OpenAI's structured output and logs it to Google Sheets.

### 🛒 WooCommerce & Order Management
3.  **[Product Quantity Synchronization](./product-sync/)** – Real-time stock level synchronization across multiple WooCommerce stores using webhooks and periodic checks.
4.  **[Proforma Invoice Generator](./proforma-generator-web-app/)** – A web app that fetches order details from WooCommerce and generates a PDF proforma invoice.
5.  **[Automated Order Tracking & Backup](./order-management/)** – Populates a spreadsheet with WooCommerce orders in real-time and automates daily backups.

---

## 🔹 Detailed Project Breakdown

### 1. AI Email Assistant (Inbox Copilot)
-   **Problem:** High volume of incoming emails requiring manual categorization and repetitive drafting.
-   **Solution:** An AI agent that reads your inbox, applies labels based on sentiment/urgency, and prepares contextual draft replies.
-   **Key Tech:** Google Apps Script, OpenAI Assistants API (v2), Gmail API.

### 2. AI Gmail Invoice Intake
-   **Problem:** Manual data entry from emailed invoices into accounting spreadsheets.
-   **Solution:** Automatically extracts key financial data (Vendor, VAT, Total, Tax) from attachments with a high-confidence AI model.
-   **Key Tech:** Google Apps Script, OpenAI Responses API (Structured Output), Google Sheets.

### 3. WooCommerce Product Quantity Synchronization
-   **Problem:** Keeping stock levels consistent across multiple independent WooCommerce stores.
-   **Solution:** Listens for WooCommerce webhooks on order placement and uses the WooCommerce REST API to update stock on all linked stores.
-   **Key Tech:** Google Apps Script, WooCommerce REST API, Webhooks.

### 4. Proforma Invoice Generator
-   **Problem:** Time-consuming manual creation of proforma invoices for customers.
-   **Solution:** A simple HTML UI where employees enter an Order ID. The script fetches data from WooCommerce and populates a Google Sheet template to generate a PDF.
-   **Key Tech:** Google Apps Script, WooCommerce API, HTML Service, Google Drive/Sheets.

### 5. Automated Order Tracking & Spreadsheet Backup
-   **Problem:** Manual order tracking and the need for daily backups of order spreadsheets.
-   **Solution:** Real-time logging of new orders via webhooks, with a scheduled task that creates a fresh sheet every midnight and emails the link to stakeholders.
-   **Key Tech:** Google Apps Script, WooCommerce Webhooks, Gmail API.

---

## 📜 Installation & Usage
Each project folder contains its own `README.md` with specific setup instructions, script property requirements, and workflow diagrams.

Generally, you will need to:
1.  Create a new **Google Apps Script** project.
2.  Copy the `code.gs` (and any other files) into the script editor.
3.  Configure the **Script Properties** (Project Settings) with your API keys and configuration values.
4.  Set up the necessary **Triggers** (Time-driven or Webhook-based).

---

## 📧 Contact
Want to automate your workflow? Reach out!
- **Email:** [valentin.diimitrov@gmail.com](mailto:valentin.diimitrov@gmail.com)
- **LinkedIn:** [linkedin.com/in/valentin-dimitrov-tech/](https://www.linkedin.com/in/valentin-dimitrov-tech/)
- **Portfolio:** [valkodim.github.io/](https://valkodim.github.io/)

---

*Note: All sensitive information (API keys, IDs, emails) has been replaced with placeholders. Ensure you use Google's `PropertiesService` for storing secrets.*
