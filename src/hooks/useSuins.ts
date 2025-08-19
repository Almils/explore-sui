'use client';

import { useSuiClientQuery } from '@mysten/dapp-kit';

export function useSuinsPrimaryName(address?: string | null) {
  const enabled = !!address;
  const { data, isPending, error } = useSuiClientQuery(
    'resolveNameServiceNames',
    enabled ? { address: address!, limit: 1 } : (undefined as any),
    { enabled }
  );

  // RPC returns a page with data: string[]
  const name = data?.data?.[0] ?? null;
  return { name, isPending, error };
}

export function useSuinsResolveAddress(domain?: string | null) {
  const enabled = !!domain;
  const { data, isPending, error } = useSuiClientQuery(
    'resolveNameServiceAddress',
    enabled ? { name: domain! } : (undefined as any),
    { enabled }
  );

  // data is a SuiAddress string or null if not found
  const address = data ?? null;
  return { address, isPending, error };
}
