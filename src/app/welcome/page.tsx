'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';

export default function WelcomePage() {
  const router = useRouter();

  function continueToApp() {
    try { localStorage.setItem('sui-guide-onboarded', '1'); } catch {}
    router.replace('/');
  }

  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-4 relative">
      {/* Brand background */}
      <Image
        src="/brand-bg.svg"
        alt=""
        priority
        fill
        className="object-cover -z-10 select-none pointer-events-none"
      />

      <div className="max-w-3xl w-full rounded-3xl border border-border bg-surface/90 backdrop-blur p-6 md:p-8 space-y-6">
        {/* Brand row */}
        <div className="flex items-center gap-3">
          <Image
            src="/logo-60.svg"
            alt="Sui Guide logo"
            width={40}
            height={40}
            className="rounded-xl"
            priority
          />
          <Image
            src="/wordmark.svg"
            alt="Sui Guide"
            width={160}
            height={30}
            className="hidden sm:block"
            priority
          />
          <div className="sm:hidden text-xl font-semibold tracking-tight">Sui Guide</div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold leading-tight">
          Your playful, on-chain{' '}
          <span className="bg-brand-gradient bg-clip-text text-transparent">Sui tutor</span>
        </h1>

        <p className="text-muted">
          Learn by doing. Connect a wallet or use zkLogin/Passkey, try storage on Walrus,
          peek at DeepBook markets, and let the AI Agent guide you in real time.
        </p>

        <ol className="grid md:grid-cols-2 gap-3 text-sm">
          <li className="rounded-2xl border border-white/10 p-3">
            <div className="font-medium mb-1">① Sign in</div>
            <div className="text-muted">Connect Slush, zkLogin, or Passkey.</div>
          </li>
          <li className="rounded-2xl border border-white/10 p-3">
            <div className="font-medium mb-1">② Get test SUI</div>
            <div className="text-muted">Request from faucet (devnet/testnet).</div>
          </li>
          <li className="rounded-2xl border border-white/10 p-3">
            <div className="font-medium mb-1">③ First transfer</div>
            <div className="text-muted">Send 0.001 SUI to any address.</div>
          </li>
          <li className="rounded-2xl border border-white/10 p-3">
            <div className="font-medium mb-1">④ Explore</div>
            <div className="text-muted">Walrus, DeepBook, SuiNS and more.</div>
          </li>
        </ol>

        <div className="flex flex-wrap gap-3">
          <Button onClick={continueToApp}>Continue</Button>
          <Link href="/agent"><Button variant="secondary">Open AI Agent</Button></Link>
          <Link href="/explore"><Button variant="secondary">Explore projects</Button></Link>
        </div>

        <div className="text-xs text-neutral-400">
          Tip: You’ll see this page once. You can always return via <code>/welcome</code>.
        </div>
      </div>
    </main>
  );
}
