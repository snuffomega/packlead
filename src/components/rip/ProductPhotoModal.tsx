import { Camera, Check, ImageUp, Loader2, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { uploadMedia } from '../../lib/api';
import { compressImage } from '../../lib/media';
import { Modal } from '../Modal';

type Phase = 'camera' | 'uploading' | 'done' | 'failed';

export function ProductPhotoModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: (url: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastBlob = useRef<Blob | null>(null);
  const [phase, setPhase] = useState<Phase>('camera');
  const [cameraError, setCameraError] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startCamera = async () => {
    setCameraError(false);
    if (typeof navigator.mediaDevices?.getUserMedia !== 'function') return setCameraError(true);
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
    if (!open) return;
    setPhase('camera');
    setPreview(null);
    setMessage(null);
  }, [open]);

  useEffect(() => {
    if (!open || phase !== 'camera') return;
    startCamera();
    return stopCamera;
  }, [open, phase]);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const upload = async (blob: Blob) => {
    lastBlob.current = blob;
    stopCamera();
    setPreview(URL.createObjectURL(blob));
    setMessage(null);
    if (!navigator.onLine) {
      setMessage('You are offline. Reconnect, then try again.');
      return setPhase('failed');
    }
    setPhase('uploading');
    try {
      const url = await uploadMedia(await compressImage(blob), 'scans');
      setPhase('done');
      onSaved(url);
    } catch (e) {
      setMessage((e as Error).message);
      setPhase('failed');
    }
  };

  const capture = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext('2d')?.drawImage(v, 0, 0);
    canvas.toBlob((b) => b && upload(b), 'image/jpeg', 0.9);
  };

  return (
    <Modal open={open} onClose={onClose} title="Photograph your sealed product">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) upload(f);
        }}
      />
      <p className="mb-3 text-sm text-ink-300">
        A clear photo of the unopened product is added to your pack page as evidence. PackLead does not identify products automatically, so you still pick
        the exact product from the list.
      </p>

      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-ink-700 bg-ink-950 sm:aspect-[4/3]">
        {phase === 'camera' && !cameraError && <video ref={videoRef} playsInline muted className="h-full w-full object-cover" aria-label="Camera preview" />}
        {phase === 'camera' && cameraError && (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <Camera size={32} className="text-ink-400" />
            <p className="text-sm text-ink-300">Camera not available. Allow camera access, or take or choose a photo instead.</p>
            <button className="btn-ghost min-h-[44px]" onClick={startCamera}>
              <RefreshCw size={15} /> Try camera again
            </button>
          </div>
        )}
        {phase !== 'camera' && preview && <img src={preview} alt="Your product photo" className="h-full w-full object-cover" />}
        {phase === 'camera' && !cameraError && <div className="pointer-events-none absolute inset-[10%] rounded-2xl border-2 border-dashed border-brand-300/60" />}
        {phase === 'uploading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink-950/70 backdrop-blur-sm" role="status">
            <Loader2 size={30} className="animate-spin text-brand-300" />
            <p className="text-sm font-semibold text-brand-100">Saving photo...</p>
          </div>
        )}
        {phase === 'done' && (
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-ink-950/80 py-3 text-sm font-semibold text-brand-200" role="status">
            <Check size={16} /> Photo attached
          </div>
        )}
      </div>

      {message && (
        <p role="alert" className="mt-3 rounded-lg border border-coral-500/40 bg-coral-500/10 px-3 py-2 text-sm text-coral-200">
          {message}
        </p>
      )}

      {phase === 'camera' && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button className="btn-ghost min-h-[52px]" onClick={() => fileRef.current?.click()}>
            <ImageUp size={16} /> Choose photo
          </button>
          <button className="btn-primary min-h-[52px]" onClick={capture} disabled={cameraError}>
            <Camera size={16} /> Take photo
          </button>
        </div>
      )}
      {phase === 'failed' && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button className="btn-ghost min-h-[52px]" onClick={() => setPhase('camera')}>
            <RefreshCw size={15} /> Retake
          </button>
          <button className="btn-primary min-h-[52px]" onClick={() => lastBlob.current && upload(lastBlob.current)}>
            Try again
          </button>
        </div>
      )}
      {phase === 'done' && (
        <button className="btn-primary mt-4 min-h-[52px] w-full" onClick={onClose}>
          Continue
        </button>
      )}
    </Modal>
  );
}
