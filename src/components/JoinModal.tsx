import { useState, type FormEvent } from 'react';
import { createPlayer } from '../lib/api';
import { useSession } from '../lib/session';
import type { AvatarColor, AvatarIcon } from '../lib/types';
import { AVATAR_COLORS, AVATAR_ICONS, Avatar } from './Avatar';
import { Modal } from './Modal';

export function JoinModal() {
  const { joinOpen, closeJoin, setPlayer } = useSession();
  return (
    <Modal open={joinOpen} onClose={closeJoin} title="Claim your spot">
      <JoinForm
        onDone={(p) => {
          setPlayer(p);
          closeJoin();
        }}
      />
    </Modal>
  );
}

export function JoinForm({ onDone }: { onDone: (p: Awaited<ReturnType<typeof createPlayer>>) => void }) {
  const [username, setUsername] = useState('');
  const [color, setColor] = useState<AvatarColor>('teal');
  const [icon, setIcon] = useState<AvatarIcon>('flame');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const valid = /^[A-Za-z0-9_]{3,20}$/.test(username);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid) {
      setError('Use 3-20 letters, numbers or underscores.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      onDone(await createPlayer(username, color, icon));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <p className="text-sm text-ink-300">
        Pick a name and avatar to start logging packs. No sign-up needed. This device remembers you.
      </p>
      <div className="flex items-center gap-4">
        <Avatar color={color} icon={icon} size="lg" />
        <div className="flex-1">
          <label className="label" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            className="input mt-1.5"
            placeholder="e.g. HoloHunter"
            value={username}
            maxLength={20}
            autoComplete="off"
            onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
          />
        </div>
      </div>
      <div>
        <p className="label mb-2">Color</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(AVATAR_COLORS) as AvatarColor[]).map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setColor(c)}
              aria-label={c}
              className={`h-8 w-8 rounded-lg bg-gradient-to-br transition ${AVATAR_COLORS[c]} ${color === c ? 'ring-2 ring-ink-50 ring-offset-2 ring-offset-ink-900' : 'opacity-70 hover:opacity-100'}`}
            />
          ))}
        </div>
      </div>
      <div>
        <p className="label mb-2">Emblem</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(AVATAR_ICONS) as AvatarIcon[]).map((i) => {
            const Icon = AVATAR_ICONS[i];
            return (
              <button
                type="button"
                key={i}
                onClick={() => setIcon(i)}
                aria-label={i}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                  icon === i ? 'border-brand-400 bg-brand-400/15 text-brand-200' : 'border-ink-600 bg-ink-800 text-ink-300 hover:text-ink-50'
                }`}
              >
                <Icon size={17} />
              </button>
            );
          })}
        </div>
      </div>
      {error && <p className="rounded-lg border border-coral-500/40 bg-coral-500/10 px-3 py-2 text-sm text-coral-200">{error}</p>}
      <button type="submit" className="btn-primary w-full py-3" disabled={saving}>
        {saving ? 'Creating...' : 'Start ripping'}
      </button>
    </form>
  );
}
