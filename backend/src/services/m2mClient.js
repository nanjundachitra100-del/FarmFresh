const { x402Client, x402HTTPClient } = require('@x402/core/client');
const { ExactAvmScheme } = require('@x402/avm/exact/client');
const { ALGORAND_TESTNET_CAIP2, getTransactionId, decodeSignedTransaction } = require('@x402/avm');
const algosdk = require('algosdk');

/**
 * Derives the Algorand transaction ID from a base64-encoded signed transaction.
 * Returns null if derivation fails.
 */
function extractTxId(base64SignedTxn) {
  if (!base64SignedTxn) return null;
  try {
    const bytes = Buffer.from(base64SignedTxn, 'base64');
    return getTransactionId(new Uint8Array(bytes));
  } catch (err) {
    console.warn('[m2mClient] Could not extract txID:', err.message);
    return null;
  }
}

/**
 * Decodes a base64 payment-required header.
 */
function decodePaymentRequiredHeader(headerVal) {
  if (!headerVal) return null;
  try {
    return JSON.parse(Buffer.from(headerVal, 'base64').toString('utf8'));
  } catch (err) {
    console.error('[m2mClient] Failed to decode payment-required header:', err.message);
    return null;
  }
}

/**
 * Returns the human-readable USDC amount from a payment requirements object.
 * amount field is in micro-USDC (6 decimals), asset 10458941 = testnet USDC.
 */
function formatUsdcAmount(requirements) {
  try {
    const accepts = requirements?.accepts || [];
    const req = accepts[0];
    if (!req) return null;
    const microAmount = BigInt(req.amount);
    const dollars = Number(microAmount) / 1_000_000;
    return `${dollars.toFixed(2)} USDC`;
  } catch {
    return null;
  }
}

/**
 * Automates requesting the protected M2M delivery-optimizer endpoint via x402.
 *
 * Flow:
 *   1. POST /api/m2m/delivery-optimizer (no payment header) → expect 402
 *   2. Decode PAYMENT-REQUIRED header from the 402 response
 *   3. Build + sign Algorand Testnet USDC transaction using M2M_ALGORAND_MNEMONIC
 *   4. Retry the POST with PAYMENT-SIGNATURE header
 *   5. Extract Algorand transaction ID from the signed payment group
 *   6. Return structured result to the AI router
 *
 * Security: M2M_ALGORAND_MNEMONIC is read ONLY from backend env. Never exposed to frontend.
 */
