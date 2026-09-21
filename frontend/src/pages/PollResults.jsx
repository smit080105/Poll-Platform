import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { io } from 'socket.io-client';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { ArrowLeft, Copy, Check, Link as LinkIcon, Share2, Download } from 'lucide-react';

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

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', { transports: ['websocket', 'polling'] });
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

  const exportResults = () => {
    if (!poll || !results) return;
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
  };

  if (loading) return <LoadingSpinner text="Loading results..." />;
  if (!poll || !results) {
    return (
      <div className="poll-results">
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <h2>No Results Available</h2>
          <p>The poll results are not available at this time.</p>
        </div>
      </div>
    ); }
  }