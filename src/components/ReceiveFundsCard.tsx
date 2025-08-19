'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import AddressChip from '@/components/AddressChip';
import { useActiveAddress } from '@/hooks/useActiveAddress';

export default function ReceiveFundsCard() {
  const { address, source } = useActiveAddress();
  const [qr, setQr] = useState<string | null>(null);
  const [note, setNote] = useState<string>('');

  // Generate a QR code (optional dependency). If not installed, we still show copy.
  useEffect(() => {
    let canceled = false;
    async function makeQR() {
      if (!address) { setQr(null); return; }
      try {
        // dynamic import so SSR doesn’t choke; optional dependency
        const QR = (await import('qrcode')).default;
        const dataUrl = await QR.toDataURL(address, { margin: 1, width: 180 });
        if (!canceled) setQr(dataUrl);
      } catch {
        // silently ignore if 'qrcode' isn’t installed
        if (!canceled) setQr(null);
      }
    }
    makeQR();
    return () => { canceled = true; };
  }, [address]);

  async function copy() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setNote('Address copied!');
    setTimeout(() => setNote(''), 1500);
  }

  async function share() {
    if (!address) return;
    const payload = {
      title: 'My Sui address',
      text: 'Send SUI to this address:',
      url: `https://suiexplorer.com/address/${address}?network=devnet`,
    };
    try {
      // Prefer the raw address on share (many wallets scan QR or paste 0x…)
      if (navigator.share) await navigator.share({ title: payload.title, text: `${payload.text}\n${address}` });
      else await copy();
    } catch { /* user canceled */ }
  }

  return (
    <Card className="space-y-3">
      <div className="text-sm font-medium">Receive SUI (copy / QR)</div>

      {!address ? (
        <div className="text-xs text-neutral-400">No account yet — connect a wallet or sign in.</div>
      ) : (
        <>
          <div className="flex items-center gap-2 min-w-0">
            <AddressChip address={address} label={source ?? undefined} />
            <Button variant="secondary" onClick={copy}>Copy</Button>
            <Button variant="ghost" onClick={share}>Share</Button>
          </div>

          <div className="mt-2 flex items-center gap-3">
            {qr ? (
              <img
                src={qr}
                alt="Sui address QR"
                className="rounded-xl border border-white/10 bg-white p-2"
                width={180}
                height={180}
              />
            ) : (
              <div className="text-xs text-neutral-500">
                (Optional) Install <code>qrcode</code> to show a QR:
                <span className="ml-1 rounded-md bg-neutral-900 border border-white/10 px-2 py-[2px]">npm i qrcode</span>
              </div>
            )}
          </div>

          {note && <div className="text-xs text-neutral-400">{note}</div>}

          <div className="text-[11px] text-neutral-500">
            Tip: You can fund on Devnet/Testnet via the faucet in Quick Actions, or paste this into a wallet that sends SUI.
          </div>
        </>
      )}
    </Card>
  );
}
