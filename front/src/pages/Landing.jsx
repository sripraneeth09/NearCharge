import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function Landing({ onLogin, onRegister, onFindCharging, onShowLanding, onShowProfile }) {
  const { currentUser } = useAuth();
  return (
    <div id="landingPage">
      <Navbar onLogin={onLogin} onRegister={onRegister} onShowLanding={onShowLanding} onShowProfile={onShowProfile} />

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-content">
          <h1>Power Up Anywhere, <span>Anytime</span></h1>
          <p>India's first decentralized EV charging network. Connect with nearby homes and shops for emergency charging — whether you have your own charger or need one.</p>

          <div className="hero-buttons">
            <button id="findChargingBtn" className="btn btn-primary btn-lg" onClick={onFindCharging}>
              <i className="fas fa-bolt" /> Find Charging Now
            </button>
            {!currentUser && (
              <button id="joinNetworkBtn" className="btn btn-outline btn-lg" onClick={onRegister}>
                <i className="fas fa-user-plus" /> Join Network
              </button>
            )}
          </div>

          <div className="hero-stats">
            <div className="stat"><div className="stat-value">25K+</div><div className="stat-label">Active Hosts</div></div>
            <div className="stat"><div className="stat-value">1.2M+</div><div className="stat-label">Emergency Charges</div></div>
            <div className="stat"><div className="stat-value">4.9★</div><div className="stat-label">App Rating</div></div>
            <div className="stat"><div className="stat-value">15min</div><div className="stat-label">Avg. Response</div></div>
          </div>
        </div>

        {/* Phone Mockup */}
        <div className="hero-visual">
          <div className="phone-mockup">
            <div className="phone-notch" />
            <div className="phone-screen">
              <div className="app-header">
                <div className="battery-indicator">
                  <i className="fas fa-battery-quarter" /><span>8% Battery</span>
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Finding nearby hosts...</h3>
                <p style={{ opacity: 0.9, fontSize: '0.875rem' }}>5 available within 1km</p>
              </div>
              <div className="map-preview">
                <div className="map-pin" style={{ top: '30%', left: '30%' }}><i className="fas fa-home" /></div>
                <div className="map-pin" style={{ top: '50%', left: '60%', background: 'var(--secondary)' }}><i className="fas fa-store" /></div>
                <div className="map-pin" style={{ top: '40%', left: '45%', background: 'var(--accent)' }}><i className="fas fa-coffee" /></div>
              </div>
              <div className="host-card">
                <div className="host-avatar"><i className="fas fa-home" /></div>
                <div>
                  <h4 style={{ fontSize: '0.9rem' }}>Rahul's Home</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>150m • 5A Socket</p>
                </div>
              </div>
              <div className="host-card">
                <div className="host-avatar" style={{ background: '#fef3c7', color: '#d97706' }}><i className="fas fa-store" /></div>
                <div>
                  <h4 style={{ fontSize: '0.9rem' }}>Priya's Shop</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>300m • Type 2</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-header">
            <h2>Why Near Charge Works for Everyone</h2>
            <p>Whether you have a charger or need one, our network adapts to your situation</p>
          </div>
          <div className="features-grid">
            {[
              { icon: 'fa-plug',            title: 'Universal Compatibility', desc: 'Hosts can offer simple 5A/15A sockets or EV chargers. EV owners can filter based on whether they have their own portable charger.' },
              { icon: 'fa-ambulance',        title: 'Emergency First',          desc: "When you're stranded with a dead battery, find the nearest help within minutes. No more range anxiety." },
              { icon: 'fa-hand-holding-usd', title: 'Earn From Any Socket',    desc: 'Any household or shop can become a host. Just provide electricity through a standard socket.' }
            ].map(f => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon"><i className={`fas ${f.icon}`} /></div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────── */}
      <section className="how-it-works" id="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2>How It Works</h2>
            <p>Two simple flows — whether you're charging or hosting</p>
          </div>
          <div className="steps">
            {[
              { n: 1, title: 'Tell Us Your Setup',   desc: 'Select if you have your own charger or need to borrow one' },
              { n: 2, title: 'Find Compatible Hosts', desc: 'See only hosts that match your charging needs' },
              { n: 3, title: 'Charge & Pay',          desc: 'Connect and pay seamlessly through the app' },
              { n: 4, title: 'Earn as Host',           desc: 'Share your electricity and earn passive income' }
            ].map(s => (
              <div key={s.n} className="step">
                <div className="step-number">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────── */}
      <section className="testimonials" id="testimonials">
        <div className="container">
          <div className="section-header">
            <h2>Community Stories</h2>
            <p>Real experiences from EV owners and hosts across India</p>
          </div>
          <div className="testimonial-grid">
            <div className="testimonial-card">
              <div className="testimonial-header">
                <div className="testimonial-avatar">AR</div>
                <div><h4>Arjun Reddy</h4><p style={{ color: 'var(--gray-600)' }}>EV Owner, Bangalore</p></div>
              </div>
              <p style={{ color: 'var(--gray-700)', lineHeight: 1.8 }}>"I always carry my portable charger. Near Charge showed me 4 homes within 500m when I was at 5%. Lifesaver!"</p>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-header">
                <div className="testimonial-avatar" style={{ background: 'linear-gradient(135deg, #fce7f3 0%, #ec4899 100%)' }}>SM</div>
                <div><h4>Sneha Menon</h4><p style={{ color: 'var(--gray-600)' }}>Host, Mumbai</p></div>
              </div>
              <p style={{ color: 'var(--gray-700)', lineHeight: 1.8 }}>"I just have a 15A socket. Still earned ₹12,000 this month helping people charge with their own chargers!"</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="cta">
        <div className="cta-container">
          <h2>Join India's Charging Revolution</h2>
          <p>Whether you need emergency power or want to earn from your electricity, Near Charge connects you.</p>
          <div className="cta-buttons">
            {!currentUser ? (
              <>
                <button className="btn btn-white btn-lg" onClick={onRegister}><i className="fas fa-user-plus" /> Get Started Free</button>
                <button className="btn btn-transparent btn-lg" onClick={onLogin}><i className="fas fa-sign-in-alt" /> Log In</button>
              </>
            ) : (
              <button className="btn btn-white btn-lg" onClick={onFindCharging}><i className="fas fa-bolt" /> Find Charging Now</button>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer>
        <div className="footer-content">
          <div className="footer-section">
            <h3><i className="fas fa-bolt" style={{ color: 'var(--primary)' }} /> Near Charge</h3>
            <p>India's decentralized EV charging network. Connecting EV owners with nearby hosts for emergency charging.</p>
            <div className="social-links">
              <a><i className="fab fa-twitter" /></a>
              <a><i className="fab fa-facebook-f" /></a>
              <a><i className="fab fa-instagram" /></a>
            </div>
          </div>
          <div className="footer-section">
            <h3>For EV Owners</h3>
            <ul><li><a>How to Find Charging</a></li><li><a>Charger Compatibility</a></li><li><a>Safety Guidelines</a></li></ul>
          </div>
          <div className="footer-section">
            <h3>For Hosts</h3>
            <ul><li><a>Host Requirements</a></li><li><a>Earnings Calculator</a></li><li><a>Insurance Coverage</a></li></ul>
          </div>
          <div className="footer-section">
            <h3>Company</h3>
            <ul><li><a>About Us</a></li><li><a>Careers</a></li><li><a>Contact</a></li></ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
