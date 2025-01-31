# 🚀 Google Apps Script Workflow Automations for WooCommerce

Welcome to my GitHub repository showcasing three automation projects built using **Google Apps Script**. These projects integrate **WooCommerce** with Google Sheets and automate key business workflows, saving time and reducing manual effort.

## 📌 Overview
This repository contains three projects demonstrating **workflow automation** using Google Web Apps, WooCommerce webhooks, and Google Sheets:

1. **Product Quantity Synchronization** – Syncs product stock levels across multiple WooCommerce stores.
2. **Proforma Invoice Generator** – Generates and emails proforma invoices using order details.
3. **Automated Order Tracking & Spreadsheet Backup** – Populates spreadsheets with WooCommerce orders and automates daily backups.

Each project contains:
- A **Google Apps Script** file
- A **README** with setup instructions
- A **Workflow diagram** for visualization

---

## 🔹 Project 1: WooCommerce Product Quantity Synchronization

### 🛒 Problem
Managing stock levels across multiple WooCommerce stores manually is **inefficient and error-prone**.

### ⚙️ Solution
This script **automatically synchronizes product quantities** between multiple WooCommerce websites by:
1. Receiving a **webhook** when an order is placed on any WooCommerce store.
2. Updating a **Google Spreadsheet** with the new product quantities.
3. Running a **check every 10 minutes** to detect changes.
4. Sending an **API request** to the other WooCommerce stores to update their stock levels.

### 📌 Features
- Real-time stock updates
- Automatic API calls to sync quantities
- Scheduled inventory checks every 10 minutes

### 🛠️ Technologies Used
- Google Apps Script
- WooCommerce API
- Webhooks

---

## 🔹 Project 2: Proforma Invoice Generator

### 📝 Problem
Employees needed a **manual** way to generate proforma invoices for customer orders, which was **time-consuming**.

### ⚙️ Solution
A **simple UI with an input field** where an employee enters an **order ID**. The script:
1. Fetches the **order details from WooCommerce**.
2. Uses a **Google Sheets template** to generate the proforma invoice.
3. Converts it into a **PDF**.
4. Sends it via **email** to the employee with a **download link**.

### 📌 Features
- Simple **HTML UI** for order input
- Auto-generated **PDF invoice**
- Instant **email delivery**

### 🛠️ Technologies Used
- Google Apps Script
- WooCommerce API
- HTML/CSS (for the UI)
- Google Sheets as a template

---

## 🔹 Project 3: Automated Order Tracking & Spreadsheet Backup

### 📊 Problem
Employees manually entered new orders into a Google Spreadsheet and **created a new sheet manually each morning**, leading to inefficiencies.

### ⚙️ Solution
This script **automates order tracking and daily backups** by:
1. Receiving **WooCommerce webhooks** to populate a Google Spreadsheet **in real time**.
2. **Automatically duplicating the spreadsheet** every night at midnight.
3. Keeping the **old sheet as a backup** while employees work with the new one.
4. Sending an **email with the new spreadsheet link** to employees.

### 📌 Features
- Automatic order tracking via webhooks
- Scheduled **daily spreadsheet backups**
- Email notifications for employees

### 🛠️ Technologies Used
- Google Apps Script
- WooCommerce Webhooks
- Google Sheets API
- Gmail API (for sending emails)

---

## 📜 Installation & Usage

### 🛠️ Setup Instructions
1. **Deploy Google Apps Script** in Google Sheets.
2. Configure **WooCommerce Webhooks** to send data to the script.
3. Set API credentials for WooCommerce API requests.
4. Test the automation with sample data.

### 📩 Email Configuration
Ensure the script has permission to send emails using **Gmail API**.

---

## 📧 Contact
Want to automate your workflow? **Reach out!**
- **Email:** valentin.diimitrov@gmail.com
- **LinkedIn:** https://www.linkedin.com/in/valentin-dimitrov-tech/
- **Portfolio:** https://valkodim.github.io/

