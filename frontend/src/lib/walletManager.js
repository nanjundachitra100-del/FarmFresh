import { WalletManager, WalletId, NetworkId } from '@txnlab/use-wallet';

export const walletManager = new WalletManager({
  wallets: [{ id: WalletId.PERA }],
  defaultNetwork: NetworkId.TESTNET
});
