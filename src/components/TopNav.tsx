'use client';

import Link from 'next/link';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import AccountBadge from './AccountBadge';
import ZkAccountBadge from './ZkAccountBadge';
import { useZkSession } from '@/hooks/useZkSession';
import { usePasskeySession } from '@/hooks/usePasskeySession';
import Button from '@/components/ui/Button';
import MobileNav from '@/components/MobileNav';

export default function TopNav() {
  const walletAccount = useCurrentAccount();
  const { zkAddress } = useZkSession();
  const { passkeyAddress } = usePasskeySession();

  const showWallet = !!walletAccount?.address;
  const showZk = !showWallet && !!zkAddress;
  const showPasskey = !showWallet && !showZk && !!passkeyAddress;

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-[rgba(9,12,24,0.6)] backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
        <img src="/logo-60.svg" alt="Sui Guide" className="h-8 w-8 rounded-xl" />
          <div className="font-semibold tracking-tight group-hover:opacity-90">Sui AI Guide</div>
          
        </Link>

        {/* Desktop nav + actions */}
        <div className="flex items-center gap-3">
          <nav className="hidden md:flex items-center gap-3">
            <Link href="/agent" className="text-sm text-foreground/90 hover:text-foreground">AI Agent</Link>
            <Link href="/explore" className="text-sm text-foreground/90 hover:text-foreground">Explore</Link>
            <Link href="/deepbook" className="text-sm text-foreground/90 hover:text-foreground">DeepBook</Link>

            <Link href="/walrus" className="text-sm text-foreground/90 hover:text-foreground">Walrus</Link>
            <Link href="/profile" className="text-sm text-foreground/90 hover:text-foreground">Profile</Link>

            {/* show exactly ONE identity pill */}
            {showWallet && <AccountBadge />}

            {showZk && <ZkAccountBadge address={zkAddress!} />}

            {showPasskey && (
              <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-1.5">
                <span className="text-xs text-muted">passkey</span>
                <span className="text-xs">{passkeyAddress}</span>
              </div>
            )}

            {!showWallet && !showZk && !showPasskey && (
              <Button asChild variant="primary" size="sm">
                <ConnectButton connectText="Connect" />
              </Button>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
