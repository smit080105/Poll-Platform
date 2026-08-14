import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { io } from 'socket.io-client';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { ArrowLeft, Copy, Check, Link as LinkIcon, Share2 } from 'lucide-react';

function PollResults() {
  const { pollId } = useParams();
  const navigate = useNavigate();

  const [poll, setPoll] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pollRes, resultsRes] = await Promise.all([
          api.get(`/polls/${pollId}`),
          api.get(`/votes/${pollId}/results`)
        ]);
        setPoll(pollRes.data);
        setResults(resultsRes.data);
      } catch (err) {
        console.error('Failed to load poll results');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [pollId]);

  // Real-time updates
  useEffect(() => {
    if (!poll) return;

    const socket = io(window.location.origin, { transports: ['websocket', 'polling'] });
    socket.emit('join-poll', poll.id);

    socket.on('vote-update', (data) => {
      if (data.pollId === poll.id) {
        setResults(prev => ({
          ...prev,
          totalVotes: data.totalVotes,
          options: prev.options.map(opt => {
            const updated = data.options.find(o => o.id === opt.id);
            return updated ? {
              ...opt,
              votes: updated.votes,
              percentage: data.totalVotes > 0
                ? Math.round((updated.votes / data.totalVotes) * 100)
                : 0
            } : opt;
          })
        }));
      }
    });

    return () => {
      socket.emit('leave-poll', poll.id);
      socket.disconnect();
    };
  }, [poll?.id]);

  const copyLink = () => {
    if (!poll) return;
    const link = `${window.location.origin}/poll/${poll.shortId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <LoadingSpinner text="Loading results..." />;
  if (!poll || !results) {
    return (
      <div className="poll-results">
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>Poll Not Found</h3>
        </div>
      </div>
    );
  }

  // Find the winner (most votes)
  const maxVotes = Math.max(...results.options.map(o => o.votes));

  return (
    <div className="poll-results">
      <button className="btn btn-ghost" onClick={() => navigate('/dashboard')} style={{ marginBottom: '16px' }}>
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      <h1>{poll.title}</h1>
      <p className="poll-results-subtitle">{poll.description}</p>

      {/* Results Card */}
      <div className="results-card glass-card-static">
        <div className="results-header">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Live Results</h2>
          <div className="results-total">
            <span>{results.totalVotes}</span> total votes
          </div>
        </div>

        {results.options.map(option => (
          <div
            key={option.id}
            className={`result-item ${option.votes === maxVotes && maxVotes > 0 ? 'winner' : ''}`}
          >
            <div className="result-item-header">
              <span className="result-item-text">
                {option.votes === maxVotes && maxVotes > 0 && '👑 '}
                {option.text}
              </span>
              <div className="result-item-stats">
                <span className="result-item-votes">{option.votes} vote{option.votes !== 1 ? 's' : ''}</span>
                <span className="result-item-percentage">{option.percentage}%</span>
              </div>
            </div>
            <div className="result-bar-bg">
              <div
                className="result-bar-fill"
                style={{ width: `${option.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Share Section */}
      <div className="share-section glass-card-static">
        <div className="share-section-title">
          <Share2 size={16} /> Share this poll
        </div>
        <div className="share-link-box">
          <input
            className="share-link-input"
            value={`${window.location.origin}/poll/${poll.shortId}`}
            readOnly
            onClick={(e) => e.target.select()}
          />
          <button className="btn btn-primary btn-sm" onClick={copyLink}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        {copied && (
          <div className="copy-success">
            <Check size={14} /> Link copied to clipboard
          </div>
        )}
      </div>
    </div>
  );
}

export default PollResults;
