'use client';

import { useEffect, useState } from 'react';

export function useZkSession() {
  const [zkAddress, setZkAddress] = useState<string | null>(null);

  useEffect(() => {
    const read = () => setZkAddress(sessionStorage.getItem('zk_addr'));
    read();
    document.addEventListener('visibilitychange', read);
    window.addEventListener('focus', read);
    return () => {
      document.removeEventListener('visibilitychange', read);
      window.removeEventListener('focus', read);
    };
  }, []);

  return { zkAddress };
}
