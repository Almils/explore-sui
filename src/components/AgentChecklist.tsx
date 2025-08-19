'use client';

import { useEffect, useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

type Step = {
  id: string;
  title: string;
  done: boolean;
  action?: () => void;
};
const storageKey = 'guide_steps';

export default function AgentChecklist() {
  const [steps, setSteps] = useState<Step[]>([
    { id: 'connect', title: 'Connect a wallet OR finish zkLogin/passkey', done: false },
    { id: 'faucet', title: 'Get Devnet SUI (faucet)', done: false },
    { id: 'balance', title: 'Check your balance', done: false },
    { id: 'send', title: 'Send your first tiny transfer', done: false },
    { id: 'explore', title: 'Explore a Sui app (Walrus / DeepBook / SuiNS)', done: false },
  ]);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try { setSteps(JSON.parse(saved)); } catch {}
    }
  }, []);
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(steps));
  }, [steps]);

  const progress = useMemo(() => {
    const total = steps.length;
    const done = steps.filter(s => s.done).length;
    return Math.round((done / total) * 100);
  }, [steps]);

  function toggle(id: string) {
    setSteps((s) => s.map(x => x.id === id ? { ...x, done: !x.done } : x));
  }

  return (
    <Card className="space-y-3">
      <div className="text-sm font-medium">Your Sui onboarding</div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full bg-brand-gradient" style={{ width: `${progress}%` }} />
      </div>
      <ul className="space-y-2">
        {steps.map(s => (
          <li key={s.id} className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2">
            <span className="text-sm">{s.title}</span>
            <Button variant={s.done ? 'secondary' : 'primary'} size="sm" onClick={() => toggle(s.id)}>
              {s.done ? 'Done ✓' : 'Mark done'}
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
