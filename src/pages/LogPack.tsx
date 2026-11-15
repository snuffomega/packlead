import { ArrowLeft, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { JoinForm } from '../components/JoinModal';
import { EvidenceStep } from '../components/rip/EvidenceStep';
import type { ManualCard } from '../components/rip/ManualCardModal';
import { ProductStep } from '../components/rip/ProductStep';
import { PullsStep } from '../components/rip/PullsStep';
import { RevealStep } from '../components/rip/RevealStep';
import { Skeleton } from '../components/States';
import { fetchCards, logOpening } from '../lib/api';
import { productArt, productTypeMeta } from '../lib/catalog';
import { useCatalog } from '../lib/catalogContext';
import { money } from '../lib/format';
import { rememberProduct, useSession } from '../lib/session';
import type { Product } from '../lib/types';
import { useAsync } from '../lib/useAsync';

const STEPS = ['Product', 'Pulls', 'Proof'];

export default function LogPack() {
  const { player, loading, setPlayer } = useSession();

  if (loading) return <Skeleton className="h-96" />;
  if (!player) {
    return (
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-3xl font-bold text-ink-50">Log a Pack</h1>
        <p className="mb-6 mt-1 text-sm text-ink-400">First, create your player profile.</p>
        <div className="surface p-5">
          <JoinForm onDone={setPlayer} />
        </div>
      </div>
    );
  }
  return <LogFlow playerId={player.id} />;
}

function LogFlow({ playerId }: { playerId: string }) {
  const { setById } = useCatalog();
  const [step, setStep] = useState(0);
  const [product, setProduct] = useState<Product | null>(null);
  const [scanUrl, setScanUrl] = useState<string | null>(null);
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [manual, setManual] = useState<ManualCard[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [video, setVideo] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);

  const cards = useAsync(() => (product ? fetchCards(product.set_id) : Promise.resolve(null)), [product?.set_id]);
  const game = product ? (setById(product.set_id)?.game ?? 'pokemon') : 'pokemon';

  const pulledValue = useMemo(() => {
    const byId = new Map((cards.data ?? []).map((c) => [c.id, c]));
    const listed = Object.entries(picks).reduce((sum, [id, q]) => sum + (byId.get(id)?.value ?? 0) * q, 0);
    return listed + manual.reduce((s, m) => s + m.value, 0);
  }, [picks, manual, cards.data]);
  const pullCount = Object.values(picks).reduce((a, b) => a + b, 0) + manual.length;

  const reset = useCallback(() => {
    setStep(0);
    setProduct(null);
    setScanUrl(null);
    setPicks({});
    setManual([]);
    setPhotos([]);
    setVideo(null);
    setError(null);
    setResultId(null);
    window.scrollTo({ top: 0 });
  }, []);

  const go = (n: number) => {
    setStep(n);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async () => {
    if (!product) return;
    setSaving(true);
    setError(null);
    try {
      const id = await logOpening({
        playerId,
        productId: product.id,
        cards: [
          ...Object.entries(picks).map(([card_id, quantity]) => ({ card_id, quantity })),
          ...manual.map((m) => ({ name: m.name, rarity: m.rarity, value: m.value, quantity: 1 })),
        ],
        photoUrls: photos,
        videoUrl: video,
        scanUrl,
      });
      rememberProduct(product.id);
      setResultId(id);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (resultId) {
    return (
      <div className="mx-auto max-w-3xl">
        <RevealStep openingId={resultId} playerId={playerId} onAnother={reset} />
      </div>
    );
  }

  const canNext = step === 0 ? !!product : step === 1 ? pullCount > 0 && Object.keys(picks).length + manual.length <= 60 : !uploading;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-ink-50">Log a Pack</h1>
        <div className="mt-4 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s}
              onClick={() => i < step && go(i)}
              disabled={i > step}
              className="flex flex-1 flex-col gap-1.5 text-left disabled:cursor-default"
            >
              <span className={`h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'bg-brand-400' : 'bg-ink-700'}`} />
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${i === step ? 'text-ink-50' : 'text-ink-400'}`}>
                {i + 1}. {s}
              </span>
            </button>
          ))}
        </div>
      </div>

      {product && step > 0 && (
        <div className="surface mb-5 flex items-center gap-3 p-3">
          <img src={productArt(game, product.product_type)} alt="" className="h-12 w-10 object-contain" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink-50">{product.name}</p>
            <p className="text-xs text-ink-400">
              {productTypeMeta(product.product_type).label} / {money(product.price)}
            </p>
          </div>
          <button onClick={() => go(0)} className="text-xs font-semibold text-brand-300 hover:text-brand-200">
            Change
          </button>
        </div>
      )}

      <div key={step} className="animate-fade-up">
        {step === 0 && (
          <ProductStep
            selected={product}
            onSelect={(p, url) => {
              if (p.set_id !== product?.set_id) setPicks({});
              setProduct(p);
              if (url) setScanUrl(url);
              go(1);
            }}
          />
        )}
        {step === 1 && product && (
          <PullsStep
            game={game}
            cards={cards.data}
            loading={cards.loading}
            error={cards.error}
            onRetry={cards.reload}
            picks={picks}
            setPicks={setPicks}
            manual={manual}
            setManual={setManual}
          />
        )}
        {step === 2 && <EvidenceStep photos={photos} setPhotos={setPhotos} video={video} setVideo={setVideo} onBusy={setUploading} />}
      </div>

      {step > 0 && (
        <div className="sticky bottom-[calc(80px+env(safe-area-inset-bottom))] z-30 mt-6 md:bottom-4">
          {error && <p className="mb-2 rounded-xl border border-coral-500/40 bg-ink-900 px-4 py-2 text-sm text-coral-200">{error}</p>}
          <div className="flex items-center gap-3 rounded-2xl border border-ink-700 bg-ink-900/95 p-3 shadow-2xl backdrop-blur-xl">
            <button onClick={() => go(step - 1)} className="btn-ghost px-3" aria-label="Back">
              <ArrowLeft size={16} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-ink-400">
                {pullCount} card{pullCount === 1 ? '' : 's'}
              </p>
              <p className="score-num truncate text-lg text-gold-300">{money(pulledValue)}</p>
            </div>
            {step === 1 ? (
              <button onClick={() => go(2)} disabled={!canNext} className="btn-primary">
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button onClick={submit} disabled={!canNext || saving} className="btn-primary">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {uploading ? 'Uploading...' : 'Reveal score'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
