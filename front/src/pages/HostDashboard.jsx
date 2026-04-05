import { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/Toast';

export default function HostDashboard({ onShowLanding, onLogout }) {
  const { currentUser, refreshUser } = useAuth();
  const [section, setSection]         = useState('requests');
  const [stats, setStats]             = useState({ today: 0, week: 0, month: 0, totalGuests: 0, isActive: true });
  const [pending, setPending]         = useState([]);
  const [recent, setRecent]           = useState([]);
  const [isActive, setIsActive]       = useState(true);
  const [otpInput, setOtpInput]       = useState({}); // { requestId: value }

  useEffect(() => {
    if (currentUser?._id) { loadStats(); loadRequests(); }
  }, [currentUser]);

  async function loadStats() {
    try {
      const { data } = await client.get(`/api/stats?type=host&userId=${currentUser._id}`);
      if (data.success) { setStats(data.stats); setIsActive(data.stats.isActive ?? true); }
    } catch {}
  }

  async function loadRequests() {
    try {
      const { data } = await client.get(`/api/requests/host?userId=${currentUser._id}`);
      if (data.success) { setPending(data.pending); setRecent(data.recent); }
    } catch {}
  }

  async function toggleActive() {
    const newState = !isActive;
    try {
      const { data } = await client.patch('/api/hosts/toggle-active', { userId: currentUser._id, isActive: newState });
      if (data.success) { setIsActive(data.isActive); showToast(`You are now ${data.isActive ? 'ONLINE' : 'OFFLINE'}`, 'info'); }
    } catch { showToast('Failed to update status', 'error'); }
  }

  async function acceptRequest(id) {
    try {
      const { data } = await client.patch(`/api/requests/${id}/status`, { status: 'accepted' });
      if (data.success) { showToast('Request accepted! Guest is on the way.', 'success'); loadRequests(); loadStats(); }
    } catch { showToast('Failed to accept request', 'error'); }
  }

  async function declineRequest(id) {
    try {
      const { data } = await client.patch(`/api/requests/${id}/status`, { status: 'rejected' });
      if (data.success) { showToast('Request declined.', 'info'); loadRequests(); }
    } catch { showToast('Failed to decline request', 'error'); }
  }

  async function completeSession(id) {
    if (!confirm('This will end the charging session and mark it as completed. Proceed?')) return;
    try {
      const { data } = await client.patch(`/api/requests/${id}/status`, { status: 'completed' });
      if (data.success) { showToast('Session completed! You are now available for other guests.', 'success'); loadRequests(); loadStats(); }
    } catch { showToast('Failed to complete session', 'error'); }
  }

  async function startSession(id) {
    const otp = otpInput[id];
    if (!otp || otp.length !== 4) { showToast('Please enter the 4-digit OTP provided by the guest.', 'warning'); return; }
    
    try {
      const { data } = await client.patch(`/api/requests/${id}/verify-otp`, { otp });
      if (data.success) {
        showToast('OTP Verified! Charging started.', 'success');
        loadRequests();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Invalid OTP', 'error');
    }
  }

  return (
    <div className="dashboard" style={{ display: 'block' }}>
      {/* Header */}
      <div className="dashboard-header">
        <div className="logo" onClick={onShowLanding}><i className="fas fa-bolt" /> Near Charge</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Online / Offline toggle */}
          <div
            onClick={toggleActive}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--gray-100)', padding: '0.25rem 0.75rem', borderRadius: '2rem', cursor: 'pointer' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: isActive ? 'var(--primary)' : 'var(--gray-400)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{isActive ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
          <span style={{ fontWeight: 600 }}>{currentUser?.name}</span>
          <button className="btn btn-outline btn-sm" onClick={onLogout}>Logout</button>
        </div>
      </div>

      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <ul className="sidebar-menu">
          {[
            { id: 'requests', icon: 'fa-bell',       label: 'Requests' },
            { id: 'earnings', icon: 'fa-rupee-sign',  label: 'Earnings' },
            { id: 'reviews',  icon: 'fa-star',        label: 'Reviews' },
            { id: 'setup',    icon: 'fa-cog',         label: 'My Setup' },
            { id: 'profile',  icon: 'fa-user',        label: 'Profile' }
          ].map(item => (
            <li key={item.id}>
              <a className={section === item.id ? 'active' : ''} onClick={() => setSection(item.id)}>
                <i className={`fas ${item.icon}`} /> {item.label}
                {item.id === 'requests' && pending.length > 0 && (
                  <span style={{ background: 'var(--danger)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', marginLeft: '0.25rem' }}>
                    {pending.length}
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Main */}
      <div className="dashboard-main">
        {section === 'requests' && (
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>Charging Requests</h2>
            <div className="stats-grid">
              <div className="stat-card"><h4>₹{stats.today}</h4><p>Today's Earnings</p></div>
              <div className="stat-card"><h4>₹{stats.week}</h4><p>This Week</p></div>
              <div className="stat-card"><h4>₹{stats.month}</h4><p>This Month</p></div>
              <div className="stat-card"><h4>{stats.totalGuests}</h4><p>Total Guests</p></div>
            </div>

            <div className="content-card">
              <h3 style={{ marginBottom: '1rem' }}>Pending Requests</h3>
              {pending.length === 0
                ? <p style={{ color: 'var(--gray-600)', padding: '1rem' }}>No pending requests at the moment.</p>
                : pending.map(r => (
                  <div key={r._id} className="request-item">
                    <div className="request-avatar" style={{ background: '#fee2e2', color: '#dc2626' }}>
                      {r.user?.name?.[0] || 'U'}
                    </div>
                    <div className="request-info">
                      <h4>{r.user?.name || 'Unknown User'}
                        <span style={{ background: 'var(--danger)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                          {r.currentBattery}% Battery
                        </span>
                      </h4>
                      <p>{r.vehicleType || 'EV'} • Target: {r.targetBattery}% • {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="action-btns">
                      <button className="btn btn-primary btn-sm" onClick={() => acceptRequest(r._id)}>Accept</button>
                      <button className="btn btn-ghost btn-sm"   onClick={() => declineRequest(r._id)}>Decline</button>
                    </div>
                  </div>
                ))}
            </div>

            <div className="content-card">
              <h3 style={{ marginBottom: '1rem' }}>Recent Sessions</h3>
              {recent.length === 0
                ? <p style={{ color: 'var(--gray-600)', padding: '1rem' }}>No recent sessions.</p>
                : recent.map(s => (
                  <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--gray-200)' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{s.user?.name || 'Unknown User'}</div>
                      <div style={{ fontSize: '0.875rem', color: s.status === 'rejected' ? 'var(--danger)' : 'var(--gray-600)' }}>
                        {new Date(s.createdAt).toLocaleString()} • <strong style={{ color: s.status === 'accepted' ? 'var(--primary)' : 'inherit' }}>{s.status.toUpperCase()}</strong>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ fontWeight: 700, color: s.status === 'rejected' ? 'var(--gray-500)' : 'var(--primary-dark)' }}>
                          ₹{['accepted', 'started', 'completed'].includes(s.status) ? (currentUser?.price || 35) : 0}
                        </div>
                        {s.status === 'started' && (
                          <button className="btn btn-primary btn-sm" style={{ padding: '0.25rem 0.75rem' }} onClick={() => completeSession(s._id)}>Complete</button>
                        )}
                      </div>
                      
                      {s.status === 'accepted' && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <input 
                            type="text" 
                            placeholder="Enter 4-digit OTP" 
                            maxLength="4"
                            style={{ width: '130px', padding: '0.35rem 0.75rem', fontSize: '0.85rem', border: '1px solid var(--gray-300)', borderRadius: '0.5rem' }}
                            value={otpInput[s._id] || ''}
                            onChange={(e) => setOtpInput({ ...otpInput, [s._id]: e.target.value })}
                          />
                          <button className="btn btn-primary btn-sm" style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }} onClick={() => startSession(s._id)}>Start Charging</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {section === 'earnings' && <div><h2>Your Earnings</h2><p style={{ color: 'var(--gray-600)', marginTop: '1rem' }}>Detailed breakdown of your wallet and payouts.</p></div>}
        {section === 'reviews'  && <div><h2>Reviews</h2><p style={{ color: 'var(--gray-600)', marginTop: '1rem' }}>Guest reviews will appear here.</p></div>}
        {section === 'setup'    && <div><h2>My Setup</h2><p style={{ color: 'var(--gray-600)', marginTop: '1rem' }}>Update your socket and charger information.</p></div>}
        {section === 'profile'  && (
          <div>
            <h2>Host Profile</h2>
            <div className="content-card" style={{ marginTop: '1rem' }}>
              <p><strong>Name:</strong> {currentUser?.name}</p>
              <p><strong>Address:</strong> {currentUser?.address}</p>
              <p><strong>Email:</strong> {currentUser?.email}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
