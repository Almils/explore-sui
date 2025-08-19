'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@mysten/dapp-kit';

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  // Lock scroll + ESC to close when open
  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <button
        className="md:hidden rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        Menu
      </button>

      {open && (
        // More opaque scrim to hide page content
        <div
          className="fixed inset-0 z-50 bg-black/80"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute right-3 top-3 w-[min(90vw,340px)] rounded-3xl border border-white/15 bg-background p-4 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Menu</div>
              <button
                className="text-sm text-muted hover:text-foreground"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                Close
              </button>
            </div>

            <nav className="mt-3 grid gap-1 text-sm">
              <Link href="/agent" className="rounded-lg px-3 py-2 hover:bg-white/5">AI Agent</Link>
              <Link href="/explore" className="rounded-lg px-3 py-2 hover:bg-white/5">Explore</Link>
              <Link href="/walrus" className="rounded-lg px-3 py-2 hover:bg-white/5">Walrus</Link>
              <Link href="/profile" className="rounded-lg px-3 py-2 hover:bg-white/5">Profile</Link>
              <Link href="/deepbook" className="text-sm text-foreground/90 hover:text-foreground">DeepBook</Link>

            </nav>

            <div className="mt-4">
              <ConnectButton connectText="Connect wallet" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
