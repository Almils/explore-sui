'use client';

import { formatAddress } from '@mysten/sui/utils';

export default function AddressChip({
  address,
  label,
}: {
  address: string;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 max-w-full">
      {label && <span className="text-xs text-muted">{label}</span>}
      {/* Ensure truncation works: parent must allow min-w-0 */}
      <span className="text-xs font-mono truncate max-w-[180px]">
        {formatAddress(address)}
      </span>
      <button
        type="button"
        onClick={() => navigator.clipboard.writeText(address)}
        className="text-[10px] text-muted hover:text-foreground"
        title="Copy full address"
      >
        Copy
      </button>
    </div>
  );
}
