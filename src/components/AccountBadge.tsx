'use client';

import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';
import { formatAddress, MIST_PER_SUI } from '@mysten/sui/utils';

export default function AccountBadge() {
  const account = useCurrentAccount();

  // Always provide a typed params object; gate the fetch with `enabled`
  const params = {
    owner: account?.address ?? '0x0',          // placeholder address when not connected
    coinType: '0x2::sui::SUI',
  };

  const { data, isPending } = useSuiClientQuery('getBalance', params, {
    enabled: !!account,
  });

  if (!account) return null;

  const mist = data?.totalBalance ? Number(data.totalBalance) : 0;
  const sui = mist / Number(MIST_PER_SUI);

  return (
    <div className="hidden md:flex items-center gap-2 rounded-xl border border-white/10 px-3 py-1.5">
      <span className="text-xs text-neutral-400">
        {formatAddress(account.address)}
      </span>
      <span className="text-xs text-neutral-300">
        {isPending ? '…' : `${sui.toFixed(4)} SUI`}
      </span>
    </div>
  );
}
