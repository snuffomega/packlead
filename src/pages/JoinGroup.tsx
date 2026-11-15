import { Loader2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AccountGate } from '../components/JoinModal';
import { EmptyState, Skeleton } from '../components/States';
import { joinGroup } from '../lib/api';
import { useSession } from '../lib/session';

export default function JoinGroup() {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const { player, loading } = useSession();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!player) return;
    let active = true;
    joinGroup(code)
      .then((id) => active && navigate(`/friends/${id}`, { replace: true }))
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [player, code, navigate]);

  if (loading) return <Skeleton className="h-64" />;
  if (error) {
    return <EmptyState icon={<Users size={24} />} title="Could not join" body={error} action={<Link to="/friends" className="btn-primary">Go to Friends</Link>} />;
  }
  if (!player) {
    return (
      <div className="mx-auto max-w-md">
        <p className="label text-brand-300">You're invited</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink-50">Join group {code.toUpperCase()}</h1>
        <p className="mb-6 mt-1 text-sm text-ink-400">Sign in or create an account and you will be added to the group automatically.</p>
        <div className="surface p-5">
          <AccountGate />
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-ink-300">
      <Loader2 className="animate-spin text-brand-300" size={28} />
      Joining group...
    </div>
  );
}
