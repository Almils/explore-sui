'use client';

import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { openAgentWithPrompt } from '@/lib/AgentBus';

export type Project = {
  id: string;
  name: string;
  blurb: string;
  category: string;
  tags?: string[];
  tryPath?: string;      // internal route
  site?: string;         // external URL (optional)
  prompt?: string;       // AI prompt for this project
};

export default function ProjectCard({ p }: { p: Project }) {
  const prompt = p.prompt || `Teach me about ${p.name} on Sui.`;
  const hasOpen = !!p.tryPath || !!p.site;

  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold">{p.name}</div>
          <div className="text-sm text-muted">{p.blurb}</div>
        </div>
        <div className="text-[11px] px-2 py-0.5 rounded-full border border-border/70">
          {p.category}
        </div>
      </div>

      {p.tags?.length ? (
        <div className="flex flex-wrap gap-1">
          {p.tags.map((t) => (
            <span key={t} className="text-[11px] px-2 py-0.5 rounded-full border border-border/50 text-muted">
              {t}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-1 flex items-center gap-2">
        <Button variant="secondary" onClick={() => openAgentWithPrompt(prompt)}>
          Ask Agent
        </Button>

        {hasOpen && p.tryPath && (
          <Link href={p.tryPath}>
            <Button>Open</Button>
          </Link>
        )}
        {hasOpen && !p.tryPath && p.site && (
          <a href={p.site} target="_blank" rel="noreferrer">
            <Button>Open</Button>
          </a>
        )}
      </div>
    </Card>
  );
}
