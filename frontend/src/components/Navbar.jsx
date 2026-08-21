import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { LogOut, BarChart3, Home, PlusCircle } from 'lucide-react';

function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
      <div className="brand-icon"><Logo size={18} /></div>
        <span>PollWave</span>
      </Link>

      <div className="navbar-nav">
        {!user && (
          <>
            <Link to="/login" className={`nav-link ${isActive('/login')}`}>Log In</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
          </>
        )}

        {user && user.role === 'ORGANIZER' && (
          <>
            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BarChart3 size={16} /> Dashboard
              </span>
            </Link>
            <Link to="/create-poll" className={`nav-link ${isActive('/create-poll')}`}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PlusCircle size={16} /> Create Poll
              </span>
            </Link>
          </>
        )}

        {user && user.role === 'PARTICIPANT' && (
          <Link to="/home" className={`nav-link ${isActive('/home')}`}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Home size={16} /> Browse Polls
            </span>
          </Link>
        )}

        {user && (
          <div className="nav-user">
            <div className="nav-user-info">
              <div className="nav-user-name">{user.name}</div>
              <div className="nav-user-role">{user.role}</div>
            </div>
            <div className="nav-avatar">{user.name?.charAt(0).toUpperCase()}</div>
            <button className="btn btn-ghost btn-sm" onClick={logout} title="Log out">
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
