import { ArrowLeft, Camera, Check, Globe2, Layers, Share2, Trophy, Video, CalendarDays, ScanLine } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PlayerLink } from '../components/Avatar';
import { DemoTag, EvidenceBadge, GameTag, PendingBadge } from '../components/Badges';
import { CardArt } from '../components/CardArt';
import { CardViewer, type ViewerCard } from '../components/CardViewer';
import { ScoreExplainer } from '../components/ScoreExplainer';
import { EmptyState, ErrorState, Skeleton } from '../components/States';
import { fetchOpening, fetchRanks } from '../lib/api';
import { gameMeta, largeImage, productArt, productTypeMeta } from '../lib/catalog';
import { useCatalog } from '../lib/catalogContext';
import { longDate, money, multiple, ordinal } from '../lib/format';
import { useAsync } from '../lib/useAsync';

export default function PackPage() {
  const { id = '' } = useParams();
  const { setById } = useCatalog();
  const pack = useAsync(() => fetchOpening(id), [id]);
  const opening = pack.data?.opening;
  const ranks = useAsync(() => (opening ? fetchRanks(opening) : Promise.resolve(null)), [opening?.id]);
  const [viewing, setViewing] = useState<ViewerCard | null>(null);
  const [copied, setCopied] = useState(false);

  if (pack.error) return <ErrorState message={pack.error} onRetry={pack.reload} />;
  if (pack.loading && !pack.data) return <PackSkeleton />;
  if (!pack.data || !opening) {
    return (
      <EmptyState
        icon={<Layers size={24} />}
        title="Pack not found"
        body="This opening may have been removed or the link is incorrect."
        action={<Link to="/" className="btn-primary">Back to rankings</Link>}
      />
    );
  }

  const { cards } = pack.data;
  const g = gameMeta(opening.game);
  const set = setById(opening.set_id);
  const type = productTypeMeta(opening.product_type);
  const best = cards[0];
  const hits = cards.filter((c) => c.tier >= 4).length;

  const share = async () => {
    const url = window.location.href;
    const text = `${opening.player?.username ?? 'Someone'} scored ${opening.score} on PackLead with ${opening.best_card_name}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'PackLead', text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // user cancelled the share sheet
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-300 transition hover:text-ink-50">
          <ArrowLeft size={16} /> Rankings
        </Link>
        <button onClick={share} className="btn-ghost py-2">
          {copied ? <Check size={16} className="text-brand-300" /> : <Share2 size={16} />}
          {copied ? 'Link copied' : 'Share'}
        </button>
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-ink-700 bg-ink-900 px-5 pb-6 pt-8 sm:px-8 sm:pt-10">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(60% 70% at 50% 15%, ${g.glow}, transparent 70%)` }}
        />
        <div className="grid-noise pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative grid items-center gap-8 md:grid-cols-[minmax(0,320px)_1fr] md:gap-12">
          <button
            onClick={() => best && setViewing(best)}
            className="relative mx-auto w-[62%] max-w-[300px] animate-flip-in md:w-full"
            aria-label={`View ${opening.best_card_name}`}
          >
            <div className="absolute inset-0 scale-110 rounded-full blur-3xl" style={{ background: g.glow }} />
            <CardArt
              name={opening.best_card_name}
              rarity={opening.best_card_rarity}
              tier={opening.best_card_tier}
              image={largeImage(opening.best_card_image)}
              game={opening.game}
              interactive
              className="relative"
            />
          </button>

          <div className="min-w-0 animate-fade-up text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
              <EvidenceBadge opening={opening} />
              {opening.video_review === 'pending' && <PendingBadge />}
              {opening.is_demo && <DemoTag />}
            </div>
            <p className="mt-4 label">Best pull</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-ink-50 sm:text-4xl">{opening.best_card_name}</h1>
            <p className="mt-1 text-sm text-ink-300">
              {opening.best_card_rarity} / <span className="font-semibold text-gold-300">{money(opening.best_value)}</span>
            </p>

            <div className="mt-6 flex items-end justify-center gap-3 md:justify-start">
              <span className="score-num bg-gradient-to-b from-ink-50 to-ink-300 bg-clip-text text-7xl leading-none text-transparent sm:text-8xl">
                {opening.score}
              </span>
              <span className="mb-2 text-left text-xs font-semibold uppercase leading-tight tracking-wider text-ink-400">
                Rip Score
                <br />/ 1000
              </span>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm md:justify-start">
              <PlayerLink player={opening.player} size="sm" />
              <GameTag game={opening.game} />
              <span className="inline-flex items-center gap-1.5 text-ink-400">
                <CalendarDays size={14} /> {longDate(opening.opened_at)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <RankStat label="Global" icon={<Globe2 size={15} />} rank={ranks.data?.global} loading={ranks.loading} sub={type.plural} />
        <RankStat label={g.short} icon={<Trophy size={15} />} rank={ranks.data?.game} loading={ranks.loading} sub={`${g.label} ${type.plural.toLowerCase()}`} />
        <RankStat label="This week" icon={<CalendarDays size={15} />} rank={ranks.data?.week} loading={ranks.loading} sub={type.plural} />
        <div className="surface p-4">
          <p className="label">Return</p>
          <p className="score-num mt-1 text-2xl text-brand-300">{multiple(opening.total_value, opening.product_cost)}</p>
          <p className="mt-0.5 text-xs text-ink-400">value vs. cost</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <div className="surface flex gap-4 p-4">
            <img src={productArt(opening.game, opening.product_type)} alt="" className="h-24 w-20 shrink-0 object-contain drop-shadow-xl" />
            <div className="min-w-0">
              <p className="label">{type.label}</p>
              <p className="mt-1 font-display text-lg font-bold leading-tight text-ink-50">{opening.product_name}</p>
              <p className="mt-0.5 truncate text-xs text-ink-400">{set?.name}</p>
            </div>
          </div>
          <div className="surface divide-y divide-ink-700/70">
            <Row label="Pack cost" value={money(opening.product_cost)} />
            <Row label="Total pulled value" value={money(opening.total_value)} highlight />
            <Row label="Cards logged" value={String(opening.card_count)} />
            <Row label="Hits (Hit tier and up)" value={String(hits)} />
            <p className="px-4 py-2.5 text-[11px] text-ink-400">All values are demo estimates, not live market prices.</p>
          </div>
          <EvidencePanel scanUrl={opening.scan_url} photoUrls={opening.photo_urls} videoUrl={opening.video_url} review={opening.video_review} />
          <ScoreExplainer />
        </div>

        <div>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-display text-xl font-bold text-ink-50">The pulls</h2>
            <span className="text-xs text-ink-400">Tap a card to inspect</span>
          </div>
          {cards.length === 0 ? (
            <EmptyState icon={<Layers size={22} />} title="No cards listed" body="This opening was logged without individual cards." />
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-5">
              {cards.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => setViewing(c)}
                  className="group animate-fade-up text-left"
                  style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                >
                  <div className="relative transition duration-300 group-hover:-translate-y-1">
                    <CardArt name={c.name} rarity={c.rarity} tier={c.tier} image={c.image_url} game={opening.game} />
                    {c.quantity > 1 && (
                      <span className="absolute right-1.5 top-1.5 z-10 rounded-md bg-ink-950/85 px-1.5 py-0.5 text-[10px] font-bold text-ink-50">
                        x{c.quantity}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 truncate text-xs font-semibold text-ink-100">{c.name}</p>
                  <p className="text-[11px] font-semibold text-gold-300">{money(c.value)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <CardViewer card={viewing} game={opening.game} onClose={() => setViewing(null)} />
    </div>
  );
}

function RankStat({
  label,
  icon,
  rank,
  loading,
  sub,
}: {
  label: string;
  icon: ReactNode;
  rank?: { rank: number; total: number };
  loading: boolean;
  sub: string;
}) {
  const top = rank && rank.rank <= 3;
  return (
    <div className={`surface p-4 ${top ? 'border-gold-400/40' : ''}`}>
      <p className="label flex items-center gap-1.5">
        <span className={top ? 'text-gold-300' : 'text-ink-400'}>{icon}</span> {label}
      </p>
      {loading || !rank ? (
        <Skeleton className="mt-2 h-7 w-16" />
      ) : (
        <p className={`score-num mt-1 text-2xl ${top ? 'text-gold-300' : 'text-ink-50'}`}>
          {ordinal(rank.rank)}
          <span className="ml-1 text-xs font-medium text-ink-400">of {rank.total}</span>
        </p>
      )}
      <p className="mt-0.5 truncate text-xs text-ink-400">{sub}</p>
    </div>
  );
}

function Row({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      <span className="text-ink-300">{label}</span>
      <span className={`font-semibold tabular-nums ${highlight ? 'text-gold-300' : 'text-ink-50'}`}>{value}</span>
    </div>
  );
}

function EvidencePanel({
  scanUrl,
  photoUrls,
  videoUrl,
  review,
}: {
  scanUrl: string | null;
  photoUrls: string[];
  videoUrl: string | null;
  review: string;
}) {
  const photos = photoUrls ?? [];
  if (!scanUrl && photos.length === 0 && !videoUrl) {
    return (
      <div className="surface p-4 text-sm text-ink-300">
        <p className="label mb-1">Evidence</p>
        Logged by the player without photos or video.
      </div>
    );
  }
  return (
    <div className="surface space-y-3 p-4">
      <p className="label">Evidence</p>
      {videoUrl && (
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink-200">
            <Video size={14} className="text-gold-300" /> Rip video
            <span className="text-ink-400">
              / {review === 'approved' ? 'Verified by review' : review === 'rejected' ? 'Not verified' : 'Waiting for review'}
            </span>
          </p>
          <video src={videoUrl} controls playsInline preload="metadata" className="aspect-video w-full rounded-xl bg-ink-950" />
        </div>
      )}
      {photos.length > 0 && (
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink-200">
            <Camera size={14} className="text-sky-300" /> Pull photos
          </p>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg">
                <img src={url} alt="Pull evidence" loading="lazy" className="aspect-square w-full object-cover transition duration-300 hover:scale-105" />
              </a>
            ))}
          </div>
        </div>
      )}
      {scanUrl && (
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink-200">
            <ScanLine size={14} className="text-brand-300" /> Product scan
          </p>
          <img src={scanUrl} alt="Product scan" loading="lazy" className="h-28 w-full rounded-lg object-cover" />
        </div>
      )}
    </div>
  );
}

function PackSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[420px] rounded-3xl" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    </div>
  );
}
