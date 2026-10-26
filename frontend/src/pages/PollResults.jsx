import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { ArrowLeft, Copy, Check, Share2, Download } from 'lucide-react';

function PollResults() {
  const { pollId } = useParams();
  const navigate = useNavigate();

  const [poll, setPoll] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setPoll(null);
      setResults(null);
      setError('');
      try {
        const pollRes = await api.get(`/polls/${pollId}`);
        setPoll(pollRes.data);
        const resultsAvailable = pollRes.data.status !== 'ACTIVE'
          || Date.now() > new Date(pollRes.data.endDate).getTime();
        if (resultsAvailable) {
          const resultsRes = await api.get(`/votes/${pollId}/results`);
          setResults(resultsRes.data);
        }
      } catch {
        setError('Could not load this poll or its results. Please try again.');
        console.error('Failed to load poll results');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [pollId]);

  const copyLink = () => {
    if (!poll) return;
    const link = `${window.location.origin}/poll/${poll.shortId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportResults = () => {
    if (!poll || !results) return;
    setExporting(true);
    const rows = [
      ['Poll Title', poll.title],
      ['Poll ID', poll.id],
      ['Total Votes', results.totalVotes],
      ['Exported At', new Date().toISOString()],
      [],
      ['Option', 'Votes', 'Percentage'],
      ...results.options.map(opt => [opt.text, opt.votes, `${opt.percentage}%`])
    ];
    const csv = rows.map(r => r.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${poll.title.replace(/\s+/g, '_')}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setExporting(false), 400);
  };

  if (loading) return <LoadingSpinner text="Loading results..." />;
  if (error || !poll) {
    return (
      <div className="poll-results">
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <h2>{error ? 'Could Not Load Results' : 'No Results Available'}</h2>
          <p>{error || 'The poll results are not available at this time.'}</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="poll-results">
        <button className="btn btn-ghost" onClick={() => navigate('/dashboard')} style={{ marginBottom: '16px' }}>
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <h2>Results are hidden until the poll closes</h2>
          <p>
            Hiding turnout and option totals during voting helps protect each
            participant&apos;s choice from being inferred.
          </p>
          <p>
            Poll closes {new Date(poll.endDate).toLocaleString()}. Refresh this
            page after it closes to see the final tally.
          </p>
        </div>
      </div>
    );
  }

  // Find the winner (most votes)
  const maxVotes = results.options.length > 0
    ? Math.max(...results.options.map(o => o.votes))
    : 0;

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
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Election Results</h2>
          <div className="results-total">
            <span>{results.totalVotes}</span> total ballots
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
                <span className="result-item-votes">{option.votes} ballot{option.votes !== 1 ? 's' : ''}</span>
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

        <button className="btn btn-secondary btn-sm" onClick={exportResults} disabled={exporting} style={{ marginTop: '16px' }}>
          <Download size={14} /> {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
        
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