'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function Hero() {
  return (
    <Card className="bg-[radial-gradient(1200px_500px_at_0%_-10%,rgba(124,92,255,.20),transparent),radial-gradient(1000px_500px_at_100%_0%,rgba(0,229,255,.14),transparent)]">
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-muted mb-3">
            <span>On-chain guide</span> <span>•</span> <span>Normie-friendly</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
            Welcome to <span className="bg-brand-gradient bg-clip-text text-transparent">Sui Guide</span>
          </h1>
          <p className="text-sm text-muted mt-2">
            One-click onboarding. Explore projects. Get answers in-app via the AI Agent.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button>
              <Link href="/agent">Open AI Agent</Link>
            </Button>
            <Button variant="secondary">
              <Link href="/explore">Explore Sui Projects</Link>
            </Button>
          </div>
        </div>

        <div className="w-full lg:w-80">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-medium mb-2">Quick Start</div>
            <ul className="text-sm text-neutral-300 space-y-2">
              <li>① Connect a wallet or finish zkLogin / Passkey</li>
              <li>② Get Devnet SUI</li>
              <li>③ Send your first transfer</li>
              <li>④ Explore Walrus / DeepBook / SuiNS</li>
            </ul>
            <div className="mt-3 text-xs text-muted">You can do all this inside the Agent.</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
