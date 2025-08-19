'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { MIST_PER_SUI } from '@mysten/sui/utils';
import { useActiveAddress } from '@/hooks/useActiveAddress';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

type Net = 'devnet' | 'testnet' | 'mainnet';

const COOLDOWN_KEY = (net: Net) => `faucet_cooldown_until_${net}`;

export default function AgentQuickActions({ net }: { net: Net }) {
  // Read clients (no signing)
  const devnetClientRef = useRef(new SuiClient({ url: getFullnodeUrl('devnet') }));
  const testnetClientRef = useRef(new SuiClient({ url: getFullnodeUrl('testnet') }));
  const mainnetClientRef = useRef(new SuiClient({ url: getFullnodeUrl('mainnet') }));

  const client = useMemo(() => {
    if (net === 'mainnet') return mainnetClientRef.current;
    return net === 'devnet' ? devnetClientRef.current : testnetClientRef.current;
  }, [net]);

  const { address } = useActiveAddress();
  const [busy, setBusy] = useState(false);
  const [balance, setBalance] = useState<string>('—');
  const [note, setNote] = useState<string>('');

  // Cooldown (devnet/testnet only)
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const raw = localStorage.getItem(COOLDOWN_KEY(net));
    setCooldownUntil(raw ? parseInt(raw, 10) : null);
  }, [net]);

  useEffect(() => {
    if (!cooldownUntil) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  const remainingMs = cooldownUntil ? Math.max(0, cooldownUntil - now) : 0;
  const remainingStr =
    remainingMs > 0
      ? (() => {
          const s = Math.ceil(remainingMs / 1000);
          const h = Math.floor(s / 3600);
          const m = Math.floor((s % 3600) / 60);
          const sec = s % 60;
          return h ? `${h}h ${m}m` : m ? `${m}m ${sec}s` : `${sec}s`;
        })()
      : '';

  async function checkBalance() {
    if (!address) {
      setNote('Connect a wallet or finish zkLogin/Passkey first.');
      return;
    }
    try {
      setBusy(true);
      const res = await client.getBalance({ owner: address, coinType: '0x2::sui::SUI' });
      const sui = Number(res.totalBalance) / Number(MIST_PER_SUI);
      setBalance(`${sui.toFixed(4)} SUI`);
      setNote(`Balance fetched from ${net}.`);
    } catch (e: any) {
      setNote(e?.message ?? 'Failed to fetch balance.');
    } finally {
      setBusy(false);
    }
  }

  async function faucet() {
    if (!address) {
      setNote('Connect a wallet or finish zkLogin/Passkey first.');
      return;
    }
    if (net === 'mainnet') {
      setNote('Mainnet has no faucet. You can bridge or deposit from an exchange.');
      return;
    }
    try {
      setBusy(true);
      setNote('');
      const res = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ network: net, recipient: address }),
      });
      const text = await res.text(); // read once
      let data: any = {};
      try { data = JSON.parse(text); } catch {}

      if (!data?.ok) {
        if (data?.rateLimited && typeof data?.retryAfterSeconds === 'number') {
          const until = Date.now() + data.retryAfterSeconds * 1000;
          localStorage.setItem(COOLDOWN_KEY(net), String(until));
          setCooldownUntil(until);
          setNote(`Rate-limited on ${net}. Try again in ${Math.ceil(data.retryAfterSeconds / 3600)}h.`);
        } else {
          setNote(`Faucet error on ${net}: ${data?.detail || text || 'Unknown error'}`);
        }
        return;
      }

      setNote(`Requested ${net} faucet for ${address.slice(0, 10)}… Re-check balance in ~5–15s.`);
      setTimeout(() => checkBalance(), 6000);
    } catch (e: any) {
      setNote(e?.message ?? 'Faucet error (network). Try again shortly.');
    } finally {
      setBusy(false);
    }
  }

  const faucetDisabled = busy || net === 'mainnet' || remainingMs > 0;

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={checkBalance} disabled={busy}>
          Check balance ({net})
        </Button>

        <Button
          onClick={faucet}
          disabled={faucetDisabled}
          variant="secondary"
          title={
            net === 'mainnet'
              ? 'No faucet on mainnet'
              : remainingStr
              ? `Cooldown: ${remainingStr}`
              : undefined
          }
        >
          {net === 'mainnet'
            ? 'Faucet (N/A on mainnet)'
            : remainingStr
            ? `Faucet (${remainingStr})`
            : `Get ${net} SUI (faucet)`}
        </Button>

        <div className="text-sm text-neutral-300">
          Balance: <span className="font-mono">{balance}</span>
        </div>
      </div>

      {note && <div className="text-xs text-neutral-400">{note}</div>}
      <div className="text-[11px] text-neutral-500">
        Tip: Your wallet may be on a different network; reading happens on the selector above. When we sign a tx, we’ll prompt your wallet on the correct chain.
      </div>
    </Card>
  );
}
