'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import AgentQuickActions from '@/components/AgentQuickActions';
import AgentSendFirst from '@/components/AgentSendFirst';
import { useActiveAddress } from '@/hooks/useActiveAddress';
import AddressChip from '@/components/AddressChip';
import { AGENT_OPEN_EVENT } from '@/lib/AgentBus';

type Msg = { role: 'user' | 'assistant'; content: string };
type Net = 'devnet' | 'testnet' | 'mainnet';

export default function AgentDock() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: 'Hi! I can help you fund your wallet and try apps. Use Quick Actions or ask me anything.' },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const { address, source } = useActiveAddress();
  const [net, setNet] = useState<Net>('devnet');

  // Open via custom event (from "Ask Agent" buttons, etc.)
  useEffect(() => {
    function onOpen(e: any) {
      const prompt = e?.detail?.prompt as string | undefined;
      setOpen(true);
      if (prompt) setInput(prompt);
    }
    window.addEventListener(AGENT_OPEN_EVENT, onOpen as EventListener);
    return () => window.removeEventListener(AGENT_OPEN_EVENT, onOpen as EventListener);
  }, []);

  // ESC closes when open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  async function send() {
    const q = input.trim();
    if (!q || busy) return;
    setBusy(true);
    setMessages((m) => [...m, { role: 'user', content: q }, { role: 'assistant', content: '' }]);
    setInput('');

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, { role: 'user', content: q }], address, source }),
      });

      if (!res.ok) {
        const text = await res.clone().text();
        let detail = text;
        try {
          const j = JSON.parse(text);
          detail = j?.error ? `${j.error}${j.detail ? `: ${j.detail}` : ''}` : text;
        } catch {}
        throw new Error(detail || 'Agent API error');
      }

      if (!res.body) throw new Error('No response body from Agent API');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const out = [...prev];
          const last = out[out.length - 1];
          if (last?.role === 'assistant') out[out.length - 1] = { role: 'assistant', content: last.content + text };
          return out;
        });
      }
    } catch (e: any) {
      setMessages((m) => [...m, { role: 'assistant', content: e?.message || 'Something went wrong talking to the AI.' }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Floating opener — hidden while dock is open so it can't be covered */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 rounded-full bg-brand-gradient text-black shadow-brand px-4 py-3 text-sm font-medium"
          aria-label="Open AI Agent"
        >
          Open Agent
        </button>
      )}

      {open && (
        <>
          {/* Darker scrim for readability */}
          <div
            className="fixed inset-0 z-40 bg-black/70"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Opaque-ish panel */}
          <div
            className="fixed bottom-5 right-5 z-50 w-[min(100vw-2rem,420px)] h-[min(85vh,720px)] rounded-3xl border border-white/12 bg-[#0b1020]/98 backdrop-blur-sm shadow-[0_12px_48px_rgba(0,0,0,0.65)] overflow-hidden flex flex-col"
            role="dialog"
            aria-label="AI Agent"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 shrink-0 flex items-center justify-between gap-2">
              <div className="text-sm font-medium">AI Agent</div>
              <div className="flex items-center gap-2 min-w-0">
                <select
                  value={net}
                  onChange={(e) => setNet(e.target.value as Net)}
                  className="rounded-lg bg-neutral-900 border border-white/15 px-2 py-1 text-xs text-white"
                  title="Pick network for actions"
                >
                  <option value="devnet">devnet</option>
                  <option value="testnet">testnet</option>
                  <option value="mainnet">mainnet</option>
                </select>
                {address ? (
                  <div className="min-w-0">
                    <AddressChip address={address} label={source ?? undefined} />
                  </div>
                ) : (
                  <div className="text-xs text-muted">No account yet</div>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-white/15 bg-white/8 px-2 py-1 text-xs hover:bg-white/12"
                  aria-label="Close Agent"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Mainnet warning */}
            {net === 'mainnet' && (
              <div className="px-4 pt-2 pb-0 shrink-0">
                <div className="rounded-xl border border-white/15 bg-white/[0.07] p-2 text-[12px] text-neutral-300">
                  Mainnet selected — actions may use real assets. Make sure your wallet is on <b>Mainnet</b> when signing.
                </div>
              </div>
            )}

            {/* Body */}
            <div className="px-4 py-3 flex-1 overflow-y-auto space-y-3">
              <AgentQuickActions net={net} />
              <AgentSendFirst net={net} />

              <div className="space-y-3">
                {messages.map((m, i) => (
                  <div key={i} className="rounded-2xl border border-white/10 p-3 bg-white/[0.02]">
                    <div className="text-[10px] uppercase tracking-wide text-muted mb-1">{m.role}</div>
                    <div className="text-sm whitespace-pre-wrap">
                      {m.content || (busy && i === messages.length - 1 ? '…' : '')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 shrink-0 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder={`Ask anything… e.g., “fund my ${net} wallet”`}
                className="flex-1 rounded-lg bg-neutral-900 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-neutral-500"
              />
              <Button onClick={send} disabled={busy}>Send</Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
