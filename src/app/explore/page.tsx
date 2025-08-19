'use client';

import { useMemo, useState } from 'react';
import ProjectCard, { Project } from '@/components/ProjectCard';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { openAgentWithPrompt } from '@/lib/AgentBus';

const CATS = [
  'Featured', 'AI', 'Wallets', 'Identity', 'Storage', 'Trading',
  'DeFi', 'Lending', 'Gaming', 'Tools', 'Infra', 'Learn',
] as const;
type Cat = typeof CATS[number];

// Mysten-first ordering when category = Featured / All
const FEATURED_IDS = new Set([
  'sui', 'deepbook', 'walrus', 'suins', 'seal', 'zklogin', 'passkey',
  'slush', 'suivision', 'nautilus', 'ika', 'sui-robots',
]);

const ALL_PROJECTS: Project[] = [
  // ===== Mysten / Core-first =====
  {
    id: 'sui',
    name: 'Sui',
    blurb: 'Fast, safe, object-centric L1 by Mysten Labs.',
    category: 'Infra',
    tags: ['L1', 'Move', 'objects'],
    prompt: 'What is Sui and how do I get started building & using it?',
  },
  {
    id: 'deepbook',
    name: 'DeepBook',
    blurb: 'On-chain central limit order book.',
    category: 'Trading',
    tags: ['CLOB', 'DEX'],
    tryPath: '/deepbook',
    prompt: 'Open DeepBook and show me SUI/USDC price. Then help me try a tiny testnet order.',
  },
  {
    id: 'walrus',
    name: 'Walrus',
    blurb: 'Object-backed content storage on Sui.',
    category: 'Storage',
    tags: ['files', 'quilt', 'content id'],
    tryPath: '/walrus',
    prompt: 'Help me upload a file to Walrus and fetch it back.',
  },
  {
    id: 'suins',
    name: 'SuiNS',
    blurb: 'Human-readable names for Sui (like name.sui).',
    category: 'Identity',
    tags: ['names', 'identity'],
    prompt: 'How do I register a .sui name and resolve it?',
  },
  {
    id: 'seal',
    name: 'SEAL',
    blurb: 'Sui-native attestations & verifiable credentials.',
    category: 'Identity',
    tags: ['attestation', 'credentials'],
    prompt: 'What can SEAL do and how would I issue/verify a credential?',
  },
  {
    id: 'zklogin',
    name: 'zkLogin',
    blurb: 'Sign in with Google/Apple via ZK. No seed phrase.',
    category: 'Identity',
    tags: ['login', 'zk'],
    tryPath: '/auth',
    prompt: 'Help me sign in with zkLogin and show my address.',
  },
  {
    id: 'passkey',
    name: 'Passkey',
    blurb: 'Passwordless sign-in using WebAuthn.',
    category: 'Identity',
    tags: ['passkey', 'security'],
    tryPath: '/passkey',
    prompt: 'Create a passkey and link it to my Sui account.',
  },
  {
    id: 'slush',
    name: 'Slush Wallet',
    blurb: 'Simple browser wallet for Sui.',
    category: 'Wallets',
    tags: ['wallet', 'onboarding'],
    prompt: 'How do I install and connect Slush wallet here?',
  },
  {
    id: 'suivision',
    name: 'SuiVision',
    blurb: 'Explorer & analytics for Sui.',
    category: 'Tools',
    tags: ['explorer', 'analytics'],
    prompt: 'Open SuiVision and show me how to find my transactions.',
  },

  // ===== Other categories to grow over time =====
  {
    id: 'ika',
    name: 'IKA',
    blurb: 'Community project on Sui (minigames/experiments).',
    category: 'Gaming',
    tags: ['community', 'fun'],
    prompt: 'What is IKA on Sui and how can I try it?',
  },
  {
    id: 'sui-robots',
    name: 'Sui Robots',
    blurb: 'Robots-themed project on Sui (collect/play).',
    category: 'Gaming',
    tags: ['collectibles', 'fun'],
    prompt: 'Tell me about Sui Robots and how to start.',
  },
  {
    id: 'defi-starter',
    name: 'DeFi Starter',
    blurb: 'Learn swaps, LP, and yields on Sui using testnet first.',
    category: 'DeFi',
    tags: ['learn', 'yields'],
    prompt: 'Teach me DeFi basics on Sui using testnet demos.',
  },
  {
    id: 'lending-starter',
    name: 'Lending Starter',
    blurb: 'Try lending/borrowing safely on testnet.',
    category: 'Lending',
    tags: ['learn', 'risk'],
    prompt: 'Explain lending on Sui and help me try a testnet demo.',
  },
  {
    id: 'ai-agent',
    name: 'AI Agent',
    blurb: 'In-app teacher. Ask questions and run guided actions.',
    category: 'AI',
    tags: ['assistant', 'help'],
    prompt: 'What should I try next on Sui?',
  },
  {
    id: 'docs',
    name: 'Sui Docs',
    blurb: 'Official docs and tutorials for building on Sui.',
    category: 'Learn',
    tags: ['docs', 'tutorials'],
    prompt: 'Give me a beginner path to learn Sui basics and Move.',
  },
];

export default function ExplorePage() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<Cat>('Featured');

  const filtered = useMemo(() => {
    const t = q.toLowerCase().trim();
    let items = ALL_PROJECTS.filter((p) =>
      cat === 'Featured' ? true : p.category === cat,
    ).filter((p) => {
      if (!t) return true;
      const hay = [p.name, p.blurb, p.tags?.join(' ') ?? ''].join(' ').toLowerCase();
      return hay.includes(t);
    });

    // Put Mysten/core projects first when Featured
    if (cat === 'Featured') {
      items = items.slice().sort((a, b) => {
        const pa = FEATURED_IDS.has(a.id) ? 0 : 1;
        const pb = FEATURED_IDS.has(b.id) ? 0 : 1;
        if (pa !== pb) return pa - pb;
        return a.name.localeCompare(b.name);
      });
    }

    return items;
  }, [q, cat]);

  return (
    <div className="space-y-4">
      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search projects…"
            className="flex-1 rounded-lg bg-neutral-900 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-neutral-500"
          />
          <Button onClick={() => openAgentWithPrompt('What should I try next on Sui?')}>
            Ask Agent
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {CATS.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`text-sm px-3 py-1.5 rounded-xl border ${
                cat === c ? 'border-white/20 bg-white/10' : 'border-white/10 hover:bg-white/5'
              }`}
              aria-pressed={cat === c}
            >
              {c}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((p) => (
          <ProjectCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}
