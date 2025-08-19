'use client';

import { useEffect, useState } from 'react';

export function usePasskeySession() {
  const [passkeyAddress, setPasskeyAddress] = useState<string | null>(null);
  useEffect(() => {
    const read = () => {
      const v = sessionStorage.getItem('passkey_addr') ?? localStorage.getItem('passkey_addr');
      setPasskeyAddress(v);
    };
    read();
    window.addEventListener('focus', read);
    document.addEventListener('visibilitychange', read);
    return () => {
      window.removeEventListener('focus', read);
      document.removeEventListener('visibilitychange', read);
    };
  }, []);
  return { passkeyAddress };
}
