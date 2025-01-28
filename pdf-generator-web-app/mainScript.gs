// WooCommerce API Configuration
const WOOCOMMERCE_URL = 'https://YOUR_STORE_URL_PLACEHOLDER/wp-json/wc/v3/orders/';
const CONSUMER_KEY = 'YOUR_CONSUMER_KEY_PLACEHOLDER';
const CONSUMER_SECRET = 'YOUR_CONSUMER_SECRET_PLACEHOLDER';

// Email recipient for the generated proforma invoices
const EMPLOYEE_EMAIL = 'YOUR_EMPLOYEE_EMAIL_PLACEHOLDER';

// Properties Service to manage persistent values
const properties = PropertiesService.getScriptProperties();
const proformaNumber = Number(properties.getProperty('proformaNumber')) || 1;
const newProformaNumber = proformaNumber + 1;

// Serve the UI HTML page
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Proforma Invoice Generator');
}

// Main function to process input (order ID)
function processInput(orderId) {
  const response = fetchWooCommerceOrder(orderId);
  if (!response) {
    return 'Error retrieving order details. Please check the Order ID.';
  }

  const invoiceBlob = generateProformaInvoice(response);
  sendInvoiceEmail(EMPLOYEE_EMAIL, invoiceBlob);

  return 'Proforma invoice generated and sent successfully!';
}

// Fetch order details from WooCommerce
function fetchWooCommerceOrder(orderId) {
  const url = `${WOOCOMMERCE_URL}${orderId}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
  const options = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    return JSON.parse(response.getContentText());
  } catch (error) {
    Logger.log('Error fetching order: ' + error.message);
    return null;
  }
}

// Generate the proforma invoice as a PDF
function generateProformaInvoice(order) {
  const TEMPLATE_ID = 'YOUR_TEMPLATE_FILE_ID_PLACEHOLDER'; // Replace with your Google Drive file ID.
  const file = DriveApp.getFileById(TEMPLATE_ID).makeCopy();
  const sheet = SpreadsheetApp.open(file).getActiveSheet();

  // Format date
  const rawDate = new Date(order.date_created);
  const formattedDate = `${rawDate.getFullYear()}-${(rawDate.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${rawDate.getDate().toString().padStart(2, '0')}`;

  // Set invoice header details
  sheet.getRange('E8').setValue(newProformaNumber);
  sheet.getRange('F10').setValue(`${order.id}`);
  sheet.getRange('B11').setValue(order.billing.first_name + ' ' + order.billing.last_name);
  sheet.getRange('B12').setValue(order.billing.email);
  sheet.getRange('D11').setValue(order.shipping.first_name + ' ' + order.shipping.last_name);
  sheet.getRange('D12').setValue(order.shipping.email);
  sheet.getRange('F11').setValue(formattedDate);
  sheet.getRange('F32').setValue(order.total_tax);
  sheet.getRange('F33').setValue(order.discount_total);
  sheet.getRange('F35').setValue(order.shipping_total);

  // Write product info to the table
  const startRow = 17;
  const productRange = sheet.getRange(startRow, 2, order.line_items.length, 5); // Range B17:F...
  productRange.clearContent();

  order.line_items.forEach((item, index) => {
    const row = startRow + index;
    sheet.getRange(row, 2).setValue(item.name); // Product name
    sheet.getRange(row, 4).setValue(item.quantity); // Quantity
    sheet.getRange(row, 5).setValue(item.price.toFixed(2)); // Unit Price
    sheet.getRange(row, 6).setValue((item.quantity * item.price).toFixed(2)); // Total
  });

  // Generate the invoice PDF
  SpreadsheetApp.flush();
  const invoiceBlob = file.getAs('application/pdf');
  properties.setProperty('proformaNumber', newProformaNumber);

  return invoiceBlob;
}

// Send the invoice via email
function sendInvoiceEmail(to, invoiceBlob) {
  const subject = 'Proforma Invoice';
  const body = `
    Please find your proforma invoice attached.
    This invoice was automatically generated. Ensure details are reviewed before use.
  `;
  MailApp.sendEmail({
    to,
    subject,
    body,
    attachments: [invoiceBlob],
  });
}

// Function to test the process
function testRun() {
  processInput('ORDER_ID_PLACEHOLDER'); // Replace with a test Order ID
}

// Function to initialize proforma number
function saveProformaNumber() {
  properties.setProperty('proformaNumber', 1); // Starting number
}
