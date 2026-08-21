const { supabaseAdmin } = require('../config/supabase');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Calculate order total from cart items using server-side Supabase product prices.
 * Never trusts client-supplied prices.
 *
 * @param {Array<{productId: string, quantity: number}>} items
 * @returns {Promise<number>} Total in dollars (e.g. 15.97)
 */
async function calculateOrderTotalFromItems(items) {
  if (!supabaseAdmin) {
    throw new Error('Order pricing unavailable: Supabase is not configured on the server.');
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('At least one item is required.');
  }

  const productIds = items.map((item) => item.productId);

  // All IDs must be valid UUIDs — Supabase will 400 on non-UUID strings
  for (const id of productIds) {
    if (!UUID_RE.test(id)) {
      throw new Error(
        `Invalid product ID "${id}". Products must be loaded from the database before checkout.`
      );
    }
  }

  const { data: products, error: productsError } = await supabaseAdmin
    .from('products')
    .select('id, price')
    .in('id', productIds);

  if (productsError) {
    throw new Error(`Failed to fetch product prices: ${productsError.message}`);
  }

  if (!products || products.length !== productIds.length) {
    const foundIds = (products || []).map((p) => p.id);
    const missing = productIds.filter((id) => !foundIds.includes(id));
    throw new Error(`Products not found in database: ${missing.join(', ')}`);
  }

  let totalAmount = 0;

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    const quantity = Number(item.quantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error(`Invalid quantity ${item.quantity} for product ${item.productId}`);
    }

    totalAmount += Number(product.price) * quantity;
  }

  return totalAmount;
}

module.exports = {
  calculateOrderTotalFromItems
};
