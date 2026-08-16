const { calculateOrderTotalFromItems } = require('../services/orderPricing');

/**
 * x402 route configuration for payment-protected endpoints.
 * Price is derived from Supabase product prices in the request body.
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
          const totalAmount = await calculateOrderTotalFromItems(body.items || []);
          return `$${totalAmount.toFixed(2)}`;
        },
        maxTimeoutSeconds: 300
      },
      description: 'FarmFresh order checkout requires Algorand Testnet USDC payment',
      mimeType: 'application/json'
    }
  };
}

module.exports = {
  createX402Routes
};
