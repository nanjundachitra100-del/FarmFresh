require('dotenv').config();

const { x402Client, x402HTTPClient } = require('@x402/core/client');
const { ExactAvmScheme } = require('@x402/avm/exact/client');
const {
  ALGORAND_TESTNET_CAIP2,
  getTransactionId
} = require('@x402/avm');
const algosdk = require('algosdk');

function extractTxId(base64SignedTxn) {
  if (!base64SignedTxn) return null;

  try {
    const bytes = Buffer.from(base64SignedTxn, 'base64');
    return getTransactionId(new Uint8Array(bytes));
  } catch (err) {
    console.warn(
      '[m2mClient] Could not extract txID:',
      err.message
    );
    return null;
  }
}

function decodePaymentRequiredHeader(headerValue) {
  if (!headerValue) return null;

  try {
    return JSON.parse(
      Buffer.from(headerValue, 'base64').toString('utf8')
    );
  } catch (err) {
    console.error(
      '[m2mClient] Failed to decode payment-required header:',
      err.message
    );
    return null;
  }
}

function formatUsdcAmount(requirements) {
  try {
    const accepts = requirements?.accepts || [];
    const req = accepts[0];

    if (!req) return null;

    const microAmount = BigInt(req.amount);
    const usdc = Number(microAmount) / 1_000_000;

    return `${usdc.toFixed(2)} USDC`;
  } catch {
    return null;
  }
}

