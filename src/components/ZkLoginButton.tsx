'use client';

import { useSuiClient } from '@mysten/dapp-kit';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { generateRandomness, generateNonce } from '@mysten/sui/zklogin';

function buildGoogleAuthUrl(nonce: string) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_ZKLOGIN_REDIRECT_URL;

  if (!clientId || !redirectUri) {
    alert('Missing envs: set NEXT_PUBLIC_GOOGLE_CLIENT_ID and NEXT_PUBLIC_ZKLOGIN_REDIRECT_URL in .env.local');
    return '';
  }

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('response_type', 'id_token'); // comes back in hash
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', 'openid');
  url.searchParams.set('nonce', nonce);
  url.searchParams.set('prompt', 'select_account');
  return url.toString();
}

export default function ZkLoginButton() {
  const client = useSuiClient();

  async function handleGoogle() {
    const { epoch } = await client.getLatestSuiSystemState();
    const maxEpoch = Number(epoch) + 2;

    const ephemeral = new Ed25519Keypair();
    const jwtRandomness = generateRandomness();
    const nonce = generateNonce(ephemeral.getPublicKey(), maxEpoch, jwtRandomness);

    // Ephemeral secret as Bech32:
const secretBech32 = ephemeral.getSecretKey();

// Save to sessionStorage (primary) AND localStorage (fallback)
sessionStorage.setItem('zk_ephemeral_secret', secretBech32);
sessionStorage.setItem('zk_jwt_randomness', String(jwtRandomness));
sessionStorage.setItem('zk_max_epoch', String(maxEpoch));

localStorage.setItem('zk_ephemeral_secret', secretBech32);
localStorage.setItem('zk_jwt_randomness', String(jwtRandomness));
localStorage.setItem('zk_max_epoch', String(maxEpoch));

    const authUrl = buildGoogleAuthUrl(nonce);
    if (!authUrl) return;
    window.location.href = authUrl;
  }

  return (
    <button
      onClick={handleGoogle}
      className="rounded-lg px-3 py-2 bg-white text-black text-sm font-medium"
    >
      Continue with Google (zkLogin)
    </button>
  );
}
