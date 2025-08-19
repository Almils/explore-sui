'use client';

import { useEffect, useState } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import Button from '@/components/ui/Button';

type Net = 'testnet' | 'mainnet';

type Props = {
  db: any;               // DeepBookClient
  net: Net;
  poolId: string;
  owner: string;         // active address
  canSign: boolean;      // wallet connected
};

type Order = {
  id: string;
  side: 'buy' | 'sell' | string;
  price: bigint | string | number;
  quantity: bigint | string | number;
  filled?: bigint | string | number;
  status?: string;
};

const CHAIN_FOR: Record<Net, `sui:${string}`> = {
  testnet: 'sui:testnet',
  mainnet: 'sui:mainnet',
};

function as9(n: any): string {
  try {
    const b = typeof n === 'bigint' ? n : BigInt(n);
    const w = b / 1_000_000_000n;
    const f = (b % 1_000_000_000n).toString().padStart(9, '0');
    return `${w}.${f}`.replace(/\.?0+$/, '');
  } catch {
    return String(n);
  }
}

export default function DeepBookOrders({ db, net, poolId, owner, canSign }: Props) {
  const [rows, setRows] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const { mutateAsync: signAndExecute, isPending } = useSignAndExecuteTransaction();
  const [note, setNote] = useState('');

  async function load() {
    if (!poolId || !owner) return;
    setLoading(true);
    setNote('');
    try {
      let out: any[] = [];
      if (typeof db?.getOpenOrders === 'function') {
        out = await db.getOpenOrders(poolId, owner);
      } else if (typeof db?.getOrders === 'function') {
        out = await db.getOrders({ poolId, owner, status: 'open' });
      } else if (db?.orders?.getOpenOrders) {
        out = await db.orders.getOpenOrders({ poolId, owner });
      } else {
        throw new Error('DeepBook order query helper not found.');
      }

      const mapped: Order[] = (out ?? []).map((o: any) => ({
        id: o.id ?? o.orderId ?? o.order_id ?? '',
        side: (o.side ?? o.isBid ? 'buy' : 'sell') as any,
        price: o.price ?? o.limitPrice ?? o.limit_price,
        quantity: o.quantity ?? o.qty ?? o.baseLots ?? o.quantity_total,
        filled: o.filled ?? o.baseFilled ?? o.filled_quantity,
        status: o.status ?? 'open',
      })).filter((o: Order) => o.id);

      setRows(mapped);
    } catch (e: any) {
      setNote(e?.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }

  async function cancel(orderId: string) {
    setNote('');
    try {
      if (!canSign) throw new Error('Connect a wallet to cancel orders.');

      const tx = new Transaction();
      if (db?.tx?.cancelOrder) {
        db.tx.cancelOrder(tx, { poolId, orderId, owner });
      } else if (typeof db?.cancelOrderTx === 'function') {
        await db.cancelOrderTx(tx, { poolId, orderId, owner });
      } else if (typeof db?.cancelOrder === 'function') {
        const built = await db.cancelOrder({ poolId, orderId, owner });
        if (built instanceof Transaction) {
          (tx as unknown as { _replace?: (t: Transaction) => void })._replace?.(built);
        } else {
          throw new Error('Unsupported DeepBook helper shape (cancelOrder).');
        }
      } else {
        throw new Error('DeepBook cancel helper not found.');
      }

      await signAndExecute({ transaction: tx, chain: CHAIN_FOR[net] });
      setNote(`Cancelled ${orderId.slice(0, 6)}…${orderId.slice(-6)}`);
      await load();
    } catch (e: any) {
      setNote(e?.message || 'Failed to cancel order.');
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [poolId, owner]);

  return (
    <div className="rounded-2xl border border-white/10 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">My open orders</div>
        <Button variant="secondary" onClick={load} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </Button>
      </div>

      {!rows.length && (
        <div className="text-sm text-neutral-400">No open orders.</div>
      )}

      {!!rows.length && (
        <div className="space-y-2">
          {rows.map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2">
              <div className="min-w-0">
                <div className="text-xs text-neutral-400">{o.side.toUpperCase()}</div>
                <div className="text-sm">
                  Px {as9(o.price)} • Qty {as9(o.quantity)} {o.filled ? (
                    <span className="text-neutral-400"> (filled {as9(o.filled)})</span>
                  ) : null}
                </div>
                <div className="text-[11px] text-neutral-500 break-all">{o.id}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => cancel(o.id)}
                  disabled={!canSign || isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!!note && <div className="text-xs text-neutral-400">{note}</div>}
      {!canSign && (
        <div className="text-[11px] text-neutral-500">
          Connect a wallet to cancel.
        </div>
      )}
    </div>
  );
}
