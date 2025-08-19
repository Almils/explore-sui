// src/components/Footer.tsx
import Image from 'next/image';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-10 border-t border-border/70 bg-[rgba(9,12,24,0.85)] backdrop-blur supports-[backdrop-filter]:bg-[rgba(9,12,24,0.72)]">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Image
            src="/logo-60.svg"
            alt="Sui AI Guide logo"
            width={32}
            height={32}
            className="rounded-xl"
            priority
          />
          <div className="text-sm text-neutral-300">
            <span className="font-semibold">Sui AI Guide</span> · © {year}
          </div>
        </div>

        {/* Contact / Social */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-400">Get in touch:</span>

          <a
            href="https://x.com/x_orthodox"
            target="_blank"
            rel="noreferrer"
            aria-label="X profile @x_orthodox"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-1.5 text-sm text-neutral-200 hover:bg-white/10"
          >
            {/* X icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="opacity-90">
              <path fill="currentColor" d="M18.244 2H21l-6.68 7.64L22 22h-6.58l-4.95-6.38L4.73 22H2l7.27-8.32L2 2h6.58l4.6 5.93L18.24 2Zm-1.15 18h2.01L8.01 4H6.01l11.08 16Z"/>
            </svg>
            @x_orthodox
          </a>

          <a
            href="https://t.me/MicahAm"
            target="_blank"
            rel="noreferrer"
            aria-label="Telegram @MicahAm"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-1.5 text-sm text-neutral-200 hover:bg-white/10"
          >
            {/* Telegram icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="opacity-90">
              <path fill="currentColor" d="M21.94 4.66c.26-.96-.73-1.77-1.62-1.37L2.72 11.1c-.87.39-.79 1.66.11 1.92l4.7 1.36 1.82 5.86c.27.88 1.47 1.02 1.94.23l2.61-4.29 4.95 3.66c.83.61 2.01.16 2.24-.85l2.85-13.33ZM7.9 12.65l9.7-6.2-7.67 7.85-.23 2.49-1.8-4.14Z"/>
            </svg>
            @MicahAm
          </a>
        </div>
      </div>
    </footer>
  );
}
