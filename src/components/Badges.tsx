import { Camera, Hourglass, PenLine, ShieldCheck } from 'lucide-react';
import { evidenceOf, gameMeta, type EvidenceStatus } from '../lib/catalog';
import type { GameId, Opening } from '../lib/types';

const EVIDENCE: Record<EvidenceStatus, { label: string; short: string; cls: string; Icon: typeof Camera }> = {
  verified: {
    label: 'Verified',
    short: 'Verified',
    cls: 'border-gold-400/60 bg-gold-400/15 text-gold-200',
    Icon: ShieldCheck,
  },
  photo: {
    label: 'Photo Evidence',
    short: 'Photo',
    cls: 'border-sky-400/50 bg-sky-400/10 text-sky-200',
    Icon: Camera,
  },
  logged: {
    label: 'Logged',
    short: 'Logged',
    cls: 'border-ink-500 bg-ink-800 text-ink-200',
    Icon: PenLine,
  },
};

export function EvidenceBadge({ opening, compact = false }: { opening: Pick<Opening, 'evidence' | 'video_review'>; compact?: boolean }) {
  const status = evidenceOf(opening);
  const e = EVIDENCE[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border font-semibold ${e.cls} ${compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}
      title={e.label}
    >
      <e.Icon size={compact ? 11 : 13} strokeWidth={2.5} />
      {compact ? e.short : e.label}
    </span>
  );
}

export function PendingBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-400/50 bg-amber-400/10 font-semibold text-amber-200 ${compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}
    >
      <Hourglass size={compact ? 11 : 13} strokeWidth={2.5} />
      Review pending
    </span>
  );
}

export function DemoTag({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded border border-dashed border-ink-500 px-1.5 py-px text-[9px] font-bold uppercase tracking-widest text-ink-300 ${className}`}
      title="Sample content created for this prototype"
    >
      Demo
    </span>
  );
}

export function GameTag({ game }: { game: GameId }) {
  const g = gameMeta(game);
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold" style={{ color: g.color }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: g.color, boxShadow: `0 0 8px ${g.color}` }} />
      {g.label}
    </span>
  );
}
