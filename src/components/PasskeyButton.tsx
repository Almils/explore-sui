'use client';

import { useState } from 'react';

function randBytes(len: number) {
  const b = new Uint8Array(len);
  crypto.getRandomValues(b);
  return b;
}

function toBase64Url(bytes: Uint8Array) {
  const bin = String.fromCharCode(...bytes);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

/**
 * Create a passkey (WebAuthn, platform authenticator).
 * - Prompts for an email (optional). If provided, it becomes the label in the OS dialog.
 * - Stores:
 *   - passkey_cred_id (base64url)
 *   - passkey_pubkey_spki_b64 (optional; base64, if browser exposes getPublicKey())
 *   - passkey_user_name (email/label used)
 */
export default function PasskeyButton() {
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');

  async function createPasskey() {
    try {
      setBusy(true);

      // RP ID must match your domain in production (localhost is fine in dev)
      const rpId = window.location.hostname;

      // Required: ES256/P-256 for Sui passkeys
      const pubKeyCredParams: PublicKeyCredentialParameters[] = [
        { type: 'public-key', alg: -7 },
      ];

      // Demo user handle (opaque, unique per app user)
      const userId = randBytes(16);

      // Use the email if provided; else friendly defaults
      const label = email.trim() || 'passkey@sui.ai';
      const display = email.trim() || 'Sui Passkey User';

      const options: PublicKeyCredentialCreationOptions = {
        challenge: randBytes(32),
        rp: { name: 'Sui AI Guide', id: rpId },
        user: {
          id: userId,
          name: label,
          displayName: display,
        },
        pubKeyCredParams,
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'preferred',
          authenticatorAttachment: 'platform',
        },
        timeout: 60_000,
        attestation: 'none',
      };

      const credential = (await navigator.credentials.create({
        publicKey: options,
      })) as PublicKeyCredential | null;

      if (!credential) {
        alert('Passkey creation was cancelled or failed.');
        return;
      }

      const rawId = new Uint8Array(credential.rawId);
      const credIdUrl = toBase64Url(rawId);

      const att = credential.response as AuthenticatorAttestationResponse & {
        getPublicKey?: () => ArrayBuffer | null;
      };
      const spki = att.getPublicKey?.() ?? undefined as ArrayBuffer | undefined;

      let spkiB64 = '';
      if (spki) {
        const bytes = new Uint8Array(spki);
        const bin = String.fromCharCode(...bytes);
        spkiB64 = btoa(bin);
      }

      // Save (session + local, to survive hot reloads)
      sessionStorage.setItem('passkey_cred_id', credIdUrl);
      localStorage.setItem('passkey_cred_id', credIdUrl);
      sessionStorage.setItem('passkey_user_name', label);
      localStorage.setItem('passkey_user_name', label);
      if (spkiB64) {
        sessionStorage.setItem('passkey_pubkey_spki_b64', spkiB64);
        localStorage.setItem('passkey_pubkey_spki_b64', spkiB64);
      }

      alert('Passkey created ✅');
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? 'Passkey creation failed.');
    } finally {
      setBusy(false);
    }
  }

  const supported = typeof window !== 'undefined' && !!window.PublicKeyCredential;

  return (
    <div className="flex items-center gap-2">
      <input
        type="email"
        inputMode="email"
        placeholder="your@email.com (optional)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-lg bg-neutral-800 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
      />
      <button
        onClick={createPasskey}
        disabled={!supported || busy}
        className="rounded-lg px-3 py-2 bg-white text-black text-sm font-medium disabled:opacity-60"
        title={!supported ? 'WebAuthn not supported in this browser' : undefined}
      >
        {busy ? 'Creating…' : 'Create Passkey'}
      </button>
    </div>
  );
}
