import { largeImage } from '../lib/catalog';
import { money } from '../lib/format';
import type { GameId } from '../lib/types';
import { CardArt } from './CardArt';
import { Modal } from './Modal';

export interface ViewerCard {
  name: string;
  rarity: string;
  tier: number;
  value: number;
  image_url: string | null;
  quantity?: number;
  is_manual?: boolean;
}

export function CardViewer({ card, game, onClose }: { card: ViewerCard | null; game: GameId; onClose: () => void }) {
  return (
    <Modal open={!!card} onClose={onClose}>
      {card && (
        <div className="flex flex-col items-center gap-5">
          <div className="w-[72%] max-w-[300px] animate-flip-in">
            <CardArt name={card.name} rarity={card.rarity} tier={card.tier} image={largeImage(card.image_url)} game={game} interactive />
          </div>
          <div className="w-full text-center">
            <h3 className="font-display text-2xl font-bold text-ink-50">{card.name}</h3>
            <p className="mt-1 text-sm text-ink-300">
              {card.rarity}
              {card.quantity && card.quantity > 1 ? ` / x${card.quantity}` : ''}
              {card.is_manual ? ' / Added by hand' : ''}
            </p>
            {card.is_manual ? (
              <div className="mt-4 inline-flex flex-col items-center rounded-2xl border border-amber-400/40 bg-amber-400/10 px-6 py-3">
                <span className="score-num text-3xl text-amber-100">{money(card.value)}</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-200">Unverified estimate</span>
                <span className="mt-0.5 text-[11px] text-ink-300">Not counted in the Rip Score</span>
              </div>
            ) : (
              <div className="mt-4 inline-flex flex-col items-center rounded-2xl border border-gold-400/30 bg-gold-400/10 px-6 py-3">
                <span className="score-num text-3xl text-gold-300">{money(card.value)}</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gold-200/80">Catalog reference value</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
