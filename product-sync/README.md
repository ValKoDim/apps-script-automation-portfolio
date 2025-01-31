# 🛒 WooCommerce Product Quantity Synchronization

## 📌 Overview
This project automates **inventory synchronization** across multiple WooCommerce stores using **Google Apps Script**. It ensures that product quantities are automatically updated when an order is placed on any connected WooCommerce store.

## ⚙️ How It Works
1. When an **order is placed**, a **WooCommerce webhook** sends the order data to the script.
2. The **script updates** a Google Spreadsheet with the **adjusted stock quantities**.
3. Every **10 minutes**, the script **checks for changes** in the spreadsheet.
4. If product quantities were modified, the script **sends API requests** to update stock levels in the other WooCommerce stores.

## 📌 Features
✅ **Automated stock updates** between multiple WooCommerce websites.  
✅ **Google Spreadsheet** acts as a centralized inventory database.  
✅ **Scheduled sync every 10 minutes** to detect changes and update stock.  
✅ **Real-time webhook updates** upon order placement.  
✅ **Reduces manual stock adjustments** and prevents overselling.  

## 🛠️ Technologies Used
- **Google Apps Script** (for automation)
- **WooCommerce API** (for updating stock levels)
- **Webhooks** (to trigger stock updates in real-time)
- **Google Sheets API** (for storing inventory data)

## 📜 Setup Instructions
1. **Create a Google Spreadsheet** and structure it to store product stock levels.
2. **Deploy Google Apps Script** attached to the spreadsheet.
3. **Configure WooCommerce Webhooks:**
   - Set up a webhook in **WooCommerce Admin** under **Settings → Advanced → Webhooks**.
   - Choose **Order Created** and point it to your Google Apps Script Web App URL.
4. **Set API Credentials** for WooCommerce API access.
5. **Test with a Sample Order** to confirm automatic stock updates.

## 📊 Workflow Diagram

![alt text](<Products Sync Diagram.PNG>)

## 🔧 Customization
- Adjust **sync intervals** by modifying the script's scheduled trigger.
- Add **multiple product categories** to separate inventory tracking.
- Customize **error handling & logging** to track API failures.

## 📩 Contact
Need a custom WooCommerce automation? **Reach out!**
- **Email:** valentin.diimitrov@gmail.com
- **LinkedIn:** https://www.linkedin.com/in/valentin-dimitrov-tech/
- **Portfolio:** https://valkodim.github.io/

