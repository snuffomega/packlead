import { Camera, ImagePlus, Loader2, ShieldCheck, Video, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { uploadMedia } from '../../lib/api';

const MAX_PHOTOS = 8;
const MAX_BYTES = 50 * 1024 * 1024;

export function EvidenceStep({
  photos,
  setPhotos,
  video,
  setVideo,
  onBusy,
}: {
  photos: string[];
  setPhotos: (fn: (prev: string[]) => string[]) => void;
  video: string | null;
  setVideo: (v: string | null) => void;
  onBusy: (busy: boolean) => void;
}) {
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [photoBusy, setPhotoBusy] = useState(0);
  const [videoBusy, setVideoBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const track = (delta: number) => setPhotoBusy((n) => n + delta);

  useEffect(() => {
    onBusy(photoBusy > 0 || videoBusy);
  }, [photoBusy, videoBusy, onBusy]);

  const addPhotos = async (files: FileList | null) => {
    if (!files) return;
    setError(null);
    const list = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, MAX_PHOTOS - photos.length);
    if (list.some((f) => f.size > MAX_BYTES)) return setError('Each photo must be under 50MB.');
    track(list.length);
    await Promise.all(
      list.map(async (f) => {
        try {
          const url = await uploadMedia(f, 'photos');
          setPhotos((prev) => (prev.length < MAX_PHOTOS ? [...prev, url] : prev));
        } catch {
          setError('A photo could not be uploaded. Please try again.');
        } finally {
          track(-1);
        }
      }),
    );
  };

  const addVideo = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith('video/')) return setError('Please choose a video file.');
    if (file.size > MAX_BYTES) return setError('Videos must be under 50MB. Try a shorter clip.');
    setVideoBusy(true);
    try {
      setVideo(await uploadMedia(file, 'videos'));
    } catch {
      setError('The video could not be uploaded. Use MP4, WebM or MOV under 50MB.');
    } finally {
      setVideoBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <input ref={photoRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addPhotos(e.target.files); e.target.value = ''; }} />
      <input ref={videoRef} type="file" accept="video/mp4,video/webm,video/quicktime,video/*" capture="environment" className="hidden" onChange={(e) => { addVideo(e.target.files?.[0]); e.target.value = ''; }} />

      <div className="surface p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-400/40 bg-sky-400/10 text-sky-300">
            <Camera size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink-50">Add pull photos</p>
            <p className="text-xs text-ink-400">Earns the Photo Evidence badge. Up to {MAX_PHOTOS} photos.</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {photos.map((url) => (
            <div key={url} className="group relative aspect-square animate-pop-in overflow-hidden rounded-xl">
              <img src={url} alt="Pull" className="h-full w-full object-cover" />
              <button
                onClick={() => setPhotos((prev) => prev.filter((p) => p !== url))}
                className="absolute right-1 top-1 rounded-full bg-ink-950/80 p-1 text-ink-100 hover:text-coral-300"
                aria-label="Remove photo"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {Array.from({ length: photoBusy }).map((_, i) => (
            <div key={`busy-${i}`} className="flex aspect-square items-center justify-center rounded-xl bg-ink-800">
              <Loader2 size={18} className="animate-spin text-sky-300" />
            </div>
          ))}
          {photos.length + photoBusy < MAX_PHOTOS && (
            <button
              onClick={() => photoRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-ink-500 text-ink-300 transition hover:border-sky-400 hover:text-sky-200"
            >
              <ImagePlus size={18} />
              <span className="text-[10px] font-semibold">Add</span>
            </button>
          )}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-gold-400/30 bg-gradient-to-br from-gold-400/10 via-ink-900 to-ink-900 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold-400/50 bg-gold-400/15 text-gold-300">
            <ShieldCheck size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink-50">Record Verified Rip</p>
            <p className="text-xs text-ink-300">
              Film the unopened pack, the opening and every card in one take. A reviewer checks it before it gets the Verified badge.
            </p>
          </div>
        </div>
        {video ? (
          <div className="mt-4 space-y-2">
            <video src={video} controls playsInline preload="metadata" className="aspect-video w-full rounded-xl bg-ink-950" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-200">Will be submitted for review</span>
              <button className="text-xs font-semibold text-coral-300 hover:text-coral-200" onClick={() => setVideo(null)}>
                Remove video
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => videoRef.current?.click()} disabled={videoBusy} className="btn-ghost mt-4 w-full border-gold-400/40">
            {videoBusy ? <Loader2 size={16} className="animate-spin" /> : <Video size={16} className="text-gold-300" />}
            {videoBusy ? 'Uploading video...' : 'Record or upload video'}
          </button>
        )}
      </div>

      {error && <p className="text-sm text-coral-300">{error}</p>}
      <p className="text-xs text-ink-400">Photos and videos are optional. Anyone with the pack link can view them.</p>
    </div>
  );
}
