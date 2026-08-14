import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { PlusCircle, Trash2, ArrowLeft, AlertCircle, Send } from 'lucide-react';

function CreatePoll() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('SINGLE_CHOICE');
  const [options, setOptions] = useState(['', '']);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxVotes, setMaxVotes] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const addOption = () => {
    if (options.length >= 10) return;
    setOptions([...options, '']);
  };

  const removeOption = (index) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate
    const filledOptions = options.filter(o => o.trim());
    if (filledOptions.length < 2) {
      setError('Please provide at least 2 options.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Please set start and end dates.');
      return;
    }
    if (new Date(startDate) >= new Date(endDate)) {
      setError('End date must be after start date.');
      return;
    }

    setLoading(true);

    try {
      const pollData = {
        title,
        description,
        type,
        options: filledOptions,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        maxVotes: maxVotes ? parseInt(maxVotes) : null,
        isPublic
      };

      await api.post('/polls', pollData);
      navigate('/dashboard');
    } catch (err) {
      const errData = err.response?.data;
      setError(errData?.errors?.join(' ') || errData?.error || 'Failed to create poll.');
    } finally {
      setLoading(false);
    }
  };

  // Set default dates
  const setDefaultDates = () => {
    const now = new Date();
    const start = new Date(now.getTime() + 5 * 60000);
    const end = new Date(now.getTime() + 7 * 24 * 60 * 60000);

    const toLocalISO = (d) => {
      const offset = d.getTimezoneOffset();
      const local = new Date(d.getTime() - offset * 60000);
      return local.toISOString().slice(0, 16);
    };

    if (!startDate) setStartDate(toLocalISO(start));
    if (!endDate) setEndDate(toLocalISO(end));
  };

  // Set defaults on first focus of date fields
  const handleDateFocus = () => {
    setDefaultDates();
  };

  return (
    <div className="create-poll">
      <button className="btn btn-ghost" onClick={() => navigate('/dashboard')} style={{ marginBottom: '16px' }}>
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      <h1>Create New Poll</h1>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <form className="create-poll-form" onSubmit={handleSubmit}>
        <div className="glass-card-static" style={{ padding: '28px' }}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label" htmlFor="poll-title">Poll Title *</label>
            <input
              id="poll-title"
              type="text"
              className="form-input"
              placeholder="e.g. MIT-WPU Student Council Election 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label" htmlFor="poll-description">Description</label>
            <textarea
              id="poll-description"
              className="form-input"
              placeholder="Describe what this poll is about..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="form-row" style={{ marginBottom: '20px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="poll-type">Poll Type</label>
              <select
                id="poll-type"
                className="form-select"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="SINGLE_CHOICE">Single Choice</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="poll-visibility">Visibility</label>
              <select
                id="poll-visibility"
                className="form-select"
                value={isPublic ? 'public' : 'private'}
                onChange={(e) => setIsPublic(e.target.value === 'public')}
              >
                <option value="public">Public</option>
                <option value="private">Private (link only)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="glass-card-static" style={{ padding: '28px' }}>
          <label className="form-label" style={{ marginBottom: '12px', display: 'block' }}>
            Options / Candidates *
          </label>
          <div className="options-section">
            {options.map((opt, index) => (
              <div className="option-item" key={index}>
                <span className="option-number">{index + 1}</span>
                <input
                  type="text"
                  className="form-input"
                  placeholder={`Option ${index + 1}`}
                  value={opt}
                  onChange={(e) => updateOption(index, e.target.value)}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon"
                    onClick={() => removeOption(index)}
                    title="Remove option"
                    style={{ color: 'var(--accent-danger)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            {options.length < 10 && (
              <button type="button" className="add-option-btn" onClick={addOption}>
                <PlusCircle size={16} /> Add Option
              </button>
            )}
          </div>
        </div>

        {/* Schedule */}
        <div className="glass-card-static" style={{ padding: '28px' }}>
          <label className="form-label" style={{ marginBottom: '12px', display: 'block' }}>
            Schedule
          </label>
          <div className="form-row" style={{ marginBottom: '20px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="poll-start" style={{ fontSize: '0.75rem' }}>Start Date & Time</label>
              <input
                id="poll-start"
                type="datetime-local"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                onFocus={handleDateFocus}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="poll-end" style={{ fontSize: '0.75rem' }}>End Date & Time</label>
              <input
                id="poll-end"
                type="datetime-local"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                onFocus={handleDateFocus}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="poll-max-votes">Max Votes (optional)</label>
            <input
              id="poll-max-votes"
              type="number"
              className="form-input"
              placeholder="Leave empty for unlimited"
              value={maxVotes}
              onChange={(e) => setMaxVotes(e.target.value)}
              min="1"
              style={{ maxWidth: '300px' }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? (
              <div className="loading-spinner" style={{ width: 20, height: 20 }} />
            ) : (
              <>
                <Send size={18} /> Create Poll
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreatePoll;
