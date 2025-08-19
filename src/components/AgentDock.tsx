'use client';

import { useEffect, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import AgentQuickActions from '@/components/AgentQuickActions';
import AgentSendFirst from '@/components/AgentSendFirst';
import ReceiveFundsCard from '@/components/ReceiveFundsCard';
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

  // NEW: manage an abort controller for the in-flight request
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    function onOpen(e: any) {
      const prompt = e?.detail?.prompt as string | undefined;
      setOpen(true);
      if (prompt) setInput(prompt);
      // focus the input for fast follow-ups
      setTimeout(() => inputRef.current?.focus(), 0);
    }
    window.addEventListener(AGENT_OPEN_EVENT, onOpen as EventListener);
    return () => window.removeEventListener(AGENT_OPEN_EVENT, onOpen as EventListener);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && handleClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function handleClose() {
    // If streaming, cancel it first so busy always resets
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setBusy(false);
    setOpen(false);
  }

  async function send() {
    const q = input.trim();
    if (!q || busy) return;

    setBusy(true);
    // snapshot messages at send-time to avoid race on quick successive sends
    setMessages((m) => [...m, { role: 'user', content: q }, { role: 'assistant', content: '' }]);
    setInput('');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: q }],
          address,
          source,
        }),
        signal: controller.signal,
      });

      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const data = await res.json().catch(() => ({}));
        const detail = data?.detail || data?.error || 'Agent backend error';
        throw new Error(detail);
      }
      if (!ct.startsWith('text/')) {
        const text = await res.text().catch(() => '');
        throw new Error(text || 'Agent returned unexpected content');
      }

      if (!res.body) throw new Error('No response body from Agent API');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      // Optional: idle safety — if nothing arrives for 20s after some output, cancel.
      let gotAny = false;
      let idleTimer: any = null;
      const armIdle = () => {
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
          if (gotAny && abortRef.current === controller) controller.abort();
        }, 20000);
      };

      armIdle();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          gotAny = true;
          armIdle();
          const text = decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const out = [...prev];
            const last = out[out.length - 1];
            if (last?.role === 'assistant') {
              out[out.length - 1] = { role: 'assistant', content: last.content + text };
            }
            return out;
          });
        }
      }

      if (idleTimer) clearTimeout(idleTimer);
    } catch (e: any) {
      const msg = (e?.name === 'AbortError') ? 'Stopped.' : (e?.message || 'Something went wrong talking to the AI.');
      setMessages((m) => [...m, { role: 'assistant', content: msg }]);
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setBusy(false); // ✅ always re-enable the button
      // Focus back so user can type immediately
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }

  return (
    <>
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
          <div className="fixed inset-0 z-40 bg-black/30" onClick={handleClose} aria-hidden="true" />

          <div
            className="fixed bottom-5 right-5 z-50 w-[min(100vw-2rem,420px)] h-[min(85vh,720px)] rounded-3xl border border-border bg-surface backdrop-blur shadow-xl overflow-hidden flex flex-col"
            role="dialog"
            aria-modal="true"
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
                  onClick={handleClose}
                  className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
                  aria-label="Close Agent"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Safety banner */}
            {net === 'mainnet' && (
              <div className="px-4 pt-2 pb-0 shrink-0">
                <div className="rounded-xl border border-white/15 bg-white/5 p-2 text-[12px] text-neutral-300">
                  Mainnet selected — actions may use real assets. Make sure your wallet is on <b>Mainnet</b> when signing.
                </div>
              </div>
            )}

            {/* Body */}
            <div className="px-4 py-3 flex-1 overflow-y-auto space-y-3">
              <AgentQuickActions net={net} />
              <ReceiveFundsCard />
              <AgentSendFirst net={net} />

              <div className="space-y-3">
                {messages.map((m, i) => (
                  <div key={i} className="rounded-2xl border border-white/10 p-3">
                    <div className="text-[10px] uppercase tracking-wide text-muted mb-1">{m.role}</div>
                    <div className="text-sm whitespace-pre-wrap">
                      {m.content || (busy && i === messages.length - 1 ? '…' : '')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Input row */}
            <div className="p-4 border-t border-white/10 shrink-0 flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !busy && input.trim() && send()}
                placeholder={`Ask anything… e.g., “fund my ${net} wallet”`}
                className="flex-1 rounded-lg bg-neutral-900 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-neutral-500"
              />
              {!busy ? (
                <Button onClick={send} disabled={!input.trim()}>
                  Send
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => {
                    abortRef.current?.abort();
                  }}
                >
                  Stop
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
