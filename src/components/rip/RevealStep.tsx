import { ArrowRight, Crown, Flame, Hourglass, Plus, Share2, Sparkles, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchOpening, fetchPlayerOpenings, fetchRanks } from '../../lib/api';
import { gameMeta, largeImage, productTypeMeta } from '../../lib/catalog';
import { money, multiple, ordinal } from '../../lib/format';
import { useAsync } from '../../lib/useAsync';
import { EvidenceBadge } from '../Badges';
import { CardArt } from '../CardArt';
import { ScoreExplainer } from '../ScoreExplainer';
import { ErrorState, Skeleton } from '../States';

function useCountUp(target: number, run: boolean, ms = 1400) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, ms]);
  return v;
}

export function RevealStep({ openingId, playerId, onAnother }: { openingId: string; playerId: string; onAnother: () => void }) {
  const data = useAsync(async () => {
    const pack = await fetchOpening(openingId);
    if (!pack) throw new Error('Could not load your result');
    const [ranks, history] = await Promise.all([fetchRanks(pack.opening), fetchPlayerOpenings(playerId)]);
    return { ...pack, ranks, history };
  }, [openingId, playerId]);
  const [revealed, setRevealed] = useState(false);
  const score = useCountUp(data.data?.opening.score ?? 0, revealed);

  useEffect(() => {
    if (!data.data) return;
    const t = setTimeout(() => setRevealed(true), 500);
    return () => clearTimeout(t);
  }, [data.data]);

  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;
  if (!data.data) return <Skeleton className="h-[520px] rounded-3xl" />;

  const { opening, ranks, history } = data.data;
  const g = gameMeta(opening.game);
  const type = productTypeMeta(opening.product_type);
  const others = history.filter((o) => o.id !== opening.id && o.product_type === opening.product_type);
  const personalBest = others.length > 0 && others.every((o) => opening.score > o.score);
  const celebrations = [
    ranks.global.rank <= 10 && { icon: Crown, text: `Top 10 ${type.label} worldwide`, cls: 'text-gold-200 border-gold-400/50 bg-gold-400/10' },
    personalBest && { icon: Trophy, text: 'New personal best', cls: 'text-brand-200 border-brand-400/50 bg-brand-400/10' },
    opening.best_value >= 100 && { icon: Flame, text: 'Monster pull', cls: 'text-coral-200 border-coral-400/50 bg-coral-400/10' },
    opening.total_value >= opening.product_cost * 3 && { icon: Sparkles, text: `${multiple(opening.total_value, opening.product_cost)} return`, cls: 'text-sky-200 border-sky-400/50 bg-sky-400/10' },
  ].filter(Boolean) as { icon: typeof Crown; text: string; cls: string }[];

  const share = async () => {
    const url = `${window.location.origin}/pack/${opening.id}`;
    try {
      if (navigator.share) await navigator.share({ title: 'PackLead', text: `I scored ${opening.score} on PackLead`, url });
      else await navigator.clipboard.writeText(url);
    } catch {
      // user cancelled the share sheet
    }
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-ink-700 bg-ink-900 px-5 pb-8 pt-10 text-center">
        <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(55% 60% at 50% 30%, ${g.glow}, transparent 70%)` }} />
        <div className="grid-noise pointer-events-none absolute inset-0 opacity-60" />
        {revealed && (
          <div className="pointer-events-none absolute left-1/2 top-[30%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 animate-burst rounded-full border-4 border-gold-300/60" />
        )}
        <div className="relative">
          <p className="label text-brand-300">Your Rip Score</p>
          <p className="score-num mt-2 bg-gradient-to-b from-ink-50 to-gold-200 bg-clip-text text-8xl leading-none text-transparent sm:text-9xl">{score}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-ink-400">out of 1000</p>

          <div className={`mx-auto mt-8 w-[46%] max-w-[220px] ${revealed ? 'animate-flip-in' : 'opacity-0'}`} style={{ animationDelay: '900ms' }}>
            <CardArt
              name={opening.best_card_name}
              rarity={opening.best_card_rarity}
              tier={opening.best_card_tier}
              image={largeImage(opening.best_card_image)}
              game={opening.game}
              interactive
            />
          </div>
          <p className="mt-4 font-display text-xl font-bold text-ink-50">{opening.best_card_name}</p>
          <p className="text-sm text-ink-300">
            Best pull / <span className="font-semibold text-gold-300">{money(opening.best_value)}</span>
          </p>

          {celebrations.length > 0 && (
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {celebrations.map((c, i) => (
                <span
                  key={c.text}
                  className={`inline-flex animate-pop-in items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${c.cls}`}
                  style={{ animationDelay: `${1400 + i * 150}ms` }}
                >
                  <c.icon size={14} /> {c.text}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Global rank" value={ordinal(ranks.global.rank)} sub={`of ${ranks.global.total} ${type.plural.toLowerCase()}`} gold={ranks.global.rank <= 10} />
        <Stat label={`${g.short} rank`} value={ordinal(ranks.game.rank)} sub={`of ${ranks.game.total}`} />
        <Stat label="Total value" value={money(opening.total_value)} sub="demo estimate" />
        <Stat label="Pack cost" value={money(opening.product_cost)} sub={multiple(opening.total_value, opening.product_cost) + ' return'} />
      </section>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <EvidenceBadge opening={opening} />
        {opening.video_review === 'pending' && (
          <span className="inline-flex items-center gap-1.5 text-xs text-amber-200">
            <Hourglass size={13} /> Your video is waiting for review. Verified status is added after approval.
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link to={`/pack/${opening.id}`} className="btn-primary py-3">
          View pack page <ArrowRight size={16} />
        </Link>
        <button onClick={share} className="btn-ghost py-3">
          <Share2 size={16} /> Share
        </button>
        <button onClick={onAnother} className="btn-ghost py-3">
          <Plus size={16} /> Log another
        </button>
      </div>
      <Link to="/" className="block text-center text-sm font-semibold text-brand-300 hover:text-brand-200">
        See the leaderboard
      </Link>

      <ScoreExplainer />
    </div>
  );
}

function Stat({ label, value, sub, gold = false }: { label: string; value: string; sub: string; gold?: boolean }) {
  return (
    <div className={`surface animate-fade-up p-4 ${gold ? 'border-gold-400/40' : ''}`}>
      <p className="label">{label}</p>
      <p className={`score-num mt-1 text-2xl ${gold ? 'text-gold-300' : 'text-ink-50'}`}>{value}</p>
      <p className="mt-0.5 truncate text-xs text-ink-400">{sub}</p>
    </div>
  );
}
