require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { paymentMiddleware } = require('@x402/express');
const { x402ResourceServer, HTTPFacilitatorClient } = require('@x402/core/server');
const { ExactAvmScheme } = require('@x402/avm/exact/server');
const { ALGORAND_TESTNET_CAIP2, isValidAlgorandAddress } = require('@x402/avm');
const { isSupabaseConfigured } = require('./src/config/supabase');
const { createX402Routes } = require('./src/config/x402Routes');
const ordersRouter = require('./src/routes/orders');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const ALGORAND_NETWORK = process.env.ALGORAND_NETWORK || ALGORAND_TESTNET_CAIP2;
const AVM_ADDRESS = process.env.AVM_ADDRESS;
const X402_FACILITATOR_URL = process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator';

if (!AVM_ADDRESS) {
  console.error('FATAL: AVM_ADDRESS environment variable is required for x402 payments.');
  process.exit(1);
}

if (!isValidAlgorandAddress(AVM_ADDRESS)) {
  console.error('FATAL: AVM_ADDRESS is not a valid Algorand address.');
  process.exit(1);
}

if (ALGORAND_NETWORK !== ALGORAND_TESTNET_CAIP2) {
  console.warn(
    `[x402] Warning: ALGORAND_NETWORK is "${ALGORAND_NETWORK}". FarmFresh is configured for Algorand Testnet only (${ALGORAND_TESTNET_CAIP2}).`
  );
}

app.use(cors({
  origin: [CLIENT_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  exposedHeaders: [
    'PAYMENT-RESPONSE',
    'X-PAYMENT-RESPONSE',
    'PAYMENT-REQUIRED',
    'X-PAYMENT-REQUIRED',
    'PAYMENT-SIGNATURE',
    'X-PAYMENT'
  ]
}));

app.use(express.json());

const facilitatorClient = new HTTPFacilitatorClient({
  url: X402_FACILITATOR_URL
});

const resourceServer = new x402ResourceServer(facilitatorClient)
  .register(ALGORAND_NETWORK, new ExactAvmScheme());

const x402Routes = createX402Routes(AVM_ADDRESS, ALGORAND_NETWORK);

// Official x402 middleware — verifies/settles payments via facilitator before order handlers run
app.use(paymentMiddleware(x402Routes, resourceServer));

app.use('/api/orders', ordersRouter);

app.get('/', (req, res) => {
  res.json({
    message: 'FarmFresh backend API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    supabaseConnected: isSupabaseConfigured(),
    x402Enabled: true,
    network: ALGORAND_NETWORK,
    facilitatorUrl: X402_FACILITATOR_URL,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`FarmFresh backend running on http://localhost:${PORT}`);
  console.log(`Allowed CORS Origin: ${CLIENT_ORIGIN}`);
  console.log(`x402 Algorand network: ${ALGORAND_NETWORK}`);
  console.log(`x402 payment receiver: ${AVM_ADDRESS}`);
  console.log(`x402 facilitator: ${X402_FACILITATOR_URL}`);
});
