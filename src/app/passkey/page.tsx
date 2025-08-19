// src/app/passkey/page.tsx
'use client';

import { useState } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { requestSuiFromFaucetV2, getFaucetHost } from '@mysten/sui/faucet';
import {
  BrowserPasskeyProvider,
  PasskeyKeypair,
} from '@mysten/sui/keypairs/passkey';

// Compare by address to find the common public key across two recovered sets
function findCommonByAddress(a: any[], b: any[]) {
  const setA = new Set(a.map((pk) => pk.toSuiAddress()));
  return b.find((pk) => setA.has(pk.toSuiAddress())) ?? null;
}

export default function PasskeyPage() {
  const client = useSuiClient();
  const [kp, setKp] = useState<PasskeyKeypair | null>(null);
  const [address, setAddress] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [digest, setDigest] = useState<string | null>(null);
  const [mode, setMode] = useState<'platform' | 'cross-platform'>('platform');

  async function createWallet() {
    try {
      setBusy(true);
      // createWallet(): replace the BrowserPasskeyProvider options
const provider = new BrowserPasskeyProvider('Sui AI Guide', {
    rp: {
      name: 'Sui AI Guide',
      id: window.location.hostname,
    },
    authenticatorSelection: {
      authenticatorAttachment: mode, // 'platform' | 'cross-platform'
    },
  });
  

      const keypair = await PasskeyKeypair.getPasskeyInstance(provider);
      const addr = keypair.getPublicKey().toSuiAddress();

      setKp(keypair);
      setAddress(addr);
      sessionStorage.setItem('passkey_addr', addr);
      alert(`Passkey wallet created.\nAddress: ${addr}`);
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? 'Failed to create passkey wallet.');
    } finally {
      setBusy(false);
    }
  }

  async function recoverWallet() {
    try {
      setBusy(true);

      // recoverWallet(): replace the BrowserPasskeyProvider options
const provider = new BrowserPasskeyProvider('Sui AI Guide', {
    rp: {
      name: 'Sui AI Guide',
      id: window.location.hostname,
    },
  });
  

      const m1 = new TextEncoder().encode('Recover passkey — message 1');
      const m2 = new TextEncoder().encode('Recover passkey — message 2');

      const cands1 = await PasskeyKeypair.signAndRecover(provider, m1);
      const cands2 = await PasskeyKeypair.signAndRecover(provider, m2);

      const common = findCommonByAddress(cands1, cands2);
      if (!common) {
        alert('Could not recover a unique public key. Try again.');
        return;
      }

      const keypair = new PasskeyKeypair(common.toRawBytes(), provider);
      const addr = keypair.getPublicKey().toSuiAddress();

      setKp(keypair);
      setAddress(addr);
      sessionStorage.setItem('passkey_addr', addr);
      alert(`Passkey wallet recovered.\nAddress: ${addr}`);
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? 'Failed to recover passkey wallet.');
    } finally {
      setBusy(false);
    }
  }

  async function fundDevnet() {
    if (!address) {
      alert('Create or recover a passkey wallet first.');
      return;
    }
    try {
      setBusy(true);
      await requestSuiFromFaucetV2({
        host: getFaucetHost('devnet'),
        recipient: address,
      });
      alert('Funded on Devnet. You can now sign a tx.');
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? 'Faucet error.');
    } finally {
      setBusy(false);
    }
  }

  async function signDemoTx() {
    if (!kp || !address) {
      alert('Create or recover a passkey wallet first.');
      return;
    }
    try {
      setBusy(true);

      const txb = new Transaction();
      txb.setSender(address);
      const coin = txb.splitCoins(txb.gas, [txb.pure.u64(1)]);
      txb.transferObjects([coin], txb.pure.address(address));

      const { bytes, signature } = await txb.sign({ client, signer: kp });
      const res = await client.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: { showEffects: true },
      });
      setDigest(res.digest);
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? 'Signing/execution failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Passkey Wallet</h1>
      <p className="text-neutral-400 text-sm">
        Create or recover a passkey-backed wallet (WebAuthn / P-256), then fund and sign a demo transaction.
      </p>

      <div className="rounded-2xl border border-white/10 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <label className="text-sm">Authenticator:</label>
          <select
            className="bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm"
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
          >
            <option value="platform">platform (Face ID / Touch ID)</option>
            <option value="cross-platform">cross-platform (YubiKey / phone)</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            disabled={busy}
            onClick={createWallet}
            className="rounded-lg px-3 py-2 bg-white text-black text-sm font-medium disabled:opacity-60"
          >
            Create passkey wallet
          </button>

          <button
            disabled={busy}
            onClick={recoverWallet}
            className="rounded-lg px-3 py-2 border border-white/10 text-sm disabled:opacity-60"
          >
            Recover existing wallet
          </button>

          <button
            disabled={busy}
            onClick={fundDevnet}
            className="rounded-lg px-3 py-2 border border-white/10 text-sm disabled:opacity-60"
          >
            Fund on Devnet (faucet)
          </button>

          <button
            disabled={busy}
            onClick={signDemoTx}
            className="rounded-lg px-3 py-2 bg-white text-black text-sm font-medium disabled:opacity-60"
          >
            Sign demo tx
          </button>
        </div>

        <div className="text-sm text-neutral-300">
          <div>Address:</div>
          <div className="font-mono break-all">{address || '—'}</div>
          {digest && (
            <div className="mt-2 text-neutral-400 text-xs">
              Tx digest: <span className="font-mono break-all">{digest}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
