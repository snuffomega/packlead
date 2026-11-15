import type { ManualCard } from '../components/rip/ManualCardModal';

export interface RipDraft {
  productId: string;
  step: number;
  picks: Record<string, number>;
  manual: ManualCard[];
  photos: string[];
  video: string | null;
  scanUrl: string | null;
  savedAt: number;
}

const MAX_AGE = 14 * 24 * 60 * 60 * 1000;
const key = (userId: string) => `packlead.draft.${userId}`;

const isStr = (v: unknown): v is string => typeof v === 'string';

export function parseDraft(raw: string | null, now = Date.now()): RipDraft | null {
  if (!raw) return null;
  let d: unknown;
  try {
    d = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!d || typeof d !== 'object') return null;
  const o = d as Record<string, unknown>;
  if (!isStr(o.productId) || !o.productId) return null;
  if (typeof o.savedAt !== 'number' || now - o.savedAt > MAX_AGE || o.savedAt > now + 60_000) return null;
  const step = typeof o.step === 'number' && o.step >= 0 && o.step <= 2 ? Math.floor(o.step) : 0;
  const picks: Record<string, number> = {};
  if (o.picks && typeof o.picks === 'object') {
    for (const [id, q] of Object.entries(o.picks as Record<string, unknown>)) {
      if (typeof q === 'number' && Number.isInteger(q) && q >= 1 && q <= 20) picks[id] = q;
    }
  }
  const manual = Array.isArray(o.manual)
    ? (o.manual as unknown[]).filter(
        (m): m is ManualCard =>
          !!m &&
          typeof m === 'object' &&
          isStr((m as ManualCard).name) &&
          isStr((m as ManualCard).rarity) &&
          typeof (m as ManualCard).value === 'number' &&
          Number.isFinite((m as ManualCard).value),
      )
    : [];
  const photos = Array.isArray(o.photos) ? (o.photos as unknown[]).filter(isStr).slice(0, 8) : [];
  return {
    productId: o.productId,
    step,
    picks,
    manual,
    photos,
    video: isStr(o.video) ? o.video : null,
    scanUrl: isStr(o.scanUrl) ? o.scanUrl : null,
    savedAt: o.savedAt,
  };
}

export function draftHasContent(d: Pick<RipDraft, 'picks' | 'manual' | 'photos' | 'video' | 'scanUrl'>) {
  return Object.keys(d.picks).length > 0 || d.manual.length > 0 || d.photos.length > 0 || !!d.video || !!d.scanUrl;
}

export function loadDraft(userId: string): RipDraft | null {
  try {
    return parseDraft(localStorage.getItem(key(userId)));
  } catch {
    return null;
  }
}

export function saveDraft(userId: string, draft: RipDraft) {
  try {
    localStorage.setItem(key(userId), JSON.stringify(draft));
  } catch {
    // storage full or unavailable; drafts are best-effort
  }
}

export function clearDraft(userId: string) {
  try {
    localStorage.removeItem(key(userId));
  } catch {
    // ignore
  }
}
