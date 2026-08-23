/**
 * TEMPORARY — paste this entire block into the browser DevTools console
 * BEFORE clicking "Confirm Order & Pay with x402".
 *
 * It monkey-patches globalThis.fetch so every POST to /api/orders is
 * intercepted and decoded in detail.  Nothing is sent anywhere — it just
 * prints to the console.
 *
 * After collecting evidence, refresh the page to remove the patch.
 */
(function patchFetchForX402Diagnostics() {
  const _origFetch = globalThis.fetch;
  let callCount = 0;

  function safeDecode(headerVal) {
    if (!headerVal) return null;
    try { return JSON.parse(atob(headerVal)); } catch { return headerVal; }
  }

  async function printResponse(label, response) {
    const cloned = response.clone();
    const status = cloned.status;

    // Read all headers
    const headers = {};
    cloned.headers.forEach((v, k) => { headers[k] = v; });

    const payReq  = headers['payment-required']   || null;
    const payResp = headers['payment-response']   || headers['x-payment-response'] || null;

    let body = null;
    try {
      const text = await cloned.text();
      try { body = JSON.parse(text); } catch { body = text; }
    } catch { body = '(could not read body)'; }

    console.group(`%c[x402 DIAG] ${label} — HTTP ${status}`, 'font-weight:bold;color:#0070f3');

    if (payReq) {
      console.group('PAYMENT-REQUIRED header (decoded)');
      const dec = safeDecode(payReq);
      console.log(dec);
      if (dec?.accepts) {
        dec.accepts.forEach((a, i) => {
          console.group(`accepts[${i}]`);
          console.table({
            scheme:            a.scheme,
            network:           a.network,
            amount:            a.amount,
            asset:             a.asset,
            payTo:             a.payTo,
            maxTimeoutSeconds: a.maxTimeoutSeconds,
          });
          console.log('extra:', a.extra);
          console.groupEnd();
        });
      }
      console.groupEnd();
    } else {
      console.log('No PAYMENT-REQUIRED header');
    }

    if (payResp) {
      console.group('PAYMENT-RESPONSE header (decoded)');
      console.log(safeDecode(payResp));
      console.groupEnd();
    }

    console.group('Response body');
    console.log(body);
    console.groupEnd();

    console.groupEnd();
  }

  globalThis.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : String(input));
    const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();

    if (!url.includes('/api/orders') || method !== 'POST') {
      return _origFetch(input, init);
    }

    callCount++;
    const callNum = callCount;

    // Decode the outgoing payment header if present
    const outHeaders = {};
    if (init?.headers) {
      new Headers(init.headers).forEach((v, k) => { outHeaders[k] = v; });
    } else if (input instanceof Request) {
      input.headers.forEach((v, k) => { outHeaders[k] = v; });
    }

    const outPaySig = outHeaders['payment-signature'] || outHeaders['x-payment'] || null;

    console.group(`%c[x402 DIAG] ▶ OUTGOING REQUEST #${callNum} — POST /api/orders`, 'font-weight:bold;color:#16a34a');
    console.log('Has payment header:', outPaySig ? 'YES' : 'NO');
    if (outPaySig) {
      const decoded = safeDecode(outPaySig);
      console.group('Decoded PAYMENT-SIGNATURE');
      console.log('x402Version:', decoded?.x402Version);
      console.log('scheme:',      decoded?.scheme);
      console.log('network:',     decoded?.network);
      console.group('accepted (what client signed)');
      const acc = decoded?.accepted;
      if (acc) {
        console.table({
          scheme:            acc.scheme,
          network:           acc.network,
          amount:            acc.amount,
          asset:             acc.asset,
          payTo:             acc.payTo,
          maxTimeoutSeconds: acc.maxTimeoutSeconds,
        });
        console.log('extra:', acc.extra);
      } else {
        console.log(decoded);
      }
      console.groupEnd();
      console.groupEnd();
    }
    console.groupEnd();

    const response = await _origFetch(input, init);
    await printResponse(`RESPONSE #${callNum}`, response);

    // Return a fresh clone so the original consumer can still read the body
    return response;
  };

  console.log('%c[x402 DIAG] fetch patch active — now click Confirm Order & Pay with x402', 'color:#d97706;font-weight:bold');
})();
