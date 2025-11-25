import { Link } from 'react-router-dom';
import './Homepage.css';

const Homepage = () => {
  return (
    <div className="homepage">
      {/* Header */}
      <header className="homepage-header">
        <div className="header-container">
          <div className="logo-section">
            <div className="logo">
              <div className="logo-icon">G</div>
              <span className="logo-text">Gather</span>
            </div>
            <div className="new-badge">
              <span className="badge-dot"></span>
              What's new
            </div>
          </div>
          
          <nav className="header-nav">
            <a href="#product">Product</a>
            <a href="#testimonials">Testimonials</a>
            <a href="#resources">Resources</a>
            <a href="#pricing">Pricing</a>
            <a href="#contact">Contact Sales</a>
          </nav>

          <div className="header-actions">
            <Link to="/login" className="btn-login">Login</Link>
            <Link to="/register" className="btn-primary">Get started</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-badge">
            Just shipped: Fresh styles for your avatar &gt;
          </div>
          
          <h1 className="hero-title">
            People + knowledge.<br />
            All in one place.
          </h1>
          
          <p className="hero-description">
            Collaborate instantly and search intelligently with Gather. Bring meetings, 
            chat, and context from other apps into one AI-powered workspace.
          </p>
          
          <Link to="/register" className="btn-hero">
            Start free 30-day trial
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="features-container">
          <div className="feature-item">
            <div className="feature-icon">💬</div>
            <span>Meetings</span>
          </div>
          <div className="feature-item">
            <div className="feature-icon">💭</div>
            <span>Chat</span>
          </div>
          <div className="feature-item">
            <div className="feature-icon">📊</div>
            <span>Activity</span>
          </div>
          <div className="feature-item">
            <div className="feature-icon">📚</div>
            <span>Knowledge</span>
          </div>
        </div>
      </section>

      {/* App Preview */}
      <section className="app-preview-section">
        <div className="app-preview-container">
          <div className="app-preview-header">
            <div className="preview-title">
              <span className="lock-icon">🔒</span>
              Design Review
            </div>
            <div className="preview-controls">
              <button className="control-btn">⊞</button>
              <button className="control-btn">⊡</button>
              <button className="control-btn">⊟</button>
            </div>
          </div>
          
          <div className="app-preview-content">
            <div className="video-grid">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="video-tile">
                  <div className="video-placeholder">
                    <div className="video-avatar">
                      {String.fromCharCode(65 + (i % 26))}
                    </div>
                  </div>
                  <div className="video-name">
                    User {i + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2>Ready to get started?</h2>
          <p>Join thousands of teams using Gather to collaborate better</p>
          <Link to="/register" className="btn-cta">
            Get started for free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="homepage-footer">
        <div className="footer-container">
          <p>&copy; 2024 Gather. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;





