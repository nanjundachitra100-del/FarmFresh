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
  isValidAlgorandAddress
} = require('@x402/avm');

const {
  isSupabaseConfigured
} = require('./src/config/supabase');

const productsRouter = require('./src/routes/products');
const { createX402Routes } = require('./src/config/x402Routes');
const ordersRouter = require('./src/routes/orders');

const app = express();

// Matches the full Testnet CAIP-2 identifier advertised by the configured x402 facilitator.
const ALGORAND_TESTNET_CAIP2 =
  'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=';

const PORT = process.env.PORT || 5000;

const CLIENT_ORIGIN =
  process.env.CLIENT_ORIGIN ||
  'http://localhost:5173';

const ALGORAND_NETWORK =
  process.env.ALGORAND_NETWORK ||
  ALGORAND_TESTNET_CAIP2;

const AVM_ADDRESS =
  process.env.AVM_ADDRESS;

const X402_FACILITATOR_URL =
  process.env.X402_FACILITATOR_URL;

if (!X402_FACILITATOR_URL) {
  console.error(
    'FATAL: X402_FACILITATOR_URL environment variable is required. ' +
    'Set it to https://facilitator.goplausible.xyz for Algorand Testnet.'
  );
  process.exit(1);
}

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
      customerOrders:
        'GET /api/orders/customer/:customerId',
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
