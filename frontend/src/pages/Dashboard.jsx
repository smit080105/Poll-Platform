import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import PollCard from '../components/PollCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { PlusCircle, BarChart3, Users, Zap } from 'lucide-react';

function Dashboard() {
  const { user } = useAuth();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPolls = async () => {
    try {
      const res = await api.get('/polls');
      setPolls(res.data);
    } catch (err) {
      setError('Failed to load polls.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  const handleDelete = async (pollId) => {
    if (!window.confirm('Are you sure you want to delete this poll?')) return;
    try {
      await api.delete(`/polls/${pollId}`);
      setPolls(polls.filter(p => p.id !== pollId));
    } catch (err) {
      alert('Failed to delete poll.');
    }
  };

  const handlePublish = async (pollId) => {
    try {
      await api.post(`/polls/${pollId}/publish`);
      fetchPolls();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to publish poll.');
    }
  };

  // Calculate stats
  const totalVotes = polls.reduce((sum, p) => sum + (p._count?.votes || 0), 0);
  const activePolls = polls.filter(p => {
    if (p.status !== 'ACTIVE') return false;
    const now = new Date();
    return now >= new Date(p.startDate) && now <= new Date(p.endDate);
  }).length;

  if (loading) return <LoadingSpinner text="Loading your polls..." />;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, {user?.name}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Manage your polls and track results
          </p>
        </div>
        <Link to="/create-poll" className="btn btn-primary">
          <PlusCircle size={18} /> Create Poll
        </Link>
      </div>

            {/* Stats */}
      <div className="ledger-row">
        <div className="ledger-item">
          <span className="ledger-value">{polls.length}</span>
          <span className="ledger-label">Polls created</span>
        </div>
        <div className="ledger-divider" />
        <div className="ledger-item">
          <span className="ledger-value">{totalVotes}</span>
          <span className="ledger-label">Votes counted</span>
        </div>
        <div className="ledger-divider" />
        <div className="ledger-item">
          <span className="ledger-value">{activePolls}</span>
          <span className="ledger-label">Polls active now</span>
        </div>
      </div>

      {/* Polls */}
      <h2 className="dashboard-section-title">
        <BarChart3 size={20} /> Your Polls
      </h2>

      {error && <div className="alert alert-error">{error}</div>}

      {polls.length === 0 ? (
        <div className="empty-state">
        <div className="empty-state-icon"><BarChart3 size={40} strokeWidth={1.5} /></div>
          <h3>No polls yet</h3>
          <p>Create your first poll and start collecting responses in real-time.</p>
          <Link to="/create-poll" className="btn btn-primary" style={{ marginTop: '16px' }}>
            <PlusCircle size={18} /> Create Your First Poll
          </Link>
        </div>
      ) : (
        <div className="polls-grid">
          {polls.map(poll => (
            <PollCard
              key={poll.id}
              poll={poll}
              onDelete={handleDelete}
              onPublish={handlePublish}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
