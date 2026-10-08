import { Navigate, Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    const homePath = user.role === 'ORGANIZER' ? '/dashboard' : '/home';
    const allowed = roles.map(r => r.toLowerCase()).join(' or ');

    return (
      <div className="empty-state">
        <div className="empty-state-icon"><Lock size={40} strokeWidth={1.5} /></div>
        <h3>You don't have access to this page</h3>
        <p>This page is only available to {allowed} accounts.</p>
        <Link to={homePath} className="btn btn-primary" style={{ marginTop: '16px' }}>
          Go to your home
        </Link>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;