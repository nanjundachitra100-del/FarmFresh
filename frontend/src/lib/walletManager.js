import { WalletManager, WalletId, NetworkId } from '@txnlab/use-wallet';

export const walletManager = new WalletManager({
  wallets: [
    {
      id: WalletId.PERA,
      options: {
        chainId: 416002 // Algorand TestNet
      }
    }
  ],
  defaultNetwork: NetworkId.TESTNET
});
