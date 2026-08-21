const { calculateOrderTotalFromItems } = require('../services/orderPricing');

/**
 * x402 route configuration for payment-protected endpoints.
 * Price is dynamically calculated from real Supabase product prices.
 * The price function is called by paymentMiddleware BEFORE the order handler,
 * so it must not modify state — only calculate the amount.
 */
function createX402Routes(avmAddress, algorandNetwork) {
  return {
    'POST /api/orders': {
      accepts: {
        scheme: 'exact',
        network: algorandNetwork,
        payTo: avmAddress,
        price: async (context) => {
          const body = context.adapter.getBody?.() ?? {};
          const items = body.items;

          console.log('[x402] Calculating order price for items:', JSON.stringify(items));

          if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error('No items provided for price calculation');
          }

          // Validate all product IDs are UUIDs before querying Supabase
          const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          const invalid = items.filter((item) => !UUID_RE.test(item.productId));
          if (invalid.length > 0) {
            throw new Error(
              `Invalid product IDs (not UUIDs): ${invalid.map((i) => i.productId).join(', ')}. ` +
              'Please reload the product catalog and add items again.'
            );
          }

          const totalAmount = await calculateOrderTotalFromItems(items);
          console.log('[x402] Calculated total:', totalAmount.toFixed(2), 'USDC');
          // Return decimal dollar string — ExactAvmScheme.parsePrice handles "15.97" → USDC micro-units
          return `${totalAmount.toFixed(2)}`;
        },
        maxTimeoutSeconds: 300
      },
      description: 'FarmFresh order checkout requires Algorand Testnet USDC payment via x402',
      mimeType: 'application/json'
    }
  };
}

module.exports = {
  createX402Routes
};
