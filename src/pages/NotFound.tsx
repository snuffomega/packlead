import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/States';

export default function NotFound() {
  return (
    <EmptyState
      icon={<Compass size={24} />}
      title="Nothing here"
      body="This page does not exist. The leaderboard is a good place to start."
      action={
        <Link to="/" className="btn-primary">
          Back to rankings
        </Link>
      }
    />
  );
}
