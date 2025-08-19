'use client';

import { formatAddress } from '@mysten/sui/utils';

export default function ZkAccountBadge({ address }: { address: string }) {
  return (
    <div className="hidden md:flex items-center gap-2 rounded-xl border border-white/10 px-3 py-1.5">
      <span className="text-xs text-neutral-400">zk</span>
      <span className="text-xs text-neutral-300">{formatAddress(address)}</span>
    </div>
  );
}
