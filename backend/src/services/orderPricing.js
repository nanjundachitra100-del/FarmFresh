const { supabaseAdmin } = require('../config/supabase');

/**
 * Calculate order total from cart items using Supabase product prices.
 * Never trusts client-supplied prices.
 */
async function calculateOrderTotalFromItems(items) {
  if (!supabaseAdmin) {
    throw new Error('Order pricing unavailable: Supabase is not configured');
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('At least one item is required');
  }

  const productIds = items.map((item) => item.productId);

  const { data: products, error: productsError } = await supabaseAdmin
    .from('products')
    .select('id, price')
    .in('id', productIds);

  if (productsError) {
    throw new Error(productsError.message);
  }

  if (!products || products.length !== productIds.length) {
    throw new Error('One or more products were not found');
  }

  let totalAmount = 0;

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);

    if (!product) {
      throw new Error(`Product ${item.productId} not found`);
    }

    const quantity = Number(item.quantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error(`Invalid quantity for product ${item.productId}`);
    }

    totalAmount += Number(product.price) * quantity;
  }

  return totalAmount;
}

module.exports = {
  calculateOrderTotalFromItems
};
