require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { paymentMiddleware } = require('@x402/express');
const {
  x402ResourceServer,
  HTTPFacilitatorClient
} = require('@x402/core/server');

const { ExactAvmScheme } = require('@x402/avm/exact/server');

const {
  ALGORAND_TESTNET_CAIP2,
  isValidAlgorandAddress
} = require('@x402/avm');

const {
  isSupabaseConfigured
} = require('./src/config/supabase');

const productsRouter = require('./src/routes/products');
const { createX402Routes } = require('./src/config/x402Routes');
const ordersRouter = require('./src/routes/orders');
const aiRouter = require('./src/routes/ai');

const app = express();

const PORT = process.env.PORT || 5000;

const CLIENT_ORIGIN =
  process.env.CLIENT_ORIGIN ||
  'http://localhost:5173';

const ALGORAND_NETWORK = (() => {
  const raw = process.env.ALGORAND_NETWORK;
  if (!raw) return ALGORAND_TESTNET_CAIP2;
  // Accept canonical CAIP-2 as-is; also handle legacy short names
  if (raw === 'algorand-testnet' || raw === 'testnet') return ALGORAND_TESTNET_CAIP2;
  if (raw === 'algorand-mainnet' || raw === 'mainnet') return 'algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73k';
  return raw; // assume caller provided valid CAIP-2
})();

const AVM_ADDRESS =
  process.env.AVM_ADDRESS;

const X402_FACILITATOR_URL =
  process.env.X402_FACILITATOR_URL ||
  'https://x402.org/facilitator';

// Validate x402 receiver address
if (!AVM_ADDRESS) {
  console.error(
    'FATAL: AVM_ADDRESS environment variable is required for x402 payments.'
  );

  process.exit(1);
}

if (!isValidAlgorandAddress(AVM_ADDRESS)) {
  console.error(
    'FATAL: AVM_ADDRESS is not a valid Algorand address.'
  );

  process.exit(1);
}

if (ALGORAND_NETWORK !== ALGORAND_TESTNET_CAIP2) {
  console.warn(
    `[x402] Warning: ALGORAND_NETWORK is "${ALGORAND_NETWORK}". FarmFresh is configured for Algorand Testnet only (${ALGORAND_TESTNET_CAIP2}).`
  );
}

// CORS
app.use(
  cors({
    origin: [
      CLIENT_ORIGIN,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5174',
      'http://localhost:5175',
      'http://127.0.0.1:5175',
      'http://localhost:5177',
      'http://127.0.0.1:5177'
    ],
    credentials: true,
    exposedHeaders: [
      'PAYMENT-RESPONSE',
      'X-PAYMENT-RESPONSE',
      'PAYMENT-REQUIRED',
      'X-PAYMENT-REQUIRED',
      'PAYMENT-SIGNATURE',
      'X-PAYMENT'
    ]
  })
);

// JSON body parser
app.use(express.json());

// x402 facilitator
const facilitatorClient =
  new HTTPFacilitatorClient({
    url: X402_FACILITATOR_URL
  });

// x402 resource server
const resourceServer =
  new x402ResourceServer(
    facilitatorClient
  ).register(
    ALGORAND_NETWORK,
    new ExactAvmScheme()
  );

// x402 protected routes
const x402Routes =
  createX402Routes(
    AVM_ADDRESS,
    ALGORAND_NETWORK
  );

// API routers (products first so public GETs are not intercepted)
app.use(
  '/api/products',
  productsRouter
);

// Public AI Assistant Chat Router
app.use(
  '/api/ai',
  aiRouter
);

// Official x402 middleware (apply before orders router so x402-protected
// endpoints such as POST /api/orders are handled, but products GET remains public)
app.use(
  paymentMiddleware(
    x402Routes,
    resourceServer
  )
);

app.use(
  '/api/orders',
  ordersRouter
);

// ---------------------------------------------------------------------------
// M2M Delivery Optimizer — x402-protected endpoint
// The paymentMiddleware already handles verification/settlement before this
// handler runs. Only requests that have passed payment verification reach here.
// ---------------------------------------------------------------------------

// Determine M2M receiver address: prefer M2M_RECEIVER_ADDRESS, fall back to AVM_ADDRESS
const M2M_RECEIVER_ADDRESS = process.env.M2M_RECEIVER_ADDRESS || AVM_ADDRESS;

// Price for the M2M delivery optimization service (in USD/USDC)
const M2M_SERVICE_PRICE = process.env.M2M_SERVICE_PRICE || '0.10';

// Register the M2M route with x402 payment protection
const m2mX402Routes = {
  'POST /api/m2m/delivery-optimizer': {
    accepts: {
      scheme: 'exact',
      network: ALGORAND_NETWORK,
      payTo: M2M_RECEIVER_ADDRESS,
      price: M2M_SERVICE_PRICE,
      maxTimeoutSeconds: 120
    },
    description: 'FarmFresh M2M Delivery Optimizer — requires USDC payment on Algorand Testnet',
    mimeType: 'application/json'
  }
};

app.use(
  paymentMiddleware(
    m2mX402Routes,
    resourceServer
  )
);

app.post('/api/m2m/delivery-optimizer', (req, res) => {
  console.log('[M2M Endpoint] POST /api/m2m/delivery-optimizer — payment verified, serving response.');
  res.json({
    success: true,
    deliveryFee: 2.50,
    estimatedDays: 1,
    provider: 'EcoExpress M2M',
    message: 'Delivery successfully optimized by EcoExpress M2M service.'
  });
});


// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message:
      'FarmFresh backend API is running',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      products: 'GET /api/products',
      productDetail:
        'GET /api/products/:id',
      createProduct:
        'POST /api/products',
      updateProduct:
        'PUT /api/products/:id',
      deleteProduct:
        'DELETE /api/products/:id',
      orders: 'POST /api/orders',
      farmerOrders:
        'GET /api/orders/farmer/:farmerId',
      updateOrderStatus:
        'PATCH /api/orders/:id/status'
    },
    timestamp:
      new Date().toISOString()
  });
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    supabaseConnected:
      isSupabaseConfigured(),
    x402Enabled: true,
    network: ALGORAND_NETWORK,
    facilitatorUrl:
      X402_FACILITATOR_URL,
    timestamp:
      new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(
    `FarmFresh backend running on http://localhost:${PORT}`
  );

  console.log(
    `Allowed CORS Origin: ${CLIENT_ORIGIN}`
  );

  console.log(
    `x402 Algorand network: ${ALGORAND_NETWORK}`
  );

  console.log(
    `x402 payment receiver: ${AVM_ADDRESS}`
  );

  console.log(
    `x402 facilitator: ${X402_FACILITATOR_URL}`
  );
});