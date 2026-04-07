import { useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/Toast';

export default function LoginModal({ isOpen, onClose, onSuccess, onSwitchToRegister }) {
  const { login } = useAuth();
  const [loginType, setLoginType] = useState('ev-owner');
  const [username, setUsername]   = useState('');
  const [password, setPassword]   = useState('');
  const [adminCode, setAdminCode] = useState('');

  if (!isOpen) return null;

  async function handleLogin(e) {
    if (e) e.preventDefault(); // Verify form submission is prevented
    console.log("[DEBUG] Login button clicked or ENTER pressed");

    if (!username || !password) { 
      console.log("[DEBUG] Validation failed: Empty username or password");
      showToast('Please enter username and password', 'error'); 
      return; 
    }

    if (loginType === 'admin') {
      if (adminCode !== 'admin123') { showToast('Invalid admin code', 'error'); return; }
    }

    try {
      console.log(`[DEBUG] Attempting API call to: https://near-charge-api.onrender.com/api/login`);
      console.log(`[DEBUG] Payload:`, { email: username, type: loginType });
      
      const { data } = await client.post('https://near-charge-api.onrender.com/api/login', { 
        email: username, 
        password, 
        type: loginType 
      });

      console.log("[DEBUG] API Response:", data);

      if (!data.success) { 
        showToast(data.message || 'Login failed', 'error'); 
        return; 
      }

      login(data.user);
      onClose();
      showToast(loginType === 'admin' ? 'Welcome, Admin!' : 'Welcome back!', 'success');
      onSuccess(data.user);
    } catch (err) {
      console.error("[DEBUG] API Error:", err);
      showToast(err.response?.data?.message || 'Login failed', 'error');
    }
  }

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} style={{ zIndex: 3000 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3><i className="fas fa-sign-in-alt" style={{ color: 'var(--primary)' }} /> Welcome Back</h3>
          <button className="close-btn" onClick={onClose}><i className="fas fa-times" /></button>
        </div>
        <form className="modal-body" onSubmit={handleLogin}>
          {/* Role Selector */}
          <div className="user-type-selector role-selector" style={{ marginBottom: '1.5rem' }}>
            {['ev-owner', 'host', 'admin'].map(type => (
              <div
                key={type}
                className={`user-type-option ${loginType === type ? 'active' : ''}`}
                onClick={() => setLoginType(type)}
              >
                <i className={`fas fa-${type === 'ev-owner' ? 'car' : type === 'host' ? 'home' : 'shield-alt'}`} />
                <h3>{type === 'ev-owner' ? 'EV Owner' : type === 'host' ? 'Host' : 'Admin'}</h3>
              </div>
            ))}
          </div>

          <div className="form-group">
            <label>Phone Number / Email</label>
            <input type="text" placeholder="Enter phone or email" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          {loginType === 'admin' && (
            <div className="form-group">
              <label>Admin Access Code</label>
              <input type="password" placeholder="Enter admin code" value={adminCode} onChange={e => setAdminCode(e.target.value)} />
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginBottom: '1rem' }}>
            <i className="fas fa-sign-in-alt" /> Log In
          </button>
          <p style={{ textAlign: 'center', color: 'var(--gray-600)' }}>
            Don't have an account?{' '}
            <a style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }} onClick={onSwitchToRegister}>
              Sign up
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
