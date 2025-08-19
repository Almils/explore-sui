// src/app/walrus/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';

type WalrusNS = typeof import('@mysten/walrus');

type FlowState =
  | { stage: 'idle' }
  | { stage: 'encoded' }
  | { stage: 'registered'; digest: string }
  | { stage: 'uploaded'; digest: string }
  | { stage: 'certified' };

const WASM_URLS = [
  'https://unpkg.com/@mysten/walrus-wasm@latest/web/walrus_wasm_bg.wasm',
  'https://cdn.jsdelivr.net/npm/@mysten/walrus-wasm@latest/web/walrus_wasm_bg.wasm',
];

export default function WalrusPage() {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const walrusModRef = useRef<WalrusNS | null>(null);
  const walrusClientRef = useRef<any>(null);
  const suiClientRef = useRef<SuiClient | null>(null);
  const flowRef = useRef<any>(null);

  const [ready, setReady] = useState(false);
  const [wasmUrl, setWasmUrl] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [state, setState] = useState<FlowState>({ stage: 'idle' });
  const [readId, setReadId] = useState('');
  const [preview, setPreview] = useState<string>('');
  const [lastError, setLastError] = useState<string | null>(null);

  async function initWalrus() {
    setLastError(null);
    setReady(false);
    walrusModRef.current = null;
    walrusClientRef.current = null;
    suiClientRef.current = null;
    try {
      // Pick the first CDN that responds
      let chosen = '';
      for (const u of WASM_URLS) {
        try {
          const r = await fetch(u, { method: 'HEAD' });
          if (r.ok) { chosen = u; break; }
        } catch { /* try next */ }
      }
      if (!chosen) throw new Error('Could not fetch Walrus WASM from CDNs');
      setWasmUrl(chosen);

      const mod = await import('@mysten/walrus');
      walrusModRef.current = mod;

      const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });
      suiClientRef.current = suiClient;

      const { WalrusClient } = mod;
      walrusClientRef.current = new WalrusClient({
        network: 'testnet',
        suiClient,
        wasmUrl: chosen,
      });

      setReady(true);
    } catch (e: any) {
      console.error('Walrus init failed:', e);
      setLastError(e?.message ?? String(e));
      setReady(false);
    }
  }

  useEffect(() => {
    initWalrus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleEncode(selected?: File[]) {
    setLastError(null);
    try {
      if (!ready || !walrusModRef.current || !walrusClientRef.current) {
        throw new Error('Walrus not ready yet. Click “Re-init Walrus” or wait a moment.');
      }
      const chosenFiles = selected ?? files;
      if (!chosenFiles.length) throw new Error('Choose at least one file, or click “Test Encode (inline text)”.');

      const { WalrusFile } = walrusModRef.current;

      const walrusFiles = await Promise.all(
        chosenFiles.map(async (f) =>
          WalrusFile.from({
            contents: new Uint8Array(await f.arrayBuffer()),
            identifier: f.name,
            tags: { 'content-type': f.type || 'application/octet-stream' },
          }),
        ),
      );

      const flow = walrusClientRef.current.writeFilesFlow({ files: walrusFiles });
      flowRef.current = flow;

      await flow.encode();
      setState({ stage: 'encoded' });
    } catch (e: any) {
      console.error('Encode error:', e);
      setLastError(e?.message ?? String(e));
    }
  }

  async function handleTestEncodeInline() {
    const blob = new Blob([`Hello Walrus @ ${new Date().toISOString()}`], { type: 'text/plain' });
    const fake = new File([blob], 'hello.txt', { type: 'text/plain' });
    await handleEncode([fake]);
  }

  async function handleRegister() {
    setLastError(null);
    try {
      if (!flowRef.current) throw new Error('Please run Encode first.');
      if (!account) throw new Error('Connect a wallet on TESTNET first.');

      const registerTx = flowRef.current.register({
        epochs: 3,
        owner: account.address,
        deletable: true,
      });

      const res = await signAndExecuteTransaction({
        transaction: registerTx,
        chain: 'sui:testnet',
      });

      setState({ stage: 'registered', digest: res.digest });
    } catch (e: any) {
      console.error('Register error:', e);
      setLastError(e?.message ?? String(e));
    }
  }

  async function handleUpload() {
    setLastError(null);
    try {
      if (!flowRef.current) throw new Error('Please run Encode + Register first.');
      if (!('digest' in state)) throw new Error('Missing register digest.');
      await flowRef.current.upload({ digest: state.digest });
      setState({ stage: 'uploaded', digest: state.digest });
    } catch (e: any) {
      console.error('Upload error:', e);
      setLastError(e?.message ?? String(e));
    }
  }

  async function handleCertify() {
    setLastError(null);
    try {
      if (!flowRef.current) throw new Error('Please run previous steps first.');
      const certifyTx = flowRef.current.certify();
      await signAndExecuteTransaction({
        transaction: certifyTx,
        chain: 'sui:testnet',
      });
      setState({ stage: 'certified' });
    } catch (e: any) {
      console.error('Certify error:', e);
      setLastError(e?.message ?? String(e));
    }
  }

  async function handleListAndPreview() {
    setLastError(null);
    try {
      if (!flowRef.current) throw new Error('No flow to list from — try Encode again.');
      const files = await flowRef.current.listFiles();
      if (!files.length) {
        setPreview('');
        throw new Error('No files found on this flow yet.');
      }
      const id = files[0].id;
      setReadId(id);
      const [wf] = await walrusClientRef.current.getFiles({ ids: [id] });
      const text = await wf.text().catch(async () => {
        const bytes = await wf.bytes();
        return `(${bytes.length} bytes)`;
      });
      setPreview(text);
    } catch (e: any) {
      console.error('List/preview error:', e);
      setLastError(e?.message ?? String(e));
    }
  }

  async function handleReadById() {
    setLastError(null);
    try {
      if (!readId) return;
      const [wf] = await walrusClientRef.current.getFiles({ ids: [readId] });
      const text = await wf.text().catch(async () => {
        const bytes = await wf.bytes();
        return `(${bytes.length} bytes)`;
      });
      setPreview(text);
    } catch (e: any) {
      console.error('Read error:', e);
      setLastError(e?.message ?? String(e));
    }
  }

  const canRegister = state.stage === 'encoded' && !!account;
  const canUpload = state.stage === 'registered';
  const canCertify = state.stage === 'uploaded' || state.stage === 'registered';

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Walrus: Upload & Read</h1>
      <p className="text-neutral-400 text-sm">Testnet only for now.</p>

      <div className="text-xs text-neutral-400">
        Walrus status: {ready ? 'ready ✅' : 'loading…'} {wasmUrl && <span className="ml-2">(wasm: {new URL(wasmUrl).host})</span>}
      </div>

      {lastError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
          Error: {lastError}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            className="text-sm"
          />

          <button
            type="button"
            onClick={() => handleEncode()}
            className="cursor-pointer rounded-lg px-3 py-2 bg-white text-black text-sm font-medium hover:opacity-90"
          >
            1) Encode
          </button>

          <button
            type="button"
            onClick={handleTestEncodeInline}
            className="cursor-pointer rounded-lg px-3 py-2 border border-white/20 text-white text-sm hover:bg-white/5"
            title="Encode a tiny inline text file to verify WASM is working"
          >
            Test Encode (inline text)
          </button>

          <button
            type="button"
            onClick={handleRegister}
            disabled={!canRegister}
            className="cursor-pointer rounded-lg px-3 py-2 border border-white/20 text-white text-sm hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!account ? 'Connect a wallet on Testnet' : undefined}
          >
            2) Register (wallet signs)
          </button>

          <button
            type="button"
            onClick={handleUpload}
            disabled={!canUpload}
            className="cursor-pointer rounded-lg px-3 py-2 border border-white/20 text-white text-sm hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            3) Upload
          </button>

          <button
            type="button"
            onClick={handleCertify}
            disabled={!canCertify}
            className="cursor-pointer rounded-lg px-3 py-2 border border-white/20 text-white text-sm hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            4) Certify (wallet signs)
          </button>

          <button
            type="button"
            onClick={handleListAndPreview}
            className="cursor-pointer rounded-lg px-3 py-2 border border-white/20 text-white text-sm hover:bg-white/5"
          >
            5) List & Preview
          </button>

          <button
            type="button"
            onClick={initWalrus}
            className="cursor-pointer rounded-lg px-3 py-2 border border-white/20 text-white text-sm hover:bg-white/5"
            title="If the module got stuck, re-initialize Walrus"
          >
            Re-init Walrus
          </button>
        </div>

        <div className="text-xs text-neutral-300 space-y-1">
          <div>State: <span className="font-mono">{state.stage}</span></div>
          {'digest' in state && <div>Digest: <span className="font-mono break-all">{state.digest}</span></div>}
          <div>Selected files: {files.length ? files.map(f => f.name).join(', ') : 'none'}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 p-6 space-y-3">
        <div className="flex gap-2">
          <input
            value={readId}
            onChange={(e) => setReadId(e.target.value)}
            placeholder="Paste a Walrus file/quilt ID to read"
            className="flex-1 rounded-lg bg-neutral-900 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-neutral-500"
          />
          <button
            type="button"
            onClick={handleReadById}
            className="cursor-pointer rounded-lg px-3 py-2 bg-white text-black text-sm font-medium hover:opacity-90"
          >
            Read
          </button>
        </div>
        {preview && <pre className="text-xs whitespace-pre-wrap break-all">{preview}</pre>}
      </div>
    </div>
  );
}
