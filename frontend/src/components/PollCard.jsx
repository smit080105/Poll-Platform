import { useNavigate } from 'react-router-dom';
import { Clock, Users, Copy, ExternalLink, BarChart2, Trash2 } from 'lucide-react';

function PollCard({ poll, onDelete, onPublish }) {
  const navigate = useNavigate();

  const getStatusClass = () => {
    if (poll.status === 'ACTIVE') {
      const now = new Date();
      if (now > new Date(poll.endDate)) return 'ended';
      return 'active';
    }
    return poll.status.toLowerCase();
  };

  const getStatusLabel = () => {
    if (poll.status === 'ACTIVE') {
      const now = new Date();
      if (now > new Date(poll.endDate)) return 'Ended';
      if (now < new Date(poll.startDate)) return 'Scheduled';
      return 'Active';
    }
    return poll.status.charAt(0) + poll.status.slice(1).toLowerCase();
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const copyLink = (e) => {
    e.stopPropagation();
    const link = `${window.location.origin}/poll/${poll.shortId}`;
    navigator.clipboard.writeText(link);
  };

  const totalVotes = poll._count?.votes || 0;

  return (
    <div className="poll-card glass-card" onClick={() => navigate(`/results/${poll.id}`)}>
      <div className="poll-card-header">
        <h3 className="poll-card-title">{poll.title}</h3>
        <span className={`status-badge ${getStatusClass()}`}>
          {getStatusLabel()}
        </span>
      </div>

      {poll.description && (
        <p className="poll-card-description">{poll.description}</p>
      )}

      <div className="poll-card-meta">
        <span className="poll-card-meta-item">
          <Users size={14} /> {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
        </span>
        <span className="poll-card-meta-item">
          <Clock size={14} /> {formatDate(poll.endDate)}
        </span>
      </div>

      <div className="poll-card-actions">
        {poll.status === 'DRAFT' && (
          <button
            className="btn btn-success btn-sm"
            onClick={(e) => { e.stopPropagation(); onPublish?.(poll.id); }}
          >
            Publish
          </button>
        )}
        <button
          className="btn btn-secondary btn-sm"
          onClick={copyLink}
          title="Copy shareable link"
        >
          <Copy size={14} /> Copy Link
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={(e) => { e.stopPropagation(); window.open(`/poll/${poll.shortId}`, '_blank'); }}
          title="Open poll"
        >
          <ExternalLink size={14} />
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={(e) => { e.stopPropagation(); navigate(`/results/${poll.id}`); }}
          title="View results"
        >
          <BarChart2 size={14} />
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={(e) => { e.stopPropagation(); onDelete?.(poll.id); }}
          title="Delete poll"
          style={{ color: 'var(--accent-danger)' }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export default PollCard;
