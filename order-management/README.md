# 📊 Automated Order Tracking & Spreadsheet Backup

## 📌 Overview
This project automates **order tracking and daily spreadsheet backups** using **Google Apps Script**. Instead of employees manually adding new orders and creating daily backups, the script **populates orders in real time** and automatically generates a new spreadsheet at midnight.

## ⚙️ How It Works
1. **WooCommerce sends a webhook** when a new order is placed.
2. The **script updates a Google Spreadsheet** with the order details.
3. Every night at **midnight**, the script **creates a copy of the spreadsheet**.
4. The old copy is **stored as a backup**, and employees continue working with the new one.
5. An **email notification** with a link to the new spreadsheet is sent to employees.

## 📌 Features
✅ **Real-time order tracking** via WooCommerce webhooks.  
✅ **Automated daily spreadsheet backups** at midnight.  
✅ **No manual order entry required**—reducing workload.  
✅ **Backup retention** ensures historical data is stored safely.  
✅ **Email notifications** to employees with the latest spreadsheet link.  

## 🛠️ Technologies Used
- **Google Apps Script** (for automation)
- **WooCommerce Webhooks** (for real-time order tracking)
- **Google Sheets API** (to store order details)
- **Google Drive API** (for creating backups)
- **Gmail API** (for sending email notifications)

## 📜 Setup Instructions
1. **Deploy Google Apps Script** in the target Google Spreadsheet.
2. **Configure WooCommerce Webhooks**:
   - Set up a webhook in **WooCommerce Admin** under **Settings → Advanced → Webhooks**.
   - Choose **Order Created** and set the webhook URL to your script’s Web App endpoint.
3. **Set up a time-based trigger** in Google Apps Script to run the **backup script at midnight**.
4. **Grant permissions** for email notifications.
5. **Test the workflow** by placing a test order.

## 📊 Workflow Diagram

![alt text](<Proforma Generation Diagram.PNG>)

## 🔧 Customization
- Adjust the **backup frequency** (e.g., every 6 hours instead of midnight).
- Add **filters for order types** (e.g., only track paid orders).
- Modify the **email format** or **recipient list**.

## 📩 Contact
Need a custom WooCommerce automation? **Reach out!**
- **Email:** valentin.diimitrov@gmail.com
- **LinkedIn:** https://www.linkedin.com/in/valentin-dimitrov-tech/
- **Portfolio:** [YourWebsite.com]

