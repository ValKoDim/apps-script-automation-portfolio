# 📄 Proforma Invoice Generator

## 📌 Overview
This project automates **proforma invoice generation** using **Google Apps Script**. Employees can enter an **order ID** through a simple UI, and the script will generate a **PDF invoice** using a Google Sheets template, then email it to them.

## ⚙️ How It Works
1. **Employee enters an order ID** into a simple HTML UI.
2. The **script fetches the order details** from WooCommerce via API.
3. A **Google Sheets template** is populated with the order data.
4. The sheet is converted into a **PDF invoice**.
5. The invoice is **sent via email** to the employee with a **download link**.

## 📌 Features
✅ **Simple UI** for employees to generate invoices quickly.  
✅ **Automated PDF generation** using a Google Sheets template.  
✅ **WooCommerce API integration** for fetching order details.  
✅ **Email delivery** with the invoice attached.  
✅ **Eliminates manual invoice creation**, saving time and reducing errors.  

## 🛠️ Technologies Used
- **Google Apps Script** (for automation)
- **WooCommerce API** (to fetch order data)
- **HTML & JavaScript** (for the UI input field)
- **Google Sheets** (as the invoice template)
- **Google Drive API** (to generate the PDF)
- **Gmail API** (to send emails)

## 📜 Setup Instructions
1. **Deploy Google Apps Script** in Google Sheets.
2. **Set up the WooCommerce API key** in the script for order fetching.
3. **Customize the invoice template** in Google Sheets.
4. **Test the UI** by entering a sample order ID.
5. **Ensure email permissions** for sending invoices.

## 📊 Workflow Diagram

![alt text](<Proforma Generation Diagram.PNG>)

## 🔧 Customization
- Modify the **Google Sheets template** to match your invoice format.
- Change the **email content and formatting**.
- Add **support for multiple languages or currencies**.

## 📩 Contact
Need a custom WooCommerce automation? **Reach out!**
- **Email:** valentin.diimitrov@gmail.com
- **LinkedIn:** https://www.linkedin.com/in/valentin-dimitrov-tech/
- **Portfolio:** https://valkodim.github.io/

