import { useState, useRef } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/Toast';

export default function HostRegisterModal({ isOpen, onClose, onSuccess, onSwitchToLogin }) {
  const { login } = useAuth();
  const [name, setName]         = useState('');
  const [phone, setPhone]       = useState('');
  const [address, setAddress]   = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [socketType, setSocketType]   = useState('5a');
  const [setupType, setSetupType]     = useState('own');
  const [chargerType, setChargerType] = useState(null);
  const [locationCaptured, setLocationCaptured] = useState(false);
  const coordsRef = useRef(null);

  if (!isOpen) return null;

  function detectLocation() {
    if (!navigator.geolocation) { showToast('Geolocation not supported', 'error'); return; }
    showToast('Capturing current location...', 'info');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        coordsRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocationCaptured(true);
        showToast('Home location set!', 'success');
      },
      () => showToast('Permission denied. Type address manually.', 'error')
    );
  }

  async function submitHost(e) {
    if (e) e.preventDefault();
    console.log("[DEBUG] Host Register button clicked");

    if (!name || !phone || !address || !email || !password) {
      console.log("[DEBUG] Validation failed: Missing required fields");
      showToast('Please fill in all required fields', 'error'); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Please enter a valid email address', 'error'); return;
    }
    if (password.length < 8) {
      showToast('Password must be at least 8 characters', 'error'); return;
    }
    if (setupType === 'provide' && !chargerType) {
      showToast('Please select your charger type', 'error'); return;
    }

    try {
      console.log(`[DEBUG] Attempting API call to: /api/register (Base: https://nearcharge-backend.onrender.com)`);
      console.log(`[DEBUG] Payload:`, { name, email, type: 'host' });

      const { data } = await client.post('/api/register', {
        name, phone, email, password, type: 'host',
        address, socketType, setupType,
        chargerType: chargerType || '',
        lat: coordsRef.current?.lat || null,
        lng: coordsRef.current?.lng || null
      });

      console.log("[DEBUG] API Response:", data);

      if (!data.success) { 
        showToast(data.message || 'Registration failed', 'error'); 
        return; 
      }

      login(data.user);
      onClose();
      showToast('Registration submitted! Team will verify your location.', 'success');
      onSuccess(data.user);
    } catch (err) {
      console.error("[DEBUG] API Error:", err);
      showToast(err.response?.data?.message || 'Registration failed', 'error');
    }
  }

  const sockets = ['5a', '15a'];
  const chargers = ['type1', 'type2', 'ccs2', 'bharat'];

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} style={{ zIndex: 2800 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-large">
        <div className="modal-header">
          <h3><i className="fas fa-home" style={{ color: 'var(--primary)' }} /> Register as Host</h3>
          <button type="button" className="close-btn" onClick={onClose}><i className="fas fa-times" /></button>
        </div>
        <form className="modal-body" onSubmit={submitHost}>
          <div style={{ background: 'var(--primary-soft)', borderLeft: '4px solid var(--primary)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
            <p style={{ color: 'var(--primary-dark)' }}><i className="fas fa-lightbulb" /> <strong>Earn up to ₹20,000/month!</strong> Any home or shop can become a charging point.</p>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="tel" placeholder="10-digit number" maxLength="10" value={phone} onChange={e => setPhone(e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
              <label style={{ marginBottom: 0 }}>Complete Address</label>
              <button type="button" className="btn btn-outline btn-sm" onClick={detectLocation}>
                <i className="fas fa-location-crosshairs" /> Detect My Location
              </button>
            </div>
            <textarea rows="2" placeholder="House/Shop number, Street, Area, City" value={address} onChange={e => setAddress(e.target.value)} required style={{ width: '100%', padding: '0.875rem 1.25rem', border: '2px solid var(--gray-200)', borderRadius: '0.75rem', fontFamily: 'inherit', fontSize: '1rem' }} />
            {locationCaptured && (
              <div style={{ fontSize: '0.8rem', color: 'var(--primary-dark)', marginTop: '0.25rem' }}>
                <i className="fas fa-check-circle" /> Ready-point captured!
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="your@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Create Password</label>
              <input type="password" placeholder="Min 8 characters" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
          </div>

          {/* Socket Type */}
          <div className="form-group">
            <label>Socket Type (Required)</label>
            <div className="socket-options">
              {sockets.map(s => (
                <div key={s} className={`socket-option ${socketType === s ? 'active' : ''}`} onClick={() => setSocketType(s)}>
                  <i className={`fas ${s === '5a' ? 'fa-plug' : 'fa-bolt'}`} style={{ fontSize: '2rem', color: socketType === s ? 'var(--primary)' : 'var(--gray-400)', marginBottom: '0.5rem' }} />
                  <h5>{s === '5a' ? '5A Normal' : '15A High Power'}</h5>
                  <p style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>{s === '5a' ? 'Standard household plug' : 'Heavy duty socket'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Setup Type */}
          <div className="form-group">
            <label>Charging Setup Type</label>
            <div className="option-cards">
              <div className={`option-card ${setupType === 'own' ? 'active' : ''}`} onClick={() => setSetupType('own')}>
                <input type="radio" name="setup" readOnly checked={setupType === 'own'} style={{ width: 20, height: 20, marginTop: '0.25rem' }} />
                <div>
                  <h4>EV Owner brings their own charger <span style={{ color: 'var(--primary)' }}>(Recommended)</span></h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>You just provide electricity. <strong>Most common option!</strong></p>
                </div>
              </div>
              <div className={`option-card ${setupType === 'provide' ? 'active' : ''}`} onClick={() => setSetupType('provide')}>
                <input type="radio" name="setup" readOnly checked={setupType === 'provide'} style={{ width: 20, height: 20, marginTop: '0.25rem' }} />
                <div>
                  <h4>I have an EV charger to provide</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>You have Type 1, Type 2, or other EV charging equipment installed.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charger Type (conditional) */}
          {setupType === 'provide' && (
            <div className="conditional-section show">
              <div className="form-group">
                <label>Your EV Charger Type</label>
                <div className="charger-type-section">
                  {chargers.map(c => (
                    <div key={c} className={`charger-type-card ${chargerType === c ? 'active' : ''}`} onClick={() => setChargerType(c)}>
                      <i className={`fas ${c === 'bharat' ? 'fa-plug' : 'fa-charging-station'}`} style={{ fontSize: '2.5rem', color: chargerType === c ? 'var(--primary)' : 'var(--gray-400)' }} />
                      <span style={{ display: 'block', marginTop: '0.5rem' }}>
                        {c === 'type1' ? 'Type 1' : c === 'type2' ? 'Type 2' : c === 'ccs2' ? 'CCS2' : 'Bharat'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Upload ID Proof */}
          <div className="form-group">
            <label>Upload ID Proof (Aadhaar/PAN)</label>
            <div style={{ border: '2px dashed var(--gray-300)', borderRadius: '0.75rem', padding: '2rem', textAlign: 'center', cursor: 'pointer' }}
              onClick={() => showToast('File upload coming soon', 'info')}>
              <i className="fas fa-cloud-upload-alt" style={{ fontSize: '2rem', color: 'var(--gray-400)', marginBottom: '0.5rem', display: 'block' }} />
              <p style={{ color: 'var(--gray-600)' }}>Click to upload</p>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginBottom: '1rem' }}>
            <i className="fas fa-check-circle" /> Submit for Verification
          </button>
          
          <p style={{ textAlign: 'center', color: 'var(--gray-600)', marginTop: '1.5rem' }}>
            Already have an account?{' '}
            <a style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }} onClick={onSwitchToLogin}>
              Log in
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}

