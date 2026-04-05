import { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/Toast';
import StatusBadge from '../components/StatusBadge';

export default function AdminDashboard({ onShowLanding, onLogout }) {
  const { currentUser } = useAuth();
  const [section, setSection]   = useState('verifications');
  const [stats, setStats]       = useState({ pending: 0, approved: 0, rejected: 0, totalHosts: 0, totalUsers: 0, totalEarnings: 0 });
  const [pendingHosts, setPendingHosts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => { loadStats(); loadPending(); loadAllUsers(); }, []);

  async function loadStats() {
    try {
      const { data } = await client.get('/api/stats?type=admin');
      if (data.success) setStats(data.stats);
    } catch {}
  }

  async function loadPending() {
    try {
      const { data } = await client.get('/api/hosts/pending');
      if (data.success) setPendingHosts(data.hosts);
    } catch {}
  }

  async function loadAllUsers() {
    try {
      const { data } = await client.get('/api/user/all');
      if (data.success) setAllUsers(data.users);
    } catch { showToast('Failed to load user list', 'error'); }
  }

  async function approve(id) {
    try {
      const { data } = await client.patch(`/api/hosts/${id}/approve`);
      if (data.success) { showToast('Host approved!', 'success'); loadPending(); loadStats(); }
    } catch { showToast('Failed to approve', 'error'); }
  }

  async function reject(id) {
    try {
      const { data } = await client.patch(`/api/hosts/${id}/reject`);
      if (data.success) { showToast('Host rejected.', 'info'); loadPending(); loadStats(); }
    } catch { showToast('Failed to reject', 'error'); }
  }

  return (
    <div className="dashboard" style={{ display: 'block' }}>
      {/* Header */}
      <div className="dashboard-header admin-header">
        <div className="logo" style={{ color: 'white' }} onClick={onShowLanding}><i className="fas fa-bolt" /> Near Charge Admin</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className="admin-badge">ADMIN</span>
          <span style={{ fontWeight: 600 }}>{currentUser?.name}</span>
          <button className="btn btn-outline btn-sm" style={{ borderColor: 'white', color: 'white' }} onClick={onLogout}>Logout</button>
        </div>
      </div>

      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <ul className="sidebar-menu">
          {[
            { id: 'verifications', icon: 'fa-user-check',      label: 'Host Verifications' },
            { id: 'users',         icon: 'fa-users',            label: 'All Users' },
            { id: 'transactions',  icon: 'fa-exchange-alt',     label: 'Transactions' },
            { id: 'disputes',      icon: 'fa-exclamation-triangle', label: 'Disputes' },
            { id: 'analytics',     icon: 'fa-chart-line',       label: 'Analytics' }
          ].map(item => (
            <li key={item.id}>
              <a className={section === item.id ? 'active' : ''} onClick={() => setSection(item.id)}>
                <i className={`fas ${item.icon}`} /> {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Main */}
      <div className="dashboard-main">
        {section === 'verifications' && (
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>Host Verifications</h2>
            <div className="stats-grid">
              <div className="stat-card"><h4>{stats.pending}</h4><p>Pending</p></div>
              <div className="stat-card"><h4>{stats.approved}</h4><p>Approved</p></div>
              <div className="stat-card"><h4>{stats.totalUsers}</h4><p>Total Users</p></div>
              <div className="stat-card"><h4>₹{stats.totalEarnings}</h4><p>Total Revenue</p></div>
            </div>

            <div className="content-card">
              <h3 style={{ marginBottom: '1rem' }}>Pending Verifications</h3>
              <div className="responsive-table-container">
                <table className="verification-table">
                  <thead>
                    <tr>
                      <th>Host Name</th><th>Location</th><th>Socket Type</th>
                      <th>Setup Type</th><th>Documents</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingHosts.length === 0 && (
                      <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>No pending verifications.</td></tr>
                    )}
                    {pendingHosts.map(h => (
                      <tr key={h._id}>
                        <td><strong>{h.name}</strong><br /><span style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>{h.email}</span></td>
                        <td>{h.address || h.location || '—'}</td>
                        <td>{h.socketType || '5A'}</td>
                        <td>{h.setupType || h.setup || 'own'}</td>
                        <td><span style={{ color: 'var(--gray-400)' }}>No files</span></td>
                        <td><StatusBadge status={h.status} /></td>
                        <td>
                          <div className="action-btns">
                            <button className="btn btn-primary btn-sm" onClick={() => approve(h._id)}>Approve</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => reject(h._id)}>Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {section === 'users' && (
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>All Registered Users</h2>
            <div className="content-card">
              <div className="responsive-table-container">
                <table className="verification-table">
                  <thead>
                    <tr>
                      <th>Name / Email</th><th>Type</th><th>Location</th><th>Joined</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.length === 0 && (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No users found.</td></tr>
                    )}
                    {allUsers.map(u => (
                      <tr key={u._id}>
                        <td><strong>{u.name}</strong><br />{u.email}</td>
                        <td><span className="badge" style={{ 
                          background: u.type === 'host' ? 'var(--primary-light)' : 'var(--accent-light)', 
                          color: u.type === 'host' ? 'var(--primary-dark)' : 'var(--accent-dark)',
                          fontWeight: 700
                        }}>{(u.type || 'host').toUpperCase()}</span></td>
                        <td>{u.location || '—'}</td>
                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td><StatusBadge status={u.status || 'active'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {section === 'transactions' && <div><h2>Transactions</h2><p style={{ color: 'var(--gray-600)', marginTop: '1rem' }}>Total Platform Volume: ₹{stats.totalEarnings}</p></div>}
        {section === 'disputes'     && <div><h2>Disputes</h2><p style={{ color: 'var(--gray-600)', marginTop: '1rem' }}>Dispute management coming soon.</p></div>}
        {section === 'analytics'    && <div><h2>Analytics</h2><p style={{ color: 'var(--gray-600)', marginTop: '1rem' }}>Analytics dashboard coming soon.</p></div>}
      </div>
    </div>

  );
}