async function callDeliveryOptimizer(items = []) {
  const port = process.env.PORT || 5000;

  const baseUrl =
    process.env.BACKEND_URL ||
    `http://localhost:${port}`;

  const url =
    `${baseUrl}/api/m2m/delivery-optimizer`;

  console.log(
    '[m2mClient] Requesting M2M delivery optimization:',
    url
  );

  try {
    // ---------------------------------------------------------
    // STEP 1: Initial request
    // ---------------------------------------------------------

    const initialResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ items })
    });

    if (initialResponse.status !== 402) {
      const data = await initialResponse
        .json()
        .catch(() => ({}));

      console.log(
        '[m2mClient] M2M responded',
        initialResponse.status,
        'without 402'
      );

      return {
        success: initialResponse.ok,
        status: initialResponse.status,
        m2mStatus: 'already_paid_or_free',
        data
      };
    }

    console.log(
      '[m2mClient] 402 Payment Required received from M2M service.'
    );

    // ---------------------------------------------------------
    // STEP 2: Read PAYMENT-REQUIRED header
    // ---------------------------------------------------------

    const paymentRequiredHeader =
      initialResponse.headers.get('payment-required');

    if (!paymentRequiredHeader) {
      throw new Error(
        '402 response did not contain PAYMENT-REQUIRED header.'
      );
    }

    const requirements =
      decodePaymentRequiredHeader(paymentRequiredHeader);

    if (!requirements) {
      throw new Error(
        'Could not decode PAYMENT-REQUIRED header.'
      );
    }

    console.log(
      '[m2mClient] Payment requirements:',
      JSON.stringify(requirements, null, 2)
    );

    const amountLabel =
      formatUsdcAmount(requirements) ||
      'unknown amount';

    console.log(
      '[m2mClient] Payment required:',
      amountLabel
    );

    // ---------------------------------------------------------
    // STEP 3: Load M2M wallet
    // ---------------------------------------------------------

    const mnemonic =
      process.env.M2M_ALGORAND_MNEMONIC;

    if (!mnemonic || !mnemonic.trim()) {
      return {
        success: false,
        status: 402,
        m2mStatus: 'payment_required',
        paymentAmount: amountLabel,
        message:
          'M2M_ALGORAND_MNEMONIC is not configured.',
        requirements
      };
    }

    let account;

    try {
      account =
        algosdk.mnemonicToSecretKey(
          mnemonic.trim()
        );
    } catch (err) {
      throw new Error(
        'Invalid M2M_ALGORAND_MNEMONIC: ' +
        err.message
      );
    }

    const senderAddress =
      account.addr.toString();

    console.log(
      '[m2mClient] Signing M2M payment using address:',
      senderAddress
    );

    // ---------------------------------------------------------
    // STEP 4: x402 signer
    // ---------------------------------------------------------

    const signer = {
      address: senderAddress,

      signTransactions: async (
        encodedTxns,
        clientIndexes
      ) => {
        console.log(
          '[m2mClient] Signing ' +
          encodedTxns.length +
          ' txn(s), indexes: ' +
          JSON.stringify(clientIndexes)
        );

        return encodedTxns.map(
          (txnBytes, index) => {
            if (!clientIndexes.includes(index)) {
              return null;
            }

            const txn =
              algosdk.decodeUnsignedTransaction(
                txnBytes
              );

            return txn.signTxn(account.sk);
          }
        );
      }
    };

    // ---------------------------------------------------------
    // STEP 5: Create x402 client
    // ---------------------------------------------------------

    const client =
      new x402Client().register(
        ALGORAND_TESTNET_CAIP2,
        new ExactAvmScheme(signer)
      );

    const httpClient =
      new x402HTTPClient(client);

    // ---------------------------------------------------------
    // STEP 6: Parse payment requirements
    // ---------------------------------------------------------

    let bodyData = null;

    try {
      const text =
        await initialResponse.clone().text();

      if (text) {
        bodyData = JSON.parse(text);
      }
    } catch {
      // Ignore body parsing errors.
    }

    const getHeader = (name) =>
      initialResponse.headers.get(name);

    const paymentRequired =
      httpClient.getPaymentRequiredResponse(
        getHeader,
        bodyData
      );

    console.log(
      '[m2mClient] Creating payment payload...'
    );

    const paymentPayload =
      await client.createPaymentPayload(
        paymentRequired
      );

    // ---------------------------------------------------------
    // STEP 7: Encode PAYMENT-SIGNATURE
    // ---------------------------------------------------------

    const paymentHeaders =
      httpClient.encodePaymentSignatureHeader(
        paymentPayload
      );

    console.log(
      '[m2mClient] Payment signed. Retrying with PAYMENT-SIGNATURE...'
    );

    // ---------------------------------------------------------
    // STEP 8: Retry request with payment
    // ---------------------------------------------------------

    const retryResponse = await fetch(url, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        ...paymentHeaders
      },

      body: JSON.stringify({ items })
    });

    // IMPORTANT:
    // Read response as text so we can see errors.

    const retryText =
      await retryResponse.text();

    let retryData = {};

    try {
      retryData =
        retryText
          ? JSON.parse(retryText)
          : {};
    } catch {
      retryData = {
        raw: retryText
      };
    }

    console.log(
      '[m2mClient] Retry responded HTTP',
      retryResponse.status
    );

    console.log(
      '[m2mClient] Retry response body:',
      retryText || '(empty)'
    );

    console.log(
      '[m2mClient] PAYMENT-RESPONSE:',
      retryResponse.headers.get(
        'payment-response'
      )
    );

    console.log(
      '[m2mClient] X-PAYMENT-RESPONSE:',
      retryResponse.headers.get(
        'x-payment-response'
      )
    );

    // ---------------------------------------------------------
    // STEP 9: Process payment result
    // ---------------------------------------------------------

    try {
      await httpClient.processPaymentResult(
        paymentPayload,

        (name) =>
          retryResponse.headers.get(name),

        retryResponse.status
      );
    } catch (err) {
      console.warn(
        '[m2mClient] Payment result processing warning:',
        err.message
      );
    }

    // ---------------------------------------------------------
    // STEP 10: Extract Algorand transaction ID
    // ---------------------------------------------------------

    let transactionId = null;

    try {
      const payload =
        paymentPayload.payload;

      const signedTxn =
        payload?.paymentGroup?.[
          payload.paymentIndex
        ];

      transactionId =
        extractTxId(signedTxn);

      if (transactionId) {
        console.log(
          '[m2mClient] Algorand Testnet txID:',
          transactionId
        );
      }
    } catch (err) {
      console.warn(
        '[m2mClient] Could not extract txID:',
        err.message
      );
    }

    // ---------------------------------------------------------
    // STEP 11: Return result
    // ---------------------------------------------------------

    return {
      success: retryResponse.ok,

      status: retryResponse.status,

      m2mStatus:
        retryResponse.ok
          ? 'paid'
          : 'error',

      paymentAmount: amountLabel,

      transactionId,

      data: retryData
    };

  } catch (err) {
    console.error(
      '[m2mClient] Error during M2M x402 flow:',
      err.message
    );

    return {
      success: false,

      m2mStatus: 'error',

      message:
        err.message ||
        'M2M payment flow failed.'
    };
  }
}

module.exports = {
  callDeliveryOptimizer
};