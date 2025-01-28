// Constants
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_PLACEHOLDER';
const PRODUCTS_SHEET_NAME = 'PRODUCTS_SHEET_NAME_PLACEHOLDER';
const ORDERS_SHEET_NAME = 'ORDERS_SHEET_NAME_PLACEHOLDER';

// Open spreadsheet and sheets
const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
const productSheet = spreadsheet.getSheetByName(PRODUCTS_SHEET_NAME);
const orderSheet = spreadsheet.getSheetByName(ORDERS_SHEET_NAME);

// Fetch product data from the sheet
const dataRange = productSheet.getDataRange();
let values = dataRange.getValues();

// Handle incoming POST requests (e.g., webhook from WooCommerce)
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const result = updateQuantity(data);

    return ContentService.createTextOutput(JSON.stringify({ message: result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log('Error in doPost: ' + error.message);
    return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid Request' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Update quantities based on order data
function updateQuantity(data) {
  const items = data.line_items || [];
  const status = data.status || 'unknown';

  if (status === 'processing') {
    items.forEach((item) => {
      const sku = item.sku || 'UNKNOWN_SKU';
      const quantity = item.quantity || 0;

      const product = findProductBySku(sku); // Search for product in the productsCells
      if (product) {
        const [row, col] = product.position;
        const currentQuantity = values[row][col];
        const newQuantity = currentQuantity - quantity;

        // Update quantity and timestamp
        productSheet.getRange(row + 1, col + 1).setValue(newQuantity);
        productSheet.getRange(row + 1, col + 2).setValue(new Date());
        values[row][col] = newQuantity; // Sync in-memory values
      }
    });
  } else if (status === 'cancelled') {
    Logger.log('Order cancelled, no changes applied.');
  } else {
    Logger.log('Unhandled order status: ' + status);
    return 'No updates performed.';
  }

  return 'Quantity updated successfully.';
}

// Helper function to find product by SKU
function findProductBySku(sku) {
  return productsCells.find(product => product.skuCode.includes(sku)) || null;
}
