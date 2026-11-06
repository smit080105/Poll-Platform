import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, BarChart3 } from 'lucide-react';

function Landing() {
  return (
    <div className="landing">
      {/* Animated background orbs */}
      <div className="landing-bg">
        <div className="landing-bg-orb" />
        <div className="landing-bg-orb" />
        <div className="landing-bg-orb" />
      </div>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-badge">
          <span className="landing-badge-dot" />
          Private-by-design community voting
        </div>

        <h1 className="landing-title">
          Community decisions,<br />
          <span className="gradient-text">made with confidence.</span>
        </h1>

        <p className="landing-subtitle">
          Run clear, trusted polls for your club, housing society, or student
          union. Every eligible member gets one private ballot, and results stay
          hidden until voting closes.
        </p>

        <div className="landing-actions">
          <Link to="/register" className="btn btn-primary btn-lg">
            Get Started Free <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="btn btn-secondary btn-lg">
            Log In
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-features">
        <div className="landing-features-heading">
          <span className="landing-section-label">Built for better decisions</span>
          <h2>A fairer way to hear every voice</h2>
          <p>Simple to run, easy to share, and designed to protect each vote.</p>
        </div>

        <div className="feature-card glass-card">
          <div className="feature-icon">
            <Zap size={22} />
          </div>
          <h3>Instant Shareable Links</h3>
          <p>
            Every poll gets a unique short URL. Share it anywhere — social media,
            email, or messaging apps. Participants vote with one click.
          </p>
        </div>

        <div className="feature-card glass-card">
          <div className="feature-icon">
            <Shield size={22} />
          </div>
          <h3>Private-by-Design Ballots</h3>
          <p>
            Account records prevent repeat participation, while ballot records
            store the selected option without a voter identifier.
          </p>
        </div>

        <div className="feature-card glass-card">
          <div className="feature-icon">
            <BarChart3 size={22} />
          </div>
          <h3>Results After Close</h3>
          <p>
            Turnout and option totals stay hidden during voting, helping prevent
            participants&apos; choices from being inferred from changing totals.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>© 2026 PollWave. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Landing;
