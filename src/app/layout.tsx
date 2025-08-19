// src/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import ClientProviders from '@/components/ClientProviders';
import TopNav from '@/components/TopNav';
import AgentDock from '@/components/AgentDock';
import Footer from '@/components/Footer';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Sui AI Guide',
    template: '%s · Sui AI Guide',
  },
  description: 'Your playful on-chain tutor for the Sui ecosystem.',
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Sui AI Guide',
    title: 'Sui AI Guide',
    description: 'Learn Sui by doing, with an in-app AI agent.',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sui AI Guide',
    description: 'Learn Sui by doing, with an in-app AI agent.',
    images: ['/og.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-touch-icon.png' }],
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* web fonts (kept as link tags; optional to migrate to next/font) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans bg-background text-foreground bg-mesh">
        <ClientProviders>
          <TopNav />
          <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
          <Footer /> 
          <AgentDock />
        </ClientProviders>
      </body>
    </html>
  );
}
