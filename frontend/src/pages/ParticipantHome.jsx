import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { Search, Users, Clock, ArrowRight } from 'lucide-react';

function ParticipantHome() {
  const navigate = useNavigate();

  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pollCode, setPollCode] = useState('');

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const res = await api.get('/polls/public');
        setPolls(res.data);
      } catch (err) {
        console.error('Failed to load polls');
      } finally {
        setLoading(false);
      }
    };
    fetchPolls();
  }, []);

  const handleJoinPoll = (e) => {
    e.preventDefault();
    if (!pollCode.trim()) return;

    // Extract shortId from URL or direct code
    let code = pollCode.trim();
    if (code.includes('/poll/')) {
      code = code.split('/poll/').pop();
    }
    // Remove any trailing slashes or query params
    code = code.split('?')[0].split('/')[0];

    navigate(`/poll/${code}`);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric'
    });
  };

  if (loading) return <LoadingSpinner text="Finding polls..." />;

  return (
    <div className="participant-home">
      <h1>🗳️ Browse Polls</h1>
      <p className="participant-home-subtitle">
        Join a poll with a link or browse active public polls below
      </p>

      {/* Join by code/link */}
      <form className="join-poll-section glass-card-static" onSubmit={handleJoinPoll}>
        <div className="form-group">
          <label className="form-label" htmlFor="poll-code">Join with Poll Link or Code</label>
          <input
            id="poll-code"
            type="text"
            className="form-input"
            placeholder="Paste poll link or enter code (e.g. 8f72a91c)"
            value={pollCode}
            onChange={(e) => setPollCode(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ marginTop: '22px' }}>
          <Search size={16} /> Join
        </button>
      </form>

      {/* Public polls */}
      <h2 className="dashboard-section-title" style={{ marginTop: '16px' }}>
        Active Public Polls
      </h2>

      {polls.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h3>No active polls right now</h3>
          <p>Check back later or join a poll using a shared link above.</p>
        </div>
      ) : (
        <div className="public-polls-grid">
          {polls.map(poll => (
            <div
              key={poll.id}
              className="poll-card glass-card"
              onClick={() => navigate(`/poll/${poll.shortId}`)}
            >
              <div className="poll-card-header">
                <h3 className="poll-card-title">{poll.title}</h3>
                <span className="status-badge active">Active</span>
              </div>
              {poll.description && (
                <p className="poll-card-description">{poll.description}</p>
              )}
              <div className="poll-card-meta">
                <span className="poll-card-meta-item">
                  <Users size={14} /> {poll._count?.votes || 0} votes
                </span>
                <span className="poll-card-meta-item">
                  <Clock size={14} /> Ends {formatDate(poll.endDate)}
                </span>
                {poll.organizer?.name && (
                  <span className="poll-card-meta-item">
                    by {poll.organizer.name}
                  </span>
                )}
              </div>
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-glass)' }}>
                <button className="btn btn-success btn-sm" style={{ width: '100%' }}>
                  Vote Now <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ParticipantHome;
