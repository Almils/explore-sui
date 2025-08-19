'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {/* Toggle button visible on small screens */}
      <div className="md:hidden">
        <Button
          onClick={() => setOpen(true)}
          size="sm"
          variant="secondary"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          Menu
        </Button>
      </div>

      {open && (
        <>
          {/* Scrim: darker so menu stands out */}
          <div
            className="fixed inset-0 z-40 bg-black/70"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Panel */}
          <div
            id="mobile-menu"
            role="dialog"
            aria-label="Main menu"
            className="fixed inset-x-4 top-6 z-50 rounded-2xl border border-white/10 bg-[#0b1020]/95 backdrop-blur p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Navigation</div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <nav className="grid gap-2">
              <Link
                href="/agent"
                className="rounded-xl border border-white/10 px-3 py-2 hover:bg-white/5"
                onClick={() => setOpen(false)}
              >
                AI Agent
              </Link>
              <Link
                href="/explore"
                className="rounded-xl border border-white/10 px-3 py-2 hover:bg-white/5"
                onClick={() => setOpen(false)}
              >
                Explore
              </Link>
              <Link
                href="/walrus"
                className="rounded-xl border border-white/10 px-3 py-2 hover:bg-white/5"
                onClick={() => setOpen(false)}
              >
                Walrus
              </Link>
              <Link
                href="/deepbook"
                className="rounded-xl border border-white/10 px-3 py-2 hover:bg-white/5"
                onClick={() => setOpen(false)}
              >
                DeepBook
              </Link>
              <Link
                href="/profile"
                className="rounded-xl border border-white/10 px-3 py-2 hover:bg-white/5"
                onClick={() => setOpen(false)}
              >
                Profile
              </Link>
            </nav>
          </div>
        </>
      )}
    </>
  );
}
