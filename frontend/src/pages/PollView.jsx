import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import { io } from 'socket.io-client';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { CheckCircle2, Clock, AlertCircle, LogIn } from 'lucide-react';
import { Check } from 'lucide-react';

function PollView() {
  const { shortId } = useParams();
  const { user } = useAuth();

  const [poll, setPoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedOptionId, setVotedOptionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState('');

  // Fetch poll data
  const fetchPoll = useCallback(async () => {
    try {
      const res = await api.get(`/polls/s/${shortId}`);
      setPoll(res.data);

      // Check if user has voted
      if (user && res.data) {
        try {
          const voteCheck = await api.get(`/votes/${res.data.id}/check`);
          setHasVoted(voteCheck.data.hasVoted);
          setVotedOptionId(voteCheck.data.votedOptionId);
        } catch {
          // Not logged in or error
        }
      }
    } catch (err) {
      setError('Poll not found or has been removed.');
    } finally {
      setLoading(false);
    }
  }, [shortId, user]);

  useEffect(() => {
    fetchPoll();
  }, [fetchPoll]);

  // Real-time updates via Socket.io
  useEffect(() => {
    if (!poll) return;

 const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', { transports: ['websocket', 'polling'] });    socket.emit('join-poll', poll.id);

    socket.on('vote-update', (data) => {
      if (data.pollId === poll.id) {
        setPoll(prev => ({
          ...prev,
          options: prev.options.map(opt => {
            const updated = data.options.find(o => o.id === opt.id);
            return updated ? { ...opt, _count: { votes: updated.votes } } : opt;
          }),
          _count: { votes: data.totalVotes }
        }));
      }
    });

    return () => {
      socket.emit('leave-poll', poll.id);
      socket.disconnect();
    };
  }, [poll?.id]);

  // Countdown timer
  useEffect(() => {
    if (!poll) return;

    const updateTimer = () => {
      const now = new Date();
      const end = new Date(poll.endDate);
      const start = new Date(poll.startDate);

      if (now < start) {
        const diff = start - now;
        setTimeLeft(`Starts in ${formatDuration(diff)}`);
      } else if (now > end) {
        setTimeLeft('Poll has ended');
      } else {
        const diff = end - now;
        setTimeLeft(`${formatDuration(diff)} remaining`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [poll]);

  const formatDuration = (ms) => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  const handleVote = async () => {
    if (!selectedOption || !user) return;
    setSubmitting(true);
    setError('');

    try {
      await api.post(`/votes/${poll.id}`, { optionId: selectedOption });
      setHasVoted(true);
      setVotedOptionId(selectedOption);
      setSuccess('Your vote has been recorded!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit vote.');
    } finally {
      setSubmitting(false);
    }
  };

  const getPollStatus = () => {
    if (!poll) return 'loading';
    const now = new Date();
    if (poll.status !== 'ACTIVE') return 'draft';
    if (now < new Date(poll.startDate)) return 'not-started';
    if (now > new Date(poll.endDate)) return 'ended';
    return 'active';
  };

  const totalVotes = poll?._count?.votes || 0;

  if (loading) return <LoadingSpinner text="Loading poll..." />;

  if (error && !poll) {
    return (
      <div className="poll-view">
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>Poll Not Found</h3>
          <p>{error}</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '16px' }}>Go Home</Link>
        </div>
      </div>
    );
  }

  const status = getPollStatus();
  const canVote = user && status === 'active' && !hasVoted;

  return (
    <div className="poll-view">
      <div className="poll-view-card glass-card-static">
        {/* Header */}
        <div className="poll-view-header">
          <p className="poll-view-organizer">
            by {poll.organizer?.name || 'Anonymous'}
          </p>
          <h1 className="poll-view-title">{poll.title}</h1>
          {poll.description && (
            <p className="poll-view-description">{poll.description}</p>
          )}
          <span className={`poll-view-timer ${status}`}>
            <Clock size={14} /> {timeLeft}
          </span>
        </div>

        {/* Auth prompt */}
        {!user && status === 'active' && (
          <div className="alert alert-error" style={{ marginBottom: '24px' }}>
            <LogIn size={16} />
            <span>
              <Link to="/login" style={{ color: '#667eea', fontWeight: 600 }}>Sign in</Link> to vote in this poll
            </span>
          </div>
        )}

        {/* Already voted message */}
        {hasVoted && (
          <div className="voted-message">
          <div className="voted-message-icon"><Check size={28} strokeWidth={2.5} /></div>
            <h3>You've already voted!</h3>
            <p>Your response has been recorded. Results are shown below.</p>
          </div>
        )}

        {/* Success message */}
        {success && !hasVoted && (
          <div className="alert alert-success" style={{ marginBottom: '24px' }}>
            <CheckCircle2 size={16} /> {success}
          </div>
        )}

        {/* Error message */}
        {error && poll && (
          <div className="alert alert-error" style={{ marginBottom: '24px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Vote Options */}
        <div className="vote-options">
          {poll.options.map(option => {
            const votes = option._count?.votes || 0;
            const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            const isSelected = selectedOption === option.id;
            const isVotedOption = votedOptionId === option.id;

            return (
              <div
                key={option.id}
                className={`vote-option ${isSelected ? 'selected' : ''} ${hasVoted ? 'voted' : ''} ${isVotedOption ? 'selected-vote' : ''}`}
                onClick={() => {
                  if (canVote) setSelectedOption(option.id);
                }}
              >
                <div className="vote-radio" />
                <span className="vote-option-text">{option.text}</span>
                {(hasVoted || status === 'ended') && (
                  <span className="vote-option-count">{percentage}% ({votes})</span>
                )}
                {(hasVoted || status === 'ended') && (
                  <div className="vote-bar" style={{ width: `${percentage}%` }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Submit button */}
        {canVote && (
          <div className="vote-submit-area">
            <button
              className="btn btn-success btn-lg"
              onClick={handleVote}
              disabled={!selectedOption || submitting}
              style={{ width: '100%' }}
            >
              {submitting ? (
                <div className="loading-spinner" style={{ width: 20, height: 20 }} />
              ) : (
                <>
                  <CheckCircle2 size={18} /> Submit Vote
                </>
              )}
            </button>
          </div>
        )}

        {/* Total votes */}
        <p className="vote-total">
          {totalVotes} vote{totalVotes !== 1 ? 's' : ''} cast
        </p>
      </div>
    </div>
  );
}

export default PollView;
