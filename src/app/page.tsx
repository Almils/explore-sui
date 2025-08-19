'use client';

import Link from 'next/link';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    try {
      if (!localStorage.getItem('sui-guide-onboarded')) {
        router.replace('/welcome');
      }
    } catch {}
  }, [router]);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* --- Hero --- */}
      <section className="rounded-3xl border border-border bg-surface p-6 md:p-8">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="inline-flex items-center gap-2 text-xs text-muted">
              <span>On-chain guide</span> • <span>Normie-friendly</span>
            </div>

            {/* Brand + Title */}
            <div className="flex items-center gap-3">
              <Image
                src="/logo-60.svg"
                alt="Sui AI Guide logo"
                width={44}
                height={44}
                className="rounded-xl flex-none"
                priority
              />
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Welcome to{' '}
                <span className="bg-brand-gradient bg-clip-text text-transparent">
                  Sui AI Guide
                </span>
              </h1>
            </div>

            {/* Made with Sui badge */}
            <div className="inline-flex items-center gap-2 text-xs rounded-full border border-white/15 bg-white/5 px-2.5 py-1">
              <span className="opacity-80">Made with</span>
              <span className="font-semibold">Sui</span>
            </div>

            <p className="text-muted">
              One-click onboarding. Explore projects. Get answers in-app via the AI Agent.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/agent">
                <Button>Open AI Agent</Button>
              </Link>
              <Link href="/explore">
                <Button variant="secondary">Explore Sui Projects</Button>
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-white/5 p-4">
            <div className="text-sm font-medium mb-2">Quick Start</div>
            <ol className="text-sm text-muted space-y-1">
              <li>① Connect a wallet or finish zkLogin / Passkey</li>
              <li>② Get Devnet/Testnet SUI</li>
              <li>③ Send your first transfer</li>
              <li>④ Explore Walrus / DeepBook / SuiNS</li>
            </ol>
            <div className="text-xs text-muted mt-2">
              You can do all this inside the Agent.
            </div>
          </div>
        </div>
      </section>

      {/* --- Feature Cards --- */}
      <section className="grid md:grid-cols-3 gap-6">
        {/* Wallets */}
        <Card className="p-5 space-y-4">
          <div className="text-lg font-semibold">Wallets</div>
          <div className="text-sm text-muted">Connect Slush or try zkLogin / Passkey.</div>
          <div className="flex gap-2">
            <Link href="/profile"><Button variant="secondary">Profile</Button></Link>
            <Link href="/passkey"><Button variant="secondary">Passkey</Button></Link>
          </div>
        </Card>

        {/* Trading (DeepBook) */}
        <Card className="p-5 space-y-4">
          <div className="text-lg font-semibold">Trading (DeepBook)</div>
          <div className="text-sm text-muted">
            On-chain order book. Start with a market view, then place a tiny order.
          </div>
          <div>
            <Link href="/deepbook">
              <Button>Open DeepBook</Button>
            </Link>
          </div>
        </Card>

        {/* Storage (Walrus) */}
        <Card className="p-5 space-y-4">
          <div className="text-lg font-semibold">Storage (Walrus)</div>
          <div className="text-sm text-muted">Upload & fetch files on Testnet.</div>
          <div>
            <Link href="/walrus">
              <Button variant="secondary">Open Walrus</Button>
            </Link>
          </div>
        </Card>
      </section>
    </main>
  );
}
