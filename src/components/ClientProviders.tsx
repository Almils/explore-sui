// src/components/ClientProviders.tsx
'use client';

import '@mysten/dapp-kit/dist/index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider,
} from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';

import { ReactNode } from 'react';

const queryClient = new QueryClient();

const { networkConfig } = createNetworkConfig({
  devnet:  { url: getFullnodeUrl('devnet') },
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
});

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="devnet">
        <WalletProvider
          slushWallet={{ name: 'Sui AI Guide' }} // 👈 Slush-first
        >
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
