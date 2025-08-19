'use client';

import { useState } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';

type Net = 'testnet' | 'mainnet';

type Props = {
  db: any;                       // DeepBookClient
  net: Net;
  poolId: string;
  bestBid?: bigint;              // USDC per SUI
  bestAsk?: bigint;
  owner: string;                 // active address (wallet/zk/passkey)
  canSign: boolean;              // true only when a wallet is connected
};

const CHAIN_FOR: Record<Net, `sui:${string}`> = {
  testnet: 'sui:testnet',
  mainnet: 'sui:mainnet',
};

function toBn(s: string): bigint {
  // price & qty here treated as 9-decimals fixed (like on-chain).
  // UI expects decimals (e.g. "0.0123"); convert to 9dp bigint.
  const [i = '0', f = ''] = s.trim().split('.');
  const fp = (f + '000000000').slice(0, 9);
  const n = `${i}${fp}`.replace(/^0+/, '') || '0';
  return BigInt(n);
}

export default function DeepBookTrade({
  db, net, poolId, bestBid, bestAsk, owner, canSign,
}: Props) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [price, setPrice] = useState('');  // USDC per SUI
  const [qty, setQty] = useState('');      // SUI amount
  const [note, setNote] = useState('');
  const [digest, setDigest] = useState('');
  const { mutateAsync: signAndExecute, isPending } = useSignAndExecuteTransaction();

  function suggest(side: 'buy' | 'sell') {
    if (side === 'buy' && bestAsk) setPrice(Number(bestAsk) / 1e9 + '');
    if (side === 'sell' && bestBid) setPrice(Number(bestBid) / 1e9 + '');
  }

  async function place() {
    setNote('');
    setDigest('');

    if (!canSign) { setNote('Connect a wallet to place orders.'); return; }
    if (!price || !qty) { setNote('Enter price and quantity.'); return; }

    const priceBn = toBn(price);
    const qtyBn = toBn(qty);

    try {
      const tx = new Transaction();

      // DeepBook client APIs have changed over time; try the common shapes:
      if (db?.tx?.placeLimitOrder) {
        // v0.15+ style helper that augments an existing tx:
        db.tx.placeLimitOrder(tx, {
          poolId,
          side,               // 'buy' | 'sell'
          price: priceBn,     // 9dp bigint
          quantity: qtyBn,    // 9dp bigint
          owner,              // maker address
        });
      } else if (typeof db?.placeLimitOrderTx === 'function') {
        // alt helper that builds into a provided tx:
        await db.placeLimitOrderTx(tx, {
          poolId, side, price: priceBn, quantity: qtyBn, owner,
        });
      } else if (typeof db?.placeLimitOrder === 'function') {
        // helper may directly return a Transaction:
        const built = await db.placeLimitOrder({
          poolId, side, price: priceBn, quantity: qtyBn, owner,
        });
        if (built instanceof Transaction) {
          // replace our tx with returned one
          (tx as unknown as { _replace?: (t: Transaction) => void })._replace?.(built);
        } else {
          throw new Error('Unsupported DeepBook helper shape (placeLimitOrder).');
        }
      } else {
        throw new Error('DeepBook trading helpers not found. Check @mysten/deepbook-v3 version.');
      }

      const res = await signAndExecute({
        transaction: tx,
        chain: CHAIN_FOR[net],
      });

      // @ts-expect-error adapters differ
      const d = res?.digest || res?.effects?.transactionDigest || '';
      setDigest(d);
      setNote('Order submitted.');
    } catch (e: any) {
      setNote(e?.message || 'Failed to place order.');
    }
  }

  const explorer = digest
    ? `https://suiexplorer.com/txblock/${digest}?network=${net}`
    : '';

  return (
    <div className="rounded-2xl border border-white/10 p-3 space-y-3">
      <div className="text-sm font-medium">Place limit order</div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={side}
          onChange={(e) => setSide(e.target.value as 'buy' | 'sell')}
          className="rounded-lg bg-neutral-900 border border-white/15 px-2 py-1 text-xs text-white"
        >
          <option value="buy">Buy SUI</option>
          <option value="sell">Sell SUI</option>
        </select>

        <button
          className="text-xs rounded-lg border border-white/15 bg-white/5 px-2 py-1 hover:bg-white/10"
          onClick={() => suggest(side)}
          disabled={isPending}
          title="Prefill from best bid/ask"
        >
          Use best {side === 'buy' ? 'ask' : 'bid'}
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        <div className="grid gap-1.5">
          <label className="text-xs text-muted">Price (USDC per SUI)</label>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            className="rounded-lg bg-neutral-900 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-neutral-500"
            placeholder="e.g. 1.0001"
          />
        </div>
        <div className="grid gap-1.5">
          <label className="text-xs text-muted">Quantity (SUI)</label>
          <input
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            inputMode="decimal"
            className="rounded-lg bg-neutral-900 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-neutral-500"
            placeholder="e.g. 0.1"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={place}
          disabled={!canSign || isPending}
          className="rounded-xl bg-brand-gradient text-black font-medium px-3 py-2 disabled:opacity-50"
        >
          {isPending ? 'Submitting…' : `Place ${side}`}
        </button>
        {!canSign && (
          <div className="text-xs text-neutral-400 self-center">
            Connect a wallet to place orders.
          </div>
        )}
      </div>

      {!!note && (
        <div className="text-xs text-neutral-400">
          {note}{' '}
          {digest && (
            <a className="underline" href={explorer} target="_blank" rel="noreferrer">
              (view)
            </a>
          )}
        </div>
      )}
    </div>
  );
}
