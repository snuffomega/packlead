import { ArrowLeft, ArrowRight, History, Loader2, Sparkles, WifiOff } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AccountGate } from '../components/JoinModal';
import { EvidenceStep } from '../components/rip/EvidenceStep';
import type { ManualCard } from '../components/rip/ManualCardModal';
import { ProductStep } from '../components/rip/ProductStep';
import { PullsStep } from '../components/rip/PullsStep';
import { RevealStep } from '../components/rip/RevealStep';
import { Skeleton } from '../components/States';
import { fetchCards, logOpening } from '../lib/api';
import { productArt, productTypeMeta } from '../lib/catalog';
import { useCatalog } from '../lib/catalogContext';
import { clearDraft, draftHasContent, loadDraft, saveDraft, type RipDraft } from '../lib/draft';
import { money, timeAgo } from '../lib/format';
import { rememberProduct, useSession } from '../lib/session';
import type { Product } from '../lib/types';
import { useAsync } from '../lib/useAsync';
import { useOnline } from '../lib/useOnline';

const STEPS = ['Product', 'Pulls', 'Proof'];

export default function LogPack() {
  const { user, player, loading } = useSession();

  if (loading) return <Skeleton className="h-96" />;
  if (!player || !user) {
    return (
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-3xl font-bold text-ink-50">Log a Pack</h1>
        <p className="mb-6 mt-1 text-sm text-ink-400">Sign in first so your openings are saved to your account and count on the leaderboard.</p>
        <div className="surface p-5">
          <AccountGate />
        </div>
      </div>
    );
  }
  return <LogFlow userId={user.id} playerId={player.id} />;
}

function LogFlow({ userId, playerId }: { userId: string; playerId: string }) {
  const { setById, productById, loading: catalogLoading } = useCatalog();
  const [params] = useSearchParams();
  const online = useOnline();
  const [step, setStep] = useState(0);
  const [product, setProduct] = useState<Product | null>(null);
  const [pendingDraft, setPendingDraft] = useState<RipDraft | null>(() => {
    const d = loadDraft(userId);
    return d && draftHasContent(d) ? d : null;
  });
  const [scanUrl, setScanUrl] = useState<string | null>(null);
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [manual, setManual] = useState<ManualCard[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [video, setVideo] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);

  useEffect(() => {
    if (catalogLoading || product) return;
    const fromUrl = productById(params.get('product') ?? '');
    if (fromUrl) setProduct(fromUrl);
  }, [catalogLoading]);

  useEffect(() => {
    if (pendingDraft || resultId || !product) return;
    const draft = { productId: product.id, step, picks, manual, photos, video, scanUrl, savedAt: Date.now() };
    if (draftHasContent(draft)) saveDraft(userId, draft);
  }, [pendingDraft, resultId, product, step, picks, manual, photos, video, scanUrl, userId]);

  const draftProduct = pendingDraft ? productById(pendingDraft.productId) : undefined;

  const resume = () => {
    if (!pendingDraft || !draftProduct) return;
    setProduct(draftProduct);
    setPicks(pendingDraft.picks);
    setManual(pendingDraft.manual);
    setPhotos(pendingDraft.photos);
    setVideo(pendingDraft.video);
    setScanUrl(pendingDraft.scanUrl);
    setStep(Math.max(1, pendingDraft.step));
    setPendingDraft(null);
  };

  const discard = () => {
    clearDraft(userId);
    setPendingDraft(null);
  };

  const cards = useAsync(() => (product ? fetchCards(product.set_id) : Promise.resolve(null)), [product?.set_id]);
  const game = product ? (setById(product.set_id)?.game ?? 'pokemon') : 'pokemon';

  const pulledValue = useMemo(() => {
    const byId = new Map((cards.data ?? []).map((c) => [c.id, c]));
    const listed = Object.entries(picks).reduce((sum, [id, q]) => sum + (byId.get(id)?.value ?? 0) * q, 0);
    return listed;
  }, [picks, cards.data]);
  const estimateValue = manual.reduce((s, m) => s + m.value, 0);
  const pullCount = Object.values(picks).reduce((a, b) => a + b, 0) + manual.length;

  const reset = useCallback(() => {
    clearDraft(userId);
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
  }, [userId]);

  const go = (n: number) => {
    setStep(n);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async () => {
    if (!product) return;
    if (!navigator.onLine) return setError('You are offline. Your draft is saved on this device. Reconnect to submit.');
    setSaving(true);
    setError(null);
    try {
      const id = await logOpening({
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
      clearDraft(userId);
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
      {pendingDraft && draftProduct && (
        <div className="surface mb-5 animate-fade-up border-brand-400/40 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink-50">
            <History size={16} className="text-brand-300" /> Pick up where you left off?
          </p>
          <p className="mt-1 text-xs text-ink-400">
            {draftProduct.name} / {Object.values(pendingDraft.picks).reduce((a, b) => a + b, 0) + pendingDraft.manual.length} cards / saved{' '}
            {timeAgo(new Date(pendingDraft.savedAt).toISOString())}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={discard} className="btn-ghost min-h-[48px]">
              Start fresh
            </button>
            <button onClick={resume} className="btn-primary min-h-[48px]">
              Resume
            </button>
          </div>
        </div>
      )}

      {!online && (
        <p role="status" className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-100">
          <WifiOff size={15} /> You are offline. Your progress is saved on this device and you can submit once you reconnect.
        </p>
      )}

      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-ink-50">Log a Pack</h1>
        <div className="mt-4 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s}
              onClick={() => i < step && go(i)}
              disabled={i > step}
              className="flex min-h-[44px] flex-1 flex-col justify-center gap-1.5 text-left disabled:cursor-default"
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
          <button onClick={() => go(0)} className="min-h-[44px] px-2 text-xs font-semibold text-brand-300 hover:text-brand-200">
            Change
          </button>
        </div>
      )}

      <div key={step} className="animate-fade-up">
        {step === 0 && (
          <ProductStep
            selected={product}
            scanUrl={scanUrl}
            setScanUrl={setScanUrl}
            initialSetId={params.get('set')}
            onSelect={(p) => {
              if (p.set_id !== product?.set_id) setPicks({});
              setPendingDraft(null);
              setProduct(p);
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
        <div className="sticky bottom-[calc(76px+env(safe-area-inset-bottom))] z-30 mt-6 md:bottom-4">
          {error && (
            <p role="alert" className="mb-2 rounded-xl border border-coral-500/40 bg-ink-900 px-4 py-2 text-sm text-coral-200">
              {error}
            </p>
          )}
          <div className="flex items-center gap-3 rounded-2xl border border-ink-700 bg-ink-900/95 p-3 shadow-2xl backdrop-blur-xl">
            <button onClick={() => go(step - 1)} className="btn-ghost min-h-[52px] min-w-[52px] px-3" aria-label="Back">
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-ink-400">
                {pullCount} card{pullCount === 1 ? '' : 's'}
                {estimateValue > 0 && <span className="text-ink-500"> / +{money(estimateValue)} est.</span>}
              </p>
              <p className="score-num truncate text-lg text-gold-300">{money(pulledValue)}</p>
            </div>
            {step === 1 ? (
              <button onClick={() => go(2)} disabled={!canNext} className="btn-primary min-h-[52px] px-5">
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button onClick={submit} disabled={!canNext || saving || !online} className="btn-primary min-h-[52px] px-5">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {!online ? 'Offline' : uploading ? 'Uploading...' : 'Reveal score'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
