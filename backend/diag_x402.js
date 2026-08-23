/**
 * TEMPORARY DIAGNOSTIC — delete after collecting evidence.
 * Run with:  node diag_x402.js
 *
 * This starts a patched version of the backend that intercepts every
 * POST /api/orders and logs:
 *   - which request number it is (1 = no payment header, 2 = has payment header)
 *   - the raw PAYMENT-SIGNATURE header value (truncated for readability)
 *   - the decoded payment payload (accepted fields)
 *   - the PAYMENT-REQUIRED response header sent back (decoded)
 *   - the PAYMENT-RESPONSE header if present (decoded)
 *   - the final HTTP status
 *
 * Nothing is written to disk; all output goes to stdout.
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { paymentMiddleware } = require('@x402/express');
const { x402ResourceServer, HTTPFacilitatorClient } = require('@x402/core/server');
const { ExactAvmScheme } = require('@x402/avm/exact/server');
const { ALGORAND_TESTNET_CAIP2, isValidAlgorandAddress } = require('@x402/avm');
const { isSupabaseConfigured } = require('./src/config/supabase');
const productsRouter = require('./src/routes/products');
const { createX402Routes } = require('./src/config/x402Routes');
const ordersRouter = require('./src/routes/orders');

// ── helpers ──────────────────────────────────────────────────────────────────
function safeBase64Decode(str) {
  try { return JSON.parse(Buffer.from(str, 'base64').toString('utf8')); } catch { return null; }
}
function tryDecode(header) {
  if (!header) return null;
  return safeBase64Decode(header);
}
function printSection(label, data) {
  console.log('\n' + '─'.repeat(72));
  console.log(`[DIAG] ${label}`);
  console.log(JSON.stringify(data, null, 2));
}

// ── CORS (same as server.js) ─────────────────────────────────────────────────
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const ALGORAND_NETWORK = (() => {
  const raw = process.env.ALGORAND_NETWORK;
  if (!raw) return ALGORAND_TESTNET_CAIP2;
  if (raw === 'algorand-testnet' || raw === 'testnet') return ALGORAND_TESTNET_CAIP2;
  if (raw === 'algorand-mainnet' || raw === 'mainnet') return 'algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73k';
  return raw;
})();
const AVM_ADDRESS = process.env.AVM_ADDRESS;
const X402_FACILITATOR_URL = process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator';

if (!AVM_ADDRESS || !isValidAlgorandAddress(AVM_ADDRESS)) {
  console.error('FATAL: AVM_ADDRESS missing or invalid'); process.exit(1);
}

const app = express();
app.use(cors({
  origin: [CLIENT_ORIGIN,
    'http://localhost:5173','http://127.0.0.1:5173',
    'http://localhost:5174','http://127.0.0.1:5174',
    'http://localhost:5175','http://127.0.0.1:5175'],
  credentials: true,
  exposedHeaders: [
    'PAYMENT-RESPONSE','X-PAYMENT-RESPONSE',
    'PAYMENT-REQUIRED','X-PAYMENT-REQUIRED',
    'PAYMENT-SIGNATURE','X-PAYMENT'
  ]
}));
app.use(express.json());

// ── DIAGNOSTIC INTERCEPTOR (before x402 middleware) ──────────────────────────
let requestCount = 0;
app.use('/api/orders', (req, res, next) => {
  if (req.method !== 'POST') return next();

  requestCount++;
  const reqNum = requestCount;
  const paymentSig = req.headers['payment-signature'] || req.headers['x-payment'] || null;
  const decodedSig = tryDecode(paymentSig);

  console.log('\n' + '═'.repeat(72));
  console.log(`[DIAG] ▶ REQUEST #${reqNum} — POST /api/orders`);
  console.log(`[DIAG]   Has payment header: ${paymentSig ? 'YES' : 'NO'}`);

  if (decodedSig) {
    printSection(`REQUEST #${reqNum} — Decoded PAYMENT-SIGNATURE payload`, {
      x402Version: decodedSig.x402Version,
      scheme: decodedSig.scheme,
      network: decodedSig.network,
      accepted: decodedSig.accepted,
      // show payload structure without the raw transaction bytes (too large)
      payloadKeys: decodedSig.payload ? Object.keys(decodedSig.payload) : 'no payload key',
      payloadPaymentIndex: decodedSig.payload?.paymentIndex,
      payloadGroupLength: decodedSig.payload?.paymentGroup?.length
    });
  }

  // Intercept the response to capture what x402 middleware sends back
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  const originalEnd  = res.end.bind(res);

  const capture = (body) => {
    const status = res.statusCode;
    const paymentRequired  = res.getHeader('payment-required');
    const paymentResponse  = res.getHeader('payment-response') || res.getHeader('x-payment-response');

    console.log('\n' + '─'.repeat(72));
    console.log(`[DIAG] ◀ RESPONSE #${reqNum} — HTTP ${status}`);

    if (paymentRequired) {
      printSection(`RESPONSE #${reqNum} — Decoded PAYMENT-REQUIRED header`, tryDecode(paymentRequired));
    } else {
      console.log('[DIAG]   No PAYMENT-REQUIRED header in response');
    }

    if (paymentResponse) {
      printSection(`RESPONSE #${reqNum} — Decoded PAYMENT-RESPONSE header`, tryDecode(paymentResponse));
    }

    if (status !== 200 && status !== 201) {
      let bodyText = body;
      if (Buffer.isBuffer(body)) bodyText = body.toString('utf8');
      if (typeof bodyText === 'string') {
        try { bodyText = JSON.parse(bodyText); } catch { /* keep string */ }
      }
      printSection(`RESPONSE #${reqNum} — Body`, bodyText);
    }

    console.log('═'.repeat(72) + '\n');
  };

  res.json = function(body) {
    capture(JSON.stringify(body));
    return originalJson(body);
  };
  res.send = function(body) {
    capture(body);
    return originalSend(body);
  };
  res.end = function(chunk, encoding) {
    if (chunk) capture(chunk);
    return originalEnd(chunk, encoding);
  };

  next();
});

// ── x402 middleware & routes (identical to server.js) ────────────────────────
const facilitatorClient = new HTTPFacilitatorClient({ url: X402_FACILITATOR_URL });
const resourceServer = new x402ResourceServer(facilitatorClient)
  .register(ALGORAND_NETWORK, new ExactAvmScheme());
const x402Routes = createX402Routes(AVM_ADDRESS, ALGORAND_NETWORK);

app.use('/api/products', productsRouter);
app.use(paymentMiddleware(x402Routes, resourceServer));
app.use('/api/orders', ordersRouter);

app.get('/health', (req, res) => res.json({
  status: 'healthy', x402Enabled: true,
  network: ALGORAND_NETWORK, facilitatorUrl: X402_FACILITATOR_URL
}));

// ── Start on port 5001 so it doesn't clash with the real backend ─────────────
const DIAG_PORT = 5001;
app.listen(DIAG_PORT, () => {
  console.log(`[DIAG] Diagnostic server running on http://localhost:${DIAG_PORT}`);
  console.log(`[DIAG] Point frontend VITE_API_URL=http://localhost:${DIAG_PORT} for one test run`);
  console.log(`[DIAG] ALGORAND_NETWORK = ${ALGORAND_NETWORK}`);
  console.log(`[DIAG] AVM_ADDRESS      = ${AVM_ADDRESS}`);
  console.log(`[DIAG] Facilitator      = ${X402_FACILITATOR_URL}`);
});
