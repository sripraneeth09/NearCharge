import { useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/Toast';

export default function RegisterModal({ isOpen, onClose, onOpenHostModal, onSuccess, onSwitchToLogin }) {
  const { login } = useAuth();
  const [regType, setRegType] = useState(null);
  const [name, setName]       = useState('');
  const [phone, setPhone]     = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms]     = useState(false);

  function selectType(type) {
    setRegType(type);
    if (type === 'host') {
      onClose();
      onOpenHostModal();
    }
  }

  async function registerEVOwner(e) {
    if (e) e.preventDefault();
    console.log("[DEBUG] EV Owner Register button clicked");

    if (!name || !phone || !email || !password) { 
      console.log("[DEBUG] Validation failed: Missing fields");
      showToast('Please fill in all fields', 'error'); 
      return; 
    }
    if (!terms) { 
      console.log("[DEBUG] Validation failed: Terms not accepted");
      showToast('Please accept the Terms of Service', 'error'); 
      return; 
    }

    try {
      console.log(`[DEBUG] Attempting API call to: /api/register (Base: https://nearcharge-backend.onrender.com)`);
      console.log(`[DEBUG] Payload:`, { name, email, type: 'ev-owner' });

      const { data } = await client.post('/api/register', { 
        name, phone, email, password, type: 'ev-owner' 
      });

      console.log("[DEBUG] API Response:", data);

      if (!data.success) { 
        showToast(data.message || 'Registration failed', 'error'); 
        return; 
      }
      
      login(data.user);
      onClose();
      showToast('Account created! Welcome to Near Charge.', 'success');
      onSuccess(data.user);
    } catch (err) {
      console.error("[DEBUG] API Error:", err);
      showToast(err.response?.data?.message || 'Registration failed', 'error');
    }
  }

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} style={{ zIndex: 2900 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3><i className="fas fa-user-plus" style={{ color: 'var(--primary)' }} /> Join Near Charge</h3>
          <button className="close-btn" onClick={onClose}><i className="fas fa-times" /></button>
        </div>
        <div className="modal-body">
          <p style={{ textAlign: 'center', color: 'var(--gray-600)', marginBottom: '1.5rem' }}>
            Select how you want to use Near Charge
          </p>

          <div className="user-type-selector">
            <div className={`user-type-option ${regType === 'ev-owner' ? 'active' : ''}`} onClick={() => selectType('ev-owner')}>
              <i className="fas fa-car" />
              <h3>EV Owner</h3>
              <p>Find emergency charging</p>
            </div>
            <div className={`user-type-option ${regType === 'host' ? 'active' : ''}`} onClick={() => selectType('host')}>
              <i className="fas fa-home" />
              <h3>Become a Host</h3>
              <p>Share electricity &amp; earn</p>
            </div>
          </div>

          {regType === 'ev-owner' && (
            <form onSubmit={registerEVOwner}>
              <h4 style={{ marginBottom: '1.5rem', color: 'var(--gray-900)' }}>Create EV Owner Account</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="tel" placeholder="10-digit number" maxLength="10" value={phone} onChange={e => setPhone(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Create Password</label>
                <input type="password" placeholder="Min 8 characters" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'normal', cursor: 'pointer' }}>
                  <input type="checkbox" style={{ width: 'auto' }} checked={terms} onChange={e => setTerms(e.target.checked)} />
                  <span style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>I agree to the Terms of Service</span>
                </label>
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginBottom: '1rem' }}>
                <i className="fas fa-user-plus" /> Create Account
              </button>
            </form>
          )}
          
          <p style={{ textAlign: 'center', color: 'var(--gray-600)', marginTop: '1.5rem' }}>
            Already have an account?{' '}
            <a style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }} onClick={onSwitchToLogin}>
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
