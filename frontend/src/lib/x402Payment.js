import { x402Client, wrapFetchWithPayment } from '@x402/fetch';
import { ExactAvmScheme } from '@x402/avm/exact/client';
import { ALGORAND_TESTNET_CAIP2 } from '@x402/avm';

/**
 * Build a payment-enabled fetch using the connected Algorand Testnet wallet.
 * No private keys are used — signing is delegated to the browser wallet.
 */
export function createPaymentFetch(activeAccount, signTransactions) {
  if (!activeAccount?.address) {
    throw new Error('Algorand wallet is not connected.');
  }

  if (typeof signTransactions !== 'function') {
    throw new Error('Wallet cannot sign transactions.');
  }

  const signer = {
    address: activeAccount.address,
    signTransactions: async (txns, indexesToSign) => signTransactions(txns, indexesToSign)
  };

  const client = new x402Client()
    .register(ALGORAND_TESTNET_CAIP2, new ExactAvmScheme(signer));

  return wrapFetchWithPayment(fetch, client);
}
