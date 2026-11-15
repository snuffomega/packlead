import { useState, type FormEvent } from 'react';
import { Modal } from '../Modal';

export interface ManualCard {
  name: string;
  rarity: string;
  value: number;
}

export function ManualCardModal({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (c: ManualCard) => void }) {
  const [name, setName] = useState('');
  const [rarity, setRarity] = useState('');
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = Number(value);
    if (!name.trim() || name.trim().length > 80) return setError('Enter a card name (up to 80 characters).');
    if (!Number.isFinite(v) || v < 0 || v > 100000) return setError('Enter an estimated value between $0 and $100,000.');
    onAdd({ name: name.trim(), rarity: rarity.trim().slice(0, 40) || 'Unknown', value: Math.round(v * 100) / 100 });
    setName('');
    setRarity('');
    setValue('');
    setError(null);
  };

  return (
    <Modal open={open} onClose={onClose} title="Add a card by hand">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-ink-300">Can't find a card in the list? Add it with your own estimate. It will be shown as an unverified estimate and does not count toward your Rip Score.</p>
        <div>
          <label className="label" htmlFor="mc-name">
            Card name
          </label>
          <input id="mc-name" className="input mt-1.5" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pikachu Illustration Rare" autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="mc-rarity">
              Rarity
            </label>
            <input id="mc-rarity" className="input mt-1.5" value={rarity} onChange={(e) => setRarity(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <label className="label" htmlFor="mc-value">
              Est. value (USD)
            </label>
            <input
              id="mc-value"
              className="input mt-1.5"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="0.00"
            />
          </div>
        </div>
        {error && <p className="text-sm text-coral-300">{error}</p>}
        <button type="submit" className="btn-primary w-full">
          Add card
        </button>
      </form>
    </Modal>
  );
}
