import { Info } from 'lucide-react';
import { useState } from 'react';

export function ScoreExplainer({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="surface p-4">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-3 text-left" aria-expanded={open}>
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink-100">
          <Info size={16} className="text-brand-300" /> How the provisional Rip Score works
        </span>
        <span className="rounded-md border border-amber-400/40 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">Demo formula</span>
      </button>
      {open && (
        <div className="mt-3 animate-fade-up space-y-2 text-sm text-ink-300">
          <p>
            The Rip Score runs from 0 to 1000. It is a provisional formula made for this prototype. It is not an official, established or independently
            verified scoring system.
          </p>
          <ul className="space-y-1.5">
            <li>
              <span className="font-semibold text-ink-100">Up to 700 points</span> for value returned: the estimated total value of your pulls compared to
              the product's price.
            </li>
            <li>
              <span className="font-semibold text-ink-100">Up to 300 points</span> for your best single card compared to the product's price.
            </li>
            <li>
              Points grow on a curve, so the first gains matter most. Booster packs, boxes, ETBs and other sealed products use their own scales and are
              ranked separately.
            </li>
          </ul>
          <p className="text-xs text-ink-400">Card values and product prices are demo estimates, not live market data.</p>
        </div>
      )}
    </div>
  );
}
