import { Camera, ImageUp, Loader2, RefreshCw, ScanLine, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { uploadMedia } from '../../lib/api';
import { productArt, productTypeMeta } from '../../lib/catalog';
import { useCatalog } from '../../lib/catalogContext';
import { money } from '../../lib/format';
import type { Product } from '../../lib/types';
import { Modal } from '../Modal';

type Phase = 'camera' | 'analyzing' | 'result';

export function ScanModal({
  open,
  onClose,
  onConfirm,
  hintGame,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (product: Product, scanUrl: string | null) => void;
  hintGame: string | null;
}) {
  const { products, setById } = useCatalog();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>('camera');
  const [cameraError, setCameraError] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanUrl, setScanUrl] = useState<string | null>(null);
  const [uploadFailed, setUploadFailed] = useState(false);
  const [matches, setMatches] = useState<{ product: Product; confidence: number }[]>([]);

  function retake() {
    setPhase('camera');
    setPreview(null);
    setScanUrl(null);
    setUploadFailed(false);
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startCamera = async () => {
    setCameraError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
    } catch {
      setCameraError(true);
    }
  };

  useEffect(() => {
    if (open) retake();
  }, [open]);

  useEffect(() => {
    if (!open || phase !== 'camera') return;
    if (typeof navigator.mediaDevices?.getUserMedia === 'function') startCamera();
    else setCameraError(true);
    return stopCamera;
  }, [open, phase]);

  const analyze = async (blob: Blob) => {
    setPreview(URL.createObjectURL(blob));
    setPhase('analyzing');
    const pool = hintGame ? products.filter((p) => setById(p.set_id)?.game === hintGame) : products;
    const shuffled = [...(pool.length ? pool : products)].sort(() => Math.random() - 0.5).slice(0, 3);
    const [upload] = await Promise.allSettled([uploadMedia(blob, 'scans'), new Promise((r) => setTimeout(r, 1600))]);
    if (upload.status === 'fulfilled') setScanUrl(upload.value);
    else setUploadFailed(true);
    setMatches(shuffled.map((product, i) => ({ product, confidence: [92, 61, 37][i] - Math.floor(Math.random() * 6) })));
    setPhase('result');
  };

  const capture = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 1280 / v.videoWidth);
    canvas.width = v.videoWidth * scale;
    canvas.height = v.videoHeight * scale;
    canvas.getContext('2d')?.drawImage(v, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((b) => b && analyze(b), 'image/jpeg', 0.85);
  };

  const onFile = (f: File | undefined) => {
    if (f) analyze(f);
  };


  return (
    <Modal open={open} onClose={onClose} title="Scan your product">
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />

      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-ink-700 bg-ink-950 sm:aspect-[4/3]">
        {phase === 'camera' && !cameraError && <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />}
        {phase === 'camera' && cameraError && (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <Camera size={32} className="text-ink-400" />
            <p className="text-sm text-ink-300">Camera not available. Allow camera access, or take or choose a photo instead.</p>
            <button className="btn-ghost" onClick={startCamera}>
              <RefreshCw size={15} /> Try camera again
            </button>
          </div>
        )}
        {phase !== 'camera' && preview && <img src={preview} alt="Your scan" className="h-full w-full object-cover" />}

        {phase === 'camera' && !cameraError && (
          <div className="pointer-events-none absolute inset-[12%] rounded-2xl border-2 border-brand-300/70">
            <div className="absolute inset-x-0 top-0 h-0.5 animate-scan bg-brand-300 shadow-[0_0_16px_2px_rgba(20,224,194,0.7)]" />
          </div>
        )}
        {phase === 'analyzing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink-950/70 backdrop-blur-sm">
            <Loader2 size={30} className="animate-spin text-brand-300" />
            <p className="font-display text-sm font-bold uppercase tracking-widest text-brand-200">Identifying product</p>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-md border border-dashed border-ink-400 bg-ink-950/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-ink-200">
          Demo recognition
        </span>
      </div>

      {phase === 'camera' && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
            <ImageUp size={16} /> Use a photo
          </button>
          <button className="btn-primary" onClick={capture} disabled={cameraError}>
            <ScanLine size={16} /> Capture
          </button>
        </div>
      )}

      {phase === 'result' && (
        <div className="mt-4 animate-fade-up">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-ink-100">
            <Sparkles size={15} className="text-brand-300" /> Is this your product?
          </p>
          <p className="mb-3 text-xs text-ink-400">
            Matching is simulated in this prototype. Confirm the right product or pick it from the list.
            {uploadFailed && ' Your scan photo could not be saved, but you can still continue.'}
          </p>
          <div className="space-y-2">
            {matches.map(({ product, confidence }, i) => (
              <button
                key={product.id}
                onClick={() => onConfirm(product, scanUrl)}
                className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition hover:border-brand-400/70 ${i === 0 ? 'border-brand-400/50 bg-brand-400/10' : 'border-ink-700 bg-ink-850'}`}
              >
                <img src={productArt(setById(product.set_id)?.game ?? 'pokemon', product.product_type)} alt="" className="h-12 w-10 object-contain" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-50">{product.name}</p>
                  <p className="text-xs text-ink-400">
                    {productTypeMeta(product.product_type).label} / {money(product.price)}
                  </p>
                </div>
                <span className={`text-xs font-bold ${i === 0 ? 'text-brand-300' : 'text-ink-400'}`}>{confidence}%</span>
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button className="btn-ghost" onClick={retake}>
              <RefreshCw size={15} /> Retake
            </button>
            <button className="btn-ghost" onClick={onClose}>
              Pick manually
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