async function callDeliveryOptimizer(items = []) {
  const port = process.env.PORT || 5000;
  const baseUrl = process.env.BACKEND_URL || `http://localhost:${port}`;
  const url = `${baseUrl}/api/m2m/delivery-optimizer`;

  console.log(`[m2mClient] Requesting M2M delivery optimization: ${url}`);

  try {
    // ── 1. Initial unauthenticated request ──────────────────────────────────
    const initialResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });

    if (initialResponse.status !== 402) {
      // Endpoint responded without requiring payment
      const data = await initialResponse.json();
      console.log(`[m2mClient] M2M responded ${initialResponse.status} without 402`);
      return {
        success: initialResponse.ok,
        status: initialResponse.status,
        m2mStatus: 'already_paid_or_free',
        data
      };
    }

    // ── 2. Got 402 — decode payment requirements ────────────────────────────
    console.log('[m2mClient] 402 Payment Required received from M2M service.');

    const reqHeader =
      initialResponse.headers.get('payment-required') ||
      initialResponse.headers.get('PAYMENT-REQUIRED');

    if (!reqHeader) {
      throw new Error('M2M service returned 402 but no PAYMENT-REQUIRED header was found.');
    }

    const decodedRequirements = decodePaymentRequiredHeader(reqHeader);
    const amountLabel = formatUsdcAmount(decodedRequirements) || 'unknown amount';

    console.log(`[m2mClient] Payment required: ${amountLabel}`);

    // ── 3. Check mnemonic ───────────────────────────────────────────────────
    const mnemonic = process.env.M2M_ALGORAND_MNEMONIC;
    if (!mnemonic || !mnemonic.trim()) {
      console.log('[m2mClient] M2M_ALGORAND_MNEMONIC not configured — cannot pay automatically.');
      return {
        success: false,
        status: 402,
        m2mStatus: 'payment_required',
        paymentAmount: amountLabel,
        message: 'M2M payment required but M2M_ALGORAND_MNEMONIC is not configured in backend environment.',
        requirements: decodedRequirements
      };
    }

    // ── 4. Build signer from mnemonic ───────────────────────────────────────
    let account;
    try {
      account = algosdk.mnemonicToSecretKey(mnemonic.trim());
    } catch (err) {
      throw new Error(`Invalid M2M_ALGORAND_MNEMONIC: ${err.message}`);
    }

    const senderAddress = account.addr.toString();
    console.log(`[m2mClient] Signing M2M payment using address: ${senderAddress}`);

    const signer = {
      address: senderAddress,
      signTransactions: async (encodedTxns, clientIndexes) => {
        console.log(`[m2mClient] Signing ${encodedTxns.length} txn(s), indexes: ${JSON.stringify(clientIndexes)}`);
        return encodedTxns.map((txnBytes, i) => {
          if (clientIndexes.includes(i)) {
            const txn = algosdk.decodeUnsignedTransaction(txnBytes);
            return txn.signTxn(account.sk);
          }
          return null;
        });
      }
    };

    // ── 5. Create x402 client and payment payload ───────────────────────────
    const client = new x402Client()
      .register(ALGORAND_TESTNET_CAIP2, new ExactAvmScheme(signer));

    const httpClient = new x402HTTPClient(client);

    // Read the payment-required body (some servers also include it in the body)
    let bodyData = null;
    try {
      const text = await initialResponse.clone().text();
      if (text) bodyData = JSON.parse(text);
    } catch { /* ignore */ }

    const getHeader = (name) => initialResponse.headers.get(name);
    const paymentRequired = httpClient.getPaymentRequiredResponse(getHeader, bodyData);

    console.log('[m2mClient] Creating payment payload...');
    const paymentPayload = await client.createPaymentPayload(paymentRequired);

    // ── 6. Encode the payment header ────────────────────────────────────────
    const paymentHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload);

    console.log('[m2mClient] Payment signed. Retrying with PAYMENT-SIGNATURE...');

    // ── 7. Retry request with payment proof ─────────────────────────────────
    const retryResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...paymentHeaders
      },
      body: JSON.stringify({ items })
    });

    const retryData = await retryResponse.json().catch(() => ({}));
    console.log(`[m2mClient] Retry responded HTTP ${retryResponse.status}`);

    // ── 8. Process payment result ────────────────────────────────────────────
    await httpClient.processPaymentResult(
      paymentPayload,
      (name) => retryResponse.headers.get(name),
      retryResponse.status
    );

    // ── 9. Extract Algorand transaction ID ───────────────────────────────────
    let transactionId = null;
    try {
      const { payload } = paymentPayload;
      const signedTxnBase64 = payload?.paymentGroup?.[payload.paymentIndex];
      transactionId = extractTxId(signedTxnBase64);
      if (transactionId) {
        console.log(`[m2mClient] Algorand Testnet txID: ${transactionId}`);
      }
    } catch (err) {
      console.warn('[m2mClient] Could not extract txID:', err.message);
    }

    return {
      success: retryResponse.ok,
      status: retryResponse.status,
      m2mStatus: retryResponse.ok ? 'paid' : 'error',
      paymentAmount: amountLabel,
      transactionId,
      data: retryData
    };

  } catch (err) {
    console.error('[m2mClient] Error during M2M x402 flow:', err.message);
    return {
      success: false,
      m2mStatus: 'error',
      message: err.message || 'M2M payment flow failed.'
    };
  }
}

module.exports = { callDeliveryOptimizer };
