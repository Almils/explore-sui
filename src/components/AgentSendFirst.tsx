'use client';

import { useMemo, useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { isValidSuiAddress, MIST_PER_SUI } from '@mysten/sui/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useActiveAddress } from '@/hooks/useActiveAddress';

type Net = 'devnet' | 'testnet' | 'mainnet';

const CHAIN_FOR: Record<Net, `sui:${string}`> = {
  devnet: 'sui:devnet',
  testnet: 'sui:testnet',
  mainnet: 'sui:mainnet',
};

export default function AgentSendFirst({ net }: { net: Net }) {
  const walletAccount = useCurrentAccount();
  const { mutateAsync: signAndExecute, isPending } = useSignAndExecuteTransaction();
  const { address: activeAddress } = useActiveAddress();

  // read-only client for previewing balance on the selected network
  const client = useMemo(() => new SuiClient({ url: getFullnodeUrl(net) }), [net]);

  const [to, setTo] = useState('');
  const [amountStr, setAmountStr] = useState('0.001'); // SUI
  const [note, setNote] = useState<string>('');
  const [digest, setDigest] = useState<string>('');

  async function previewFunds() {
    setNote('Checking balance…');
    try {
      if (!walletAccount?.address) { setNote('Connect a wallet first.'); return; }
      const bal = await client.getBalance({ owner: walletAccount.address, coinType: '0x2::sui::SUI' });
      const sui = Number(bal.totalBalance) / Number(MIST_PER_SUI);
      setNote(`Your ${net} balance: ${sui.toFixed(4)} SUI`);
    } catch (e: any) {
      setNote(e?.message ?? 'Failed to fetch balance.');
    }
  }

  // Convert a decimal SUI string to MIST (BigInt) safely
  function suiToMist(s: string): bigint {
    const [ints = '0', frac = ''] = s.trim().split('.');
    const fracPadded = (frac + '000000000').slice(0, 9); // pad/trim to 9 decimals
    const asStr = `${ints}${fracPadded}`.replace(/^0+/, '') || '0';
    return BigInt(asStr);
  }

  async function send() {
    setDigest('');
    setNote('');
    if (!walletAccount?.address) { setNote('Connect a wallet first.'); return; }

    const toAddr = to.trim();
    if (!isValidSuiAddress(toAddr)) { setNote('Recipient must be a valid 0x… Sui address'); return; }

    let mist: bigint;
    try {
      mist = suiToMist(amountStr);
      if (mist <= 0n) throw new Error('Amount must be > 0');
    } catch {
      setNote('Enter a valid positive amount (e.g., 0.001)');
      return;
    }

    try {
      const tx = new Transaction();
      // 1) split from gas coin
      const [coin] = tx.splitCoins(tx.gas, [mist]);
      // 2) transfer the split coin to recipient
      tx.transferObjects([coin], tx.pure.address(toAddr));

      const result = await signAndExecute({
        transaction: tx,
        chain: CHAIN_FOR[net],
      });

      // Try common places for the digest
      // @ts-expect-error shape depends on wallet adapter
      const d = result?.digest || result?.effects?.transactionDigest || '';
      setDigest(d);

      const netParam = net === 'mainnet' ? 'mainnet' : net;
      setNote(`Sent! View on Explorer: suiexplorer.com/txblock/${d}?network=${netParam}`);
    } catch (e: any) {
      setNote(e?.message ?? 'Transaction failed or was rejected.');
    }
  }

  const explorerHref = digest
    ? `https://suiexplorer.com/txblock/${digest}?network=${net === 'mainnet' ? 'mainnet' : net}`
    : '';

  return (
    <Card className="space-y-3">
      <div className="text-sm font-medium">Send my first SUI</div>

      <div className="grid gap-2">
        <label className="text-xs text-muted">Recipient (0x…)</label>
        <div className="flex gap-2">
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="0x…"
            className="flex-1 rounded-lg bg-neutral-900 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-neutral-500"
          />
          <Button
            variant="ghost"
            onClick={() => activeAddress && setTo(activeAddress)}
            title="Use my current address"
            disabled={!activeAddress}
          >
            Use mine
          </Button>
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-xs text-muted">Amount (SUI)</label>
        <input
          value={amountStr}
          onChange={(e) => setAmountStr(e.target.value)}
          inputMode="decimal"
          className="rounded-lg bg-neutral-900 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-neutral-500"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={previewFunds} variant="secondary" disabled={isPending}>
          Check my {net} balance
        </Button>
        <Button onClick={send} disabled={isPending}>
          Send {amountStr || ''} SUI on {net}
        </Button>
      </div>

      {note && (
        <div className="text-xs text-neutral-400 break-words">
          {note}{' '}
          {digest && (
            <a
              className="underline hover:opacity-90"
              href={explorerHref}
              target="_blank"
              rel="noreferrer"
            >
              (open)
            </a>
          )}
        </div>
      )}

      <div className="text-[11px] text-neutral-500">
        Tip: Make sure your wallet is set to <b>{net}</b> when the signing prompt appears.
      </div>
    </Card>
  );
}
