const spreadsheet = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('tableId'));

const sheet = spreadsheet.getSheetByName('Orders');



function doPost(e) {

  const data = JSON.parse(e.postData.contents);

  const webhookSource = e.parameter.source;



  const result = updateOrder(data, webhookSource);



  return ContentService.createTextOutput(JSON.stringify({ message: result }))

    .setMimeType(ContentService.MimeType.JSON);

}



function updateOrder(data, webhookSource) {

  const status = data.status;

  const billingInfo = data.billing;

  const shippingInfo = data.shipping;

  const items = data.line_items;

   const shippingMethod = data.shipping_lines.length > 0 ? data.shipping_lines[0].method_title : "No Shipping Method";



  // Extract order-level details

  const orderId = data.id;

  const orderDate = data.date_created;

  const shippingAddress = `${shippingInfo.address_1} ${shippingInfo.address_2}`;

  const postcode = shippingInfo.postcode;

  const note = data.customer_note;

  const email = billingInfo.email;

  const phone = billingInfo.phone;

  const customerName = `${billingInfo.first_name} ${billingInfo.last_name}`;



  // Prepare item details

  items.reverse();

  const itemDetails = items

    .map(item => `(${item.quantity}) ${item.name}`)

    .join(', ');



  // Find the first empty row in the Order ID column (assumed to be column 5)

  const lastRow = sheet.getLastRow();

  const orderIdColumn = 5; // Order ID is in column 5

  let firstEmptyRow = lastRow + 1;



  for (let row = 1; row <= lastRow; row++) {

    const cellValue = sheet.getRange(row, orderIdColumn).getValue();

    if (!cellValue) {

      firstEmptyRow = row;

      break;

    }

  }



  // Insert a new row at the first empty position

  sheet.insertRowBefore(firstEmptyRow);



  // Populate the new row with data

  const rowData = [

    '', // Empty column

    status, // Order status

    orderDate, // Order placed date

    '', // Empty column

    webhookSource, // Webhook source

    '', // Empty column

    orderId, // Order ID

    shippingAddress, // Shipping address 1+2

    postcode, // Postcode

    itemDetails, // Item details

    note, // note column

    shippingMethod, // shipping method

    email, // Email

    phone, // Phone

    customerName, // First name + last name

  ];



  // Write the data to the new row

  sheet.getRange(firstEmptyRow, 1, 1, rowData.length).setValues([rowData]);



  return `Order ${orderId} updated successfully.`;

}





function copyAndReplaceSpreadsheet() {

  const scriptProperties = PropertiesService.getScriptProperties();



  // Get the stored table ID

  const currentTableId = scriptProperties.getProperty('tableId');

  if (!currentTableId) {

    Logger.log('No tableId found in PropertiesService. Please set it first.');

    return;

  }



  try {

    // Open the original spreadsheet

    const originalSpreadsheet = SpreadsheetApp.openById(currentTableId);



    // Generate the new name: "Saris Route - [current date]"

    const tomorrow = new Date();

    tomorrow.setDate(tomorrow.getDate() + 1); // Increment by 1 day

    const newSpreadsheetName = `Saris Route - ${Utilities.formatDate(tomorrow, Session.getScriptTimeZone(), 'dd.MM.yy')}`;





    // Create a copy of the spreadsheet

    const newSpreadsheet = originalSpreadsheet.copy(newSpreadsheetName);



    // Get the new file ID

    const originalFile = DriveApp.getFileById(currentTableId);

    const newFile = DriveApp.getFileById(newSpreadsheet.getId());



    // Set the new file to be public with view access

    newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);



    // Copy permissions from the original file to the new one

    const editors = originalFile.getEditors();

    const viewers = originalFile.getViewers();



    // Add editors to the new file

    editors.forEach(editor => {

      newFile.addEditor(editor.getEmail());

    });



    // Add viewers to the new file

    viewers.forEach(viewer => {

      newFile.addViewer(viewer.getEmail());

    });



    // Update the tableId in PropertiesService with the new spreadsheet ID

    scriptProperties.setProperty('tableId', newSpreadsheet.getId());



    // Send an email notification

    const recipient = "YOUR_EMAIL_1_PLACEHOLDER";

    const recipient2 = "YOUR_EMAIL_2_PLACEHOLDER";

    const recipient3 = "YOUR_EMAIL_3_PLACEHOLDER";

    const subject = `New Spreadsheet Created: ${newSpreadsheetName}`;

    const body = `A new spreadsheet has been created and is available at the following link:\n\n${newSpreadsheet.getUrl()}`;

    MailApp.sendEmail(recipient, subject, body);

    MailApp.sendEmail(recipient2, subject, body);

    MailApp.sendEmail(recipient3, subject, body);



    Logger.log(`Spreadsheet copied and made public: ${newSpreadsheet.getUrl()}`);

    Logger.log(`New tableId set: ${newSpreadsheet.getId()}`);

  } catch (error) {

    Logger.log(`Error: ${error.message}`);

  }

}

function setInitialTableId(tableId) {

  const scriptProperties = PropertiesService.getScriptProperties();

  scriptProperties.setProperty('tableId', tableId);

  Logger.log(`Initial tableId set: ${tableId}`);

}



function setUp() {

  setInitialTableId('YOUR_SPREADSHEET_ID_PLACEHOLDER');

}