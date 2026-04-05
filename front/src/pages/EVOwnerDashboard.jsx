import { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/Toast';

export default function EVOwnerDashboard({ onShowLanding, onLogout }) {
  const { currentUser } = useAuth();
  const [section, setSection]   = useState('previous-orders');
  const [history, setHistory]   = useState([]);
  const [stats, setStats]       = useState({ totalCharges: 0, totalSpent: 0, savedHosts: 0 });

  useEffect(() => {
    if (currentUser?._id) {
      loadStats();
      loadHistory();
    }
  }, [currentUser]);

  async function loadStats() {
    try {
      const { data } = await client.get(`/api/stats?type=ev-owner&userId=${currentUser._id}`);
      if (data.success) setStats(data.stats);
    } catch {}
  }

  async function loadHistory() {
    try {
      const { data } = await client.get(`/api/requests?userId=${currentUser._id}&t=${Date.now()}`);
      if (data.success) setHistory(data.requests);
    } catch {}
  }

  // Polling for active requests
  useEffect(() => {
    if (!currentUser?._id) return;
    
    const hasActive = history.some(r => r.status === 'pending');
    if (!hasActive) return;

    const timer = setInterval(loadHistory, 5000);
    return () => clearInterval(timer);
  }, [history, currentUser]);

  const activeRequest = history.find(r => r.status === 'pending' || r.status === 'accepted');

  const openGoogleMaps = (host) => {
    if (!host.lat || !host.lng) return;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${host.lat},${host.lng}&travelmode=driving`, '_blank');
  };

  return (
    <div className="dashboard" style={{ display: 'block' }}>
      {/* Header */}
      <div className="dashboard-header">
        <div className="logo" onClick={onShowLanding}><i className="fas fa-bolt" /> Near Charge</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'var(--gray-600)' }}><i className="fas fa-car" /> EV Owner</span>
          <span style={{ fontWeight: 600 }}>{currentUser?.name}</span>
          <button className="btn btn-outline btn-sm" onClick={onLogout}>Logout</button>
        </div>
      </div>

      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <ul className="sidebar-menu">
          {[
            { id: 'previous-orders', icon: 'fa-history', label: 'Previous Orders' },
            { id: 'transactions',    icon: 'fa-receipt', label: 'Transactions' },
            { id: 'reviews',         icon: 'fa-star',    label: 'Reviews' },
            { id: 'profile',         icon: 'fa-user',    label: 'Profile' }
          ].map(item => (
            <li key={item.id}>
              <a className={section === item.id ? 'active' : ''} onClick={() => setSection(item.id)}>
                <i className={`fas ${item.icon}`} /> {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Main Content */}
      <div className="dashboard-main">
        {activeRequest && (
          <div className="content-card" style={{ border: '2px solid var(--primary)', background: '#f8fafc', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: 'var(--primary-dark)' }}>
                <i className="fas fa-bolt" /> Active Charging Request
              </h3>
              <span className={`badge badge-${activeRequest.status === 'accepted' ? 'success' : 'warning'}`}>
                {activeRequest.status.toUpperCase()}
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
              <div style={{ background: 'var(--primary-light)', padding: '1rem', borderRadius: '12px', color: 'var(--primary)' }}>
                <i className={`fas fa-3x fa-${activeRequest.host?.setup === 'own' ? 'home' : 'charging-station'}`} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{activeRequest.host?.name}</h4>
                <p style={{ color: 'var(--gray-600)', marginBottom: '0.5rem' }}><i className="fas fa-location-dot" /> {activeRequest.host?.location}</p>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem' }}>
                  <span><strong>Vehicle:</strong> {activeRequest.vehicleType?.toUpperCase()}</span>
                  <span><strong>Target:</strong> {activeRequest.targetBattery}%</span>
                </div>
              </div>
            </div>

            {activeRequest.status === 'accepted' && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--gray-200)' }}>
                <div style={{ background: '#ecfdf5', color: '#065f46', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.95rem' }}>
                  <i className="fas fa-check-circle" /> Host has accepted! You can now navigate to the location.
                </div>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1rem' }}
                  onClick={() => openGoogleMaps(activeRequest.host)}
                >
                  <i className="fab fa-google" /> Navigate to Station
                </button>
              </div>
            )}
            
            {activeRequest.status === 'pending' && (
              <p style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--gray-500)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                Waiting for host to accept your request...
              </p>
            )}
          </div>
        )}

        {/* Previous Orders */}
        {section === 'previous-orders' && (
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>Previous Orders</h2>
            <div className="stats-grid">
              <div className="stat-card"><h4>{stats.totalCharges}</h4><p>Total Charges</p></div>
              <div className="stat-card"><h4>{stats.savedHosts}</h4><p>Saved Hosts</p></div>
              <div className="stat-card"><h4>15 min</h4><p>Avg Response</p></div>
            </div>
            <div className="content-card">
              <h3 style={{ marginBottom: '1rem' }}>Charging Sessions</h3>
              {history.length === 0
                ? <p style={{ color: 'var(--gray-600)' }}>No charging sessions yet.</p>
                : history.map((h, i) => (
                  <div key={h._id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--gray-200)' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{h.host?.name || 'Unknown host'}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                        {h.host?.location || ''} • {new Date(h.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontSize: '0.85rem', 
                        fontWeight: 600, 
                        color: h.status === 'completed' ? 'var(--success)' : h.status === 'accepted' ? 'var(--primary)' : 'var(--gray-600)',
                        background: h.status === 'completed' ? '#f0fdf4' : h.status === 'accepted' ? '#eff6ff' : '#f3f4f6',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        display: 'inline-block'
                      }}>
                        {h.status.toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Transactions */}
        {section === 'transactions' && (
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>Transactions</h2>
            <div className="stats-grid">
              <div className="stat-card"><h4>₹{stats.totalSpent}</h4><p>Total Spent</p></div>
              <div className="stat-card"><h4>₹0</h4><p>Wallet Balance</p></div>
            </div>
            <div className="content-card">
              <h3 style={{ marginBottom: '1rem' }}>Payment History</h3>
              {history.length === 0
                ? <p style={{ color: 'var(--gray-600)' }}>No transactions yet.</p>
                : history.map((h, i) => (
                  <div key={h._id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--gray-200)' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>Payment to {h.host?.name || 'Unknown host'}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                        {new Date(h.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--accent)' }}>- ₹{h.host?.price || 35}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>{h.status.toUpperCase()}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        {section === 'reviews' && (
          <div>
            <h2>Reviews</h2>
            <div className="content-card" style={{ marginTop: '1rem' }}>
              <p style={{ color: 'var(--gray-600)' }}>Your recent reviews for charging hosts.</p>
              {/* Dummy structure for future implementation */}
              <div style={{ marginTop: '1.5rem', border: '1px solid var(--gray-200)', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Rahul's Home</span>
                  <span style={{ color: '#fbbf24' }}>★★★★★</span>
                </h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.5rem' }}>"Excellent setup, very quick charging. The host was accommodating!"</p>
              </div>
            </div>
          </div>
        )}

        {section === 'profile' && (
          <div>
            <h2>Your Profile</h2>
            <div className="content-card" style={{ marginTop: '1rem' }}>
              <p><strong>Name:</strong> {currentUser?.name}</p>
              <p><strong>Email:</strong> {currentUser?.email}</p>
              <p><strong>Phone:</strong> {currentUser?.phone}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
