'use client';

import { useEffect, useState } from 'react';

export default function Profile() {
  const [passkeyId, setPasskeyId] = useState<string | null>(null);
  const [spki, setSpki] = useState<string | null>(null);

  useEffect(() => {
    const id = sessionStorage.getItem('passkey_cred_id') ?? localStorage.getItem('passkey_cred_id');
    const pk = sessionStorage.getItem('passkey_pubkey_spki_b64') ?? localStorage.getItem('passkey_pubkey_spki_b64');
    setPasskeyId(id);
    setSpki(pk);
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 p-6 space-y-6">
      <h1 className="text-xl font-semibold">Your Profile</h1>

      <section>
        <h2 className="font-medium">Passkey</h2>
        <p className="text-sm text-neutral-400 mt-1">
          {passkeyId
            ? <>Passkey credential created. ID (b64url): <span className="font-mono break-all">{passkeyId}</span></>
            : 'No passkey in this browser yet.'}
        </p>
        {spki && (
          <details className="mt-2">
            <summary className="text-sm underline">Show SPKI (base64)</summary>
            <pre className="mt-2 text-xs whitespace-pre-wrap break-all">{spki}</pre>
          </details>
        )}
      </section>
    </div>
  );
}
