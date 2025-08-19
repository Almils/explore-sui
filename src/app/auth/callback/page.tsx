'use client';


import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  decodeJwt,
  jwtToAddress,
  getExtendedEphemeralPublicKey,
  genAddressSeed,
  getZkLoginSignature,
} from '@mysten/sui/zklogin';
import { useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { requestSuiFromFaucetV2, getFaucetHost } from '@mysten/sui/faucet';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

// --- Helpers ---------------------------------------------------------------
function parseIdTokenFromLocation(): string {
  // Try fragment first (implicit flow: response_type=id_token)
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  const frag = new URLSearchParams(hash);
  const fromFrag = frag.get('id_token');
  if (fromFrag) return fromFrag;
  // Fallback: query string
  const query = new URL(window.location.href).searchParams;
  return query.get('id_token') ?? '';
}

function getSaltStorageKey(iss: string, sub: string) {
  return `zk_salt:${iss}:${sub}`;
}

// 16-byte random salt (< 2^128) as decimal string
function generateSalt128(): string {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  let val = BigInt(0);
  for (const b of buf) val = (val << BigInt(8)) + BigInt(b);
  return val.toString();
}

// Restore Bech32 secret directly
function getEphemeralFromSession(): Ed25519Keypair {
  const secretStr = sessionStorage.getItem('zk_ephemeral_secret');
  if (!secretStr) throw new Error('Missing ephemeral secret in session.');
  return Ed25519Keypair.fromSecretKey(secretStr);
}

// Promote critical items from localStorage back to sessionStorage if hot-reload wiped them
function promoteZkSessionKeys() {
  const keys = ['zk_ephemeral_secret', 'zk_jwt_randomness', 'zk_max_epoch'];
  for (const k of keys) {
    const cur = sessionStorage.getItem(k);
    if (!cur) {
      const val = localStorage.getItem(k);
      if (val) sessionStorage.setItem(k, val);
    }
  }
}

async function fundDevnet(address: string) {
  await requestSuiFromFaucetV2({
    host: getFaucetHost('devnet'),
    recipient: address,
  });
}

// --- Page -----------------------------------------------------------------
export default function ZkLoginCallback() {
  const client = useSuiClient();
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [digest, setDigest] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Ensure ephemeral items exist in sessionStorage even after a reload
        promoteZkSessionKeys();

        const idToken = parseIdTokenFromLocation();
        if (!idToken) {
          setStatus('error');
          setMessage('Missing id_token from provider (fragment parsing).');
          return;
        }

        const decoded = decodeJwt(idToken);
        const iss = decoded.iss!;
        const sub = decoded.sub!;

        // Persist or create per-user salt
        const saltKey = getSaltStorageKey(iss, sub);
        const existing = localStorage.getItem(saltKey);
        const salt = existing ?? generateSalt128();
        if (!existing) localStorage.setItem(saltKey, salt);

        // Derive zkLogin Sui address and cache for UI/topbar
        const zkAddr = jwtToAddress(idToken, salt);
        sessionStorage.setItem('zk_id_token', idToken);
        sessionStorage.setItem('zk_iss', iss);
        sessionStorage.setItem('zk_sub', sub);
        sessionStorage.setItem('zk_salt', salt);
        sessionStorage.setItem('zk_addr', zkAddr);

        setAddress(zkAddr);
        setStatus('ok');
        setMessage('zkLogin ready! Address derived successfully.');
      } catch (e: any) {
        console.error(e);
        setStatus('error');
        setMessage(e?.message ?? 'Unexpected error.');
      }
    })();
  }, []);

  async function proveSignExecute() {
    try {
      setBusy(true);
      const idToken = sessionStorage.getItem('zk_id_token')!;
      const salt = sessionStorage.getItem('zk_salt')!;
      const maxEpoch = sessionStorage.getItem('zk_max_epoch')!;
      const jwtRandomness = sessionStorage.getItem('zk_jwt_randomness')!;
      const zkAddr = sessionStorage.getItem('zk_addr')!;
      if (!idToken || !salt || !maxEpoch || !jwtRandomness || !zkAddr) {
        throw new Error('Missing zkLogin session items.');
      }

      // (1) Request proof from devnet prover via our API route
      const ephemeral = getEphemeralFromSession();
      const extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(
        ephemeral.getPublicKey(),
      );
      const proofReq = {
        jwt: idToken,
        extendedEphemeralPublicKey,
        maxEpoch,
        jwtRandomness,
        salt,
        keyClaimName: 'sub',
      } as const;

      const proofRes = await fetch('/api/zkp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(proofReq),
      });
      if (!proofRes.ok) throw new Error('Prover request failed');
      const partial = await proofRes.json();

      // (2) Build a tiny tx: split 1 MIST and send it back to self
      const txb = new Transaction();
      txb.setSender(zkAddr);
      const coin = txb.splitCoins(txb.gas, [txb.pure.u64(1)]);
      txb.transferObjects([coin], txb.pure.address(zkAddr));

      // (3) User signature with ephemeral key
      const { bytes, signature: userSignature } = await txb.sign({
        client,
        signer: ephemeral,
      });

      // (4) Assemble zkLogin signature
      const decoded = decodeJwt(idToken);
      const addressSeed = genAddressSeed(
        BigInt(salt),
        'sub',
        decoded.sub!,
        decoded.aud as string,
      ).toString();

      const zkSig = getZkLoginSignature({
        inputs: { ...partial, addressSeed },
        maxEpoch,
        userSignature,
      });

      // (5) Execute!
      const res = await client.executeTransactionBlock({
        transactionBlock: bytes,
        signature: zkSig,
        options: { showEffects: true },
      });
      setDigest(res.digest);
    } catch (e: any) {
      alert(e?.message ?? String(e));
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto rounded-2xl border border-white/10 p-6 mt-8">
      <h1 className="text-xl font-semibold">zkLogin Callback</h1>
      <p className="text-sm text-neutral-400 mt-2">Finalizing your sign-in…</p>

      {status === 'ok' && (
        <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-900/20 p-4">
          <div className="text-sm">Success! Your zkLogin address:</div>
          <div className="mt-1 font-mono text-sm break-all">{address}</div>

          <div className="mt-4 flex flex-col gap-2">
            <button
              disabled={busy}
              onClick={async () => {
                try {
                  setBusy(true);
                  await fundDevnet(address);
                  alert('Funded on Devnet. You can now prove & sign.');
                } catch (e: any) {
                  alert(e?.message ?? 'Faucet error');
                } finally {
                  setBusy(false);
                }
              }}
              className="rounded-lg px-3 py-2 bg-white text-black text-sm font-medium disabled:opacity-60"
            >
              1) Fund on Devnet (faucet)
            </button>

            <button
              disabled={busy}
              onClick={proveSignExecute}
              className="rounded-lg px-3 py-2 bg-white text-black text-sm font-medium disabled:opacity-60"
            >
              2) Prove + Sign + Execute demo tx
            </button>

            {digest && (
              <div className="text-xs text-neutral-400 mt-2">
                Tx digest: <span className="font-mono break-all">{digest}</span>
              </div>
            )}
          </div>

          <Link href="/" className="underline">Go home</Link>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-900/20 p-4">
          <div className="text-sm">Error: {message}</div>
          <Link href="/" className="underline">Go home</Link>
        </div>
      )}
    </div>
  );
}
