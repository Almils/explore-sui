'use client';

import { useSuinsPrimaryName } from '@/hooks/useSuins';
import { formatAddress } from '@mysten/sui/utils';

export default function NameBadge({ address }: { address: string }) {
  const { name, isPending } = useSuinsPrimaryName(address);

  return (
    <div className="hidden md:flex items-center gap-2 rounded-xl border border-white/10 px-3 py-1.5">
      <span className="text-xs text-neutral-300">
        {isPending ? '…' : name ?? formatAddress(address)}
      </span>
    </div>
  );
}
