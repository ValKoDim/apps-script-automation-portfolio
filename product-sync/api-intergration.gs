// WooCommerce API Configuration
const BASE_URL = 'https://example.com/wp-json/wc/v3/products';
const CONSUMER_KEY = 'YOUR_CONSUMER_KEY_PLACEHOLDER';
const CONSUMER_SECRET = 'YOUR_CONSUMER_SECRET_PLACEHOLDER';

// Fetch product by SKU from WooCommerce
function getProductBySku(url) {
  const response = UrlFetchApp.fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const products = JSON.parse(response.getContentText());
  return products[0];
}

// Update stock in WooCommerce
function updateWooCommerceStock(productSku, quantity) {
  const productUrl = `${BASE_URL}?sku=${productSku}&consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
  const product = getProductBySku(productUrl);

  if (product) {
    const updateUrl = `${BASE_URL}/${product.id}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
    const payload = JSON.stringify({ stock_quantity: quantity });

    const response = UrlFetchApp.fetch(updateUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      payload,
    });

    Logger.log(`Updated stock for SKU ${productSku}: ${response.getContentText()}`);
  } else {
    Logger.log(`Product with SKU ${productSku} not found.`);
  }
}
