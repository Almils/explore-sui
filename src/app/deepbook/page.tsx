'use client';

import { useEffect, useMemo, useState } from 'react';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { DeepBookClient } from '@mysten/deepbook-v3';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import DeepBookTrade from '@/components/DeepbookTrade';
import { useActiveAddress } from '@/hooks/useActiveAddress';
import AddressChip from '@/components/AddressChip';
import DeepBookOrders from '@/components/DeepBookOrders';


type Net = 'testnet' | 'mainnet';

const ZERO_ADDRESS =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

const USDC_TYPE: Record<Net, string> = {
  testnet:
    '0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC',
  mainnet:
    '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
};

const SCALE = 1_000_000_000n;

type Market = { bid?: bigint; ask?: bigint };
type PoolOpt = { id: string; base: string; quote: string };

export default function DeepBookPage() {
  const [net, setNet] = useState<Net>('testnet');

  const suiClient = useMemo(() => new SuiClient({ url: getFullnodeUrl(net) }), [net]);

  // Wallet account (signer required for trades)
  const walletAccount = useCurrentAccount();
  const hasWallet = !!walletAccount?.address;

  // Unified active address (wallet OR zkLogin OR passkey)
  const { address: activeAddress, source } = useActiveAddress();
  const owner = activeAddress ?? ZERO_ADDRESS;

  const db = useMemo(
    () =>
      new DeepBookClient({
        client: suiClient,
        address: owner,
        env: net,
      }),
    [suiClient, owner, net],
  );

  const [poolId, setPoolId] = useState('');
  const [manualPoolId, setManualPoolId] = useState('');
  const [mkt, setMkt] = useState<Market>({});
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<PoolOpt[]>([]);

  function fmt(n?: bigint) {
    if (n === undefined) return '—';
    const whole = n / SCALE;
    const frac = (n % SCALE).toString().padStart(9, '0');
    return `${whole}.${frac}`.replace(/\.?0+$/, '');
  }

  async function discoverPools() {
    setLoading(true);
    setNote(`Scanning SUI/USDC pools on ${net}…`);
    setMkt({});
    setPoolId('');
    setOptions([]);
    try {
      const page: any = await (db as any).getAllPools?.({ limit: 500, order: 'desc' } as any);
      const rows: any[] = page?.data ?? [];

      const wantedQuote = USDC_TYPE[net].toLowerCase();

      const mapped = rows.map((p): PoolOpt | null => {
        const base: string = String(p.baseAssetType ?? p.base_asset_type ?? '').toLowerCase();
        const quote: string = String(p.quoteAssetType ?? p.quote_asset_type ?? '').toLowerCase();
        const id = p.poolId ?? p.pool_id ?? p.id;
        if (!id) return null;
        return { id: String(id), base, quote };
      });

      const matches = mapped
        .filter((x): x is PoolOpt => x !== null)
        .filter((p) => p.base.endsWith('::sui::sui') && p.quote === wantedQuote);

      setOptions(matches);

      if (matches.length) {
        const first = matches[0].id;
        setPoolId(first);
        setNote(`Found ${matches.length} SUI/USDC pool${matches.length > 1 ? 's' : ''}.`);
        await refreshPrice(first);
      } else {
        setNote('No SUI/USDC pools found. Paste a pool ID below.');
      }
    } catch (e: any) {
      setNote(e?.message || 'Failed to query pools.');
    } finally {
      setLoading(false);
    }
  }

  async function refreshPrice(id = poolId) {
    if (!id) return;
    setLoading(true);
    try {
      if (typeof (db as any).getMarketPrice === 'function') {
        const { bestBidPrice, bestAskPrice } = await (db as any).getMarketPrice(id);
        setMkt({ bid: bestBidPrice, ask: bestAskPrice });
      } else {
        const info: any = await (db as any).getPoolInfo?.(id);
        const bid = info?.bestBidPrice ?? info?.best_bid_price ?? info?.orderbook?.bids?.[0]?.price;
        const ask = info?.bestAskPrice ?? info?.best_ask_price ?? info?.orderbook?.asks?.[0]?.price;
        setMkt({
          bid: typeof bid === 'bigint' ? bid : (bid ? BigInt(bid) : undefined),
          ask: typeof ask === 'bigint' ? ask : (ask ? BigInt(ask) : undefined),
        });
      }
      setNote('');
    } catch (e: any) {
      setNote(e?.message || 'Failed to load market price.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    discoverPools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [net]);

  const hasPool = !!poolId;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-lg font-semibold">DeepBook — Market & Trade</h1>
          {activeAddress && (
            <div className="ml-2 min-w-0">
              <AddressChip address={activeAddress} label={source ?? undefined} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-neutral-400">Network</label>
          <select
            value={net}
            onChange={(e) => setNet(e.target.value as Net)}
            className="rounded-lg bg-neutral-900 border border-white/15 px-2 py-1 text-xs text-white"
          >
            <option value="testnet">testnet</option>
            <option value="mainnet">mainnet</option>
          </select>

          {!hasWallet ? (
            <ConnectButton connectText="Connect Wallet to Trade" />
          ) : (
            <ConnectButton connectText="Connected" />
          )}
        </div>
      </div>

      {!hasWallet && (
        <div className="rounded-2xl border border-white/15 bg-white/5 p-3 text-xs text-neutral-300">
          You’re signed in with <b>{source ?? 'an account'}</b>. To place/cancel orders, please connect a wallet.
          You can still view markets and your open orders.
        </div>
      )}

      <Card className="space-y-3">
        <div className="text-sm font-medium">SUI / USDC — Market</div>
        <div className="text-xs text-neutral-400">
          Auto-discovers SUI/USDC pools and shows best bid/ask. You can also paste a pool ID.
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <div className="rounded-xl border border-white/10 px-3 py-1.5">
            Pool ID: <span className="font-mono">{poolId || '—'}</span>
          </div>
          <Button onClick={() => refreshPrice()} disabled={!hasPool || loading}>
            {loading ? 'Loading…' : 'Refresh Price'}
          </Button>
          <Button variant="secondary" onClick={() => discoverPools()} disabled={loading}>
            {loading ? 'Scanning…' : 'Re-scan Pools'}
          </Button>

          {!!options.length && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-400">Choose</label>
              <select
                value={poolId}
                onChange={(e) => {
                  const id = e.target.value;
                  setPoolId(id);
                  refreshPrice(id);
                }}
                className="rounded-lg bg-neutral-900 border border-white/15 px-2 py-1 text-xs text-white"
              >
                {options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.id.slice(0, 6)}…{o.id.slice(-6)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 p-3">
            <div className="text-[11px] uppercase tracking-wide text-neutral-400 mb-1">
              Best Bid (USDC per SUI)
            </div>
            <div className="text-xl font-semibold">{fmt(mkt.bid)}</div>
          </div>
          <div className="rounded-2xl border border-white/10 p-3">
            <div className="text-[11px] uppercase tracking-wide text-neutral-400 mb-1">
              Best Ask (USDC per SUI)
            </div>
            <div className="text-xl font-semibold">{fmt(mkt.ask)}</div>
          </div>
        </div>

        {note && (
          <div className="text-xs text-neutral-400">
            {note}
            {!options.length && (
              <span className="block mt-1">
                Tip: liquidity on {net} may be limited. If you have a known pool ID, paste it below.
              </span>
            )}
          </div>
        )}

        <div className="space-y-2">
          <div className="text-xs text-neutral-400">
            Paste a known SUI/USDC pool object ID (from an explorer or DeepBook indexer).
          </div>
          <div className="flex gap-2">
            <input
              placeholder="0x… pool id"
              value={manualPoolId}
              onChange={(e) => setManualPoolId(e.target.value)}
              className="flex-1 rounded-lg bg-neutral-900 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-neutral-500"
            />
            <Button
              onClick={() => {
                const id = manualPoolId.trim();
                if (!id) return;
                setPoolId(id);
                setNote('Using manual pool id.');
                refreshPrice(id);
              }}
              disabled={!manualPoolId.trim()}
            >
              Use ID
            </Button>
          </div>
        </div>
      </Card>

      {hasPool && (
  <>
    <DeepBookTrade
      db={db}
      net={net}
      poolId={poolId}
      bestBid={mkt.bid}
      bestAsk={mkt.ask}
      owner={owner}
      canSign={hasWallet}
    />

    {/* My orders + cancel */}
    <DeepBookOrders
      db={db}
      net={net}
      poolId={poolId}
      owner={owner}
      canSign={hasWallet}
    />
  </>
)}
    </div>
  );
}
