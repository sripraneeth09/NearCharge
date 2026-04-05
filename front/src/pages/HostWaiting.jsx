import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { showToast } from '../components/Toast';

export default function HostWaiting({ onShowLanding, onLogout, onApproved }) {
  const { currentUser, refreshUser } = useAuth();

  useEffect(() => {
    // Initial check
    checkStatus();

    // Set up polling
    const timer = setInterval(() => {
      checkStatus();
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  async function checkStatus() {
    try {
      const { data } = await client.get(`/api/user/${currentUser._id}?t=${Date.now()}`);
      if (data.success) {
        if (data.user.status === 'approved') {
          refreshUser(data.user);
          showToast('You have been approved! Welcome aboard.', 'success');
          onApproved();
        } else if (data.user.status === 'rejected') {
          refreshUser(data.user);
          showToast('Your registration was rejected by admin.', 'error');
          onShowLanding();
        }
      }
    } catch { console.error('Auto-check status failed'); }
  }

  return (
    <div className="dashboard" style={{ display: 'block', background: 'var(--gray-50)' }}>
      <div className="dashboard-header">
        <div className="logo" onClick={onShowLanding}><i className="fas fa-bolt" /> Near Charge</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontWeight: 600 }}>{currentUser?.name}</span>
          <button className="btn btn-outline btn-sm" onClick={onLogout}>Logout</button>
        </div>
      </div>

      <div className="dashboard-main" style={{ marginLeft: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="waiting-card">
          <div className="waiting-icon"><i className="fas fa-clock" /></div>
          <h2 style={{ marginBottom: '1rem', color: 'var(--gray-900)' }}>Waiting for Approval</h2>
          <p style={{ color: 'var(--gray-600)', fontSize: '1.1rem', marginBottom: '2rem', lineHeight: 1.6 }}>
            Thank you for registering as a host with Near Charge!
            Your documents are currently being verified by our team.
          </p>
          <div style={{ background: 'var(--primary-soft)', padding: '1.5rem', borderRadius: '1rem', textAlign: 'left', marginBottom: '2rem' }}>
            <p style={{ fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>
              <i className="fas fa-info-circle" /> What happens next?
            </p>
            <ul style={{ paddingLeft: '1.5rem', color: 'var(--gray-700)', fontSize: '0.95rem' }}>
              <li style={{ marginBottom: '0.5rem' }}>Admin reviews your ID proof and socket details.</li>
              <li style={{ marginBottom: '0.5rem' }}>Once approved, your dashboard will be unlocked automatically.</li>
              <li>You'll be able to receive charging requests and start earning!</li>
            </ul>
          </div>
          <button className="btn btn-primary" onClick={checkStatus}>
            <i className="fas fa-sync-alt" /> Check Status
          </button>
        </div>
      </div>
    </div>
  );
}
