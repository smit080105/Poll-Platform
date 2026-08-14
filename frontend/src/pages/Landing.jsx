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
          Real-time polling platform
        </div>

        <h1 className="landing-title">
          Create polls that<br />
          <span className="gradient-text">matter in real-time</span>
        </h1>

        <p className="landing-subtitle">
          Build engaging polls, share them instantly with a link, and watch votes
          pour in live. Secure one-person-one-vote integrity built right in.
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
        <div className="feature-card glass-card">
          <div className="feature-icon purple">
            <Zap size={22} />
          </div>
          <h3>Instant Shareable Links</h3>
          <p>
            Every poll gets a unique short URL. Share it anywhere — social media,
            email, or messaging apps. Participants vote with one click.
          </p>
        </div>

        <div className="feature-card glass-card">
          <div className="feature-icon teal">
            <Shield size={22} />
          </div>
          <h3>Tamper-Proof Voting</h3>
          <p>
            Double-layer one-person-one-vote protection with application-level
            checks and database-level constraints. Your results stay honest.
          </p>
        </div>

        <div className="feature-card glass-card">
          <div className="feature-icon amber">
            <BarChart3 size={22} />
          </div>
          <h3>Live Results</h3>
          <p>
            Watch votes flow in real-time with animated charts. Socket-powered
            updates mean zero page refreshes — results update as they happen.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Landing;
