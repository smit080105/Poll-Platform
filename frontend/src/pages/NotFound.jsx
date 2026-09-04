import { Link } from 'react-router-dom';
import { Vote } from 'lucide-react';

function NotFound() {
  return (
    <div className="landing" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', textAlign: 'center', padding: '24px' }}>
      <div className="empty-state-icon"><Vote size={40} strokeWidth={1.5} /></div>
      <h1 style={{ marginTop: '16px' }}>Page not found</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        This page doesn't exist, or the link may be broken.
      </p>
      <Link to="/" className="btn btn-primary">Go home</Link>
    </div>
  );
}

export default NotFound;