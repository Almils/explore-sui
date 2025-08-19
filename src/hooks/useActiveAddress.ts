'use client';

import { useEffect, useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';

export type ActiveSource = 'wallet' | 'zk' | 'passkey' | null;

export function useActiveAddress() {
  const wallet = useCurrentAccount();
  const [zk, setZk] = useState<string | null>(null);
  const [passkey, setPasskey] = useState<string | null>(null);

  useEffect(() => {
    const read = () => {
      setZk(sessionStorage.getItem('zk_addr') ?? null);
      const pk = sessionStorage.getItem('passkey_addr') ?? localStorage.getItem('passkey_addr');
      setPasskey(pk ?? null);
    };
    read();
    window.addEventListener('focus', read);
    document.addEventListener('visibilitychange', read);
    return () => {
      window.removeEventListener('focus', read);
      document.removeEventListener('visibilitychange', read);
    };
  }, []);

  const address = wallet?.address ?? zk ?? passkey ?? null;
  const source: ActiveSource = wallet?.address ? 'wallet' : zk ? 'zk' : passkey ? 'passkey' : null;

  return { address, source };
}
