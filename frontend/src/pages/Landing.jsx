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
          Verified elections for communities
        </div>

        <h1 className="landing-title">
          Not just another poll tool.<br />
          <span className="gradient-text">Elections you can trust.</span>
        </h1>

        <p className="landing-subtitle">
          Built for housing societies, student unions, and clubs running real
          decisions — too small for enterprise e-voting, too important for a
          WhatsApp poll. One vote per person, verified, every time.
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

      {/* Footer */}
      <footer className="landing-footer">
        <p>© 2026 PollWave. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Landing;
