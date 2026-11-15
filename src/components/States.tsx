import { CircleAlert, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-ink-800/80 ${className}`} />;
}

export function RowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-[76px]" />
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="surface flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-600 bg-ink-800 text-brand-300">{icon}</div>
      <h3 className="font-display text-lg font-bold text-ink-50">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-300">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="surface flex flex-col items-center gap-3 border-coral-500/40 px-6 py-10 text-center">
      <CircleAlert className="text-coral-400" size={28} />
      <p className="text-sm text-ink-200">{message}</p>
      {onRetry && (
        <button className="btn-ghost" onClick={onRetry}>
          <RefreshCw size={15} /> Try again
        </button>
      )}
    </div>
  );
}
