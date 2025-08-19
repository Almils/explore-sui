'use client';

import { useState } from 'react';
import AgentQuickActions from '@/components/AgentQuickActions';
import AgentSendFirst from '@/components/AgentSendFirst';
import Card from '@/components/ui/Card';

type Net = 'devnet' | 'testnet' | 'mainnet';

export default function AgentPage() {
  const [net, setNet] = useState<Net>('devnet');

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">AI Agent</h1>
        <div className="flex items-center gap-2">
          <label className="text-xs text-neutral-400">Network</label>
          <select
            value={net}
            onChange={(e) => setNet(e.target.value as Net)}
            className="rounded-lg bg-neutral-900 border border-white/15 px-2 py-1 text-xs text-white"
          >
            <option value="devnet">devnet</option>
            <option value="testnet">testnet</option>
            <option value="mainnet">mainnet</option>
          </select>
        </div>
      </div>

      {/* Quick actions + first transfer helper */}
      <div className="space-y-4">
        <AgentQuickActions net={net} />
        <AgentSendFirst net={net} />
      </div>

      {/* “What to try next” section (kept from your original layout) */}
      <Card className="p-4">
        <div className="text-sm font-medium">What you can try next</div>
        <ul className="mt-2 text-sm text-neutral-300 list-disc ml-5 space-y-1">
          <li>Get test SUI (devnet/testnet) then send 0.001 SUI to a friend.</li>
          <li>Upload a file to Walrus and fetch it back by ID.</li>
          <li>Explore DeepBook markets; connect wallet to place/cancel tiny testnet orders.</li>
          <li>Register a name on SuiNS and resolve it to your address.</li>
        </ul>
      </Card>
    </main>
  );
}
