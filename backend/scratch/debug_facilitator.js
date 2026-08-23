const { HTTPFacilitatorClient } = require('@x402/core/server');

async function run() {
  const client = new HTTPFacilitatorClient({
    url: 'https://x402.org/facilitator'
  });

  console.log('Facilitator URL:', client.url);

  try {
    const supported = await client.getSupported();
    console.log('Supported networks:', JSON.stringify(supported, null, 2));
  } catch (error) {
    console.error('getSupported failed:', error);
  }

  // Attempt a dummy verify
  try {
    const dummyPayload = {
      x402Version: 2,
      scheme: 'exact',
      network: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDe',
      payload: {
        paymentGroup: [],
        paymentIndex: 0
      }
    };
    const dummyRequirements = {
      amount: '1000000',
      asset: '10458941',
      payTo: '47XPTPYP5ZEO6COT2HTDEPVGG2VWTV5VR75WKMQW7YXNMXBASE7CZHD35E',
      network: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDe',
      scheme: 'exact'
    };

    console.log('Calling verify with dummy inputs...');
    const verifyResult = await client.verify(dummyPayload, dummyRequirements);
    console.log('Verify result:', verifyResult);
  } catch (error) {
    console.error('Verify failed (expected):', error.message);
  }
}

run();
