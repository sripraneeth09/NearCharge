import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { showToast } from './components/Toast';

// Pages
import Landing           from './pages/Landing';
import FindCharging      from './pages/FindCharging';
import EVOwnerDashboard  from './pages/EVOwnerDashboard';
import HostDashboard     from './pages/HostDashboard';
import HostWaiting       from './pages/HostWaiting';
import AdminDashboard    from './pages/AdminDashboard';

// Modals
import LoginModal        from './modals/LoginModal';
import RegisterModal     from './modals/RegisterModal';
import HostRegisterModal from './modals/HostRegisterModal';

// Toast
import Toast             from './components/Toast';

export default function App() {
  const { currentUser, currentUserType, logout } = useAuth();

  // ── View State ────────────────────────────────────────────────────────
  // Restore view from sessionStorage on refresh
  const [view, setView] = useState(() => {
    const savedView = sessionStorage.getItem('nc_view');
    if (savedView) return savedView;

    const storedUser = sessionStorage.getItem('nc_user');
    if (!storedUser) return 'landing';

    const user = JSON.parse(storedUser);
    if (user.type === 'admin')    return 'admin';
    if (user.type === 'host')     return user.status === 'pending' ? 'host-waiting' : 'host';
    return 'landing';
  });

  // Helper to change view and persist it
  const navigateTo = (newView) => {
    setView(newView);
    sessionStorage.setItem('nc_view', newView);
  };

  // Redirect Hosts from Landing if accidentally reached
  useEffect(() => {
    if (view === 'landing' && currentUserType === 'host') {
      setView(currentUser?.status === 'pending' ? 'host-waiting' : 'host');
    }
  }, [view, currentUserType, currentUser?.status]);

  // ── Modal State ───────────────────────────────────────────────────────
  const [activeModal, setActiveModal] = useState(null); // 'login', 'register', 'host' or null

  // Ensure clean startup state
  useEffect(() => {
    setActiveModal(null);
    console.log("[DEBUG] Clean App mount: Register and Login modals are closed by default.");
    // Optional: Clear old session data to prevent state haunting
    if (sessionStorage.getItem('nc_view') === 'landing') {
      sessionStorage.removeItem('nc_fc_step');
    }
  }, []);

  // ── Navigation Helpers ────────────────────────────────────────────────
  function showLanding() {
    if (currentUserType === 'host') {
      navigateTo(currentUser?.status === 'pending' ? 'host-waiting' : 'host');
    } else if (currentUserType === 'admin') {
      navigateTo('admin');
    } else {
      navigateTo('landing');
    }
  }
  function showFindCharging() {
    if (!currentUser) { 
      setActiveModal('login'); 
      showToast('Please login to find charging stations', 'warning'); 
      return; 
    }
    if (currentUserType !== 'ev-owner') { 
      showToast('Please login as EV Owner to find charging', 'error'); 
      return; 
    }
    
    // If there's an active request (pending or accepted), DON'T clear the session
    const activeStat = sessionStorage.getItem('nc_fc_rstat');
    if (activeStat === 'pending' || activeStat === 'accepted') {
      navigateTo('find-charging');
      return;
    }

    // Otherwise, completely clear find-charging session to reset to Init Step 1 every time
    sessionStorage.removeItem('nc_fc_step');
    sessionStorage.removeItem('nc_fc_pref');
    sessionStorage.removeItem('nc_fc_vtype');
    sessionStorage.removeItem('nc_fc_cbatt');
    sessionStorage.removeItem('nc_fc_tbatt');
    sessionStorage.removeItem('nc_fc_shost');
    sessionStorage.removeItem('nc_fc_rstat');
    sessionStorage.removeItem('nc_fc_rid');
    
    navigateTo('find-charging');
  }
  function showProfile() {
    if (!currentUser) { showToast('Please log in to view profile', 'warning'); return; }
    if (currentUserType === 'ev-owner') navigateTo('ev-owner');
    else if (currentUserType === 'host') navigateTo(currentUser.status === 'pending' ? 'host-waiting' : 'host');
    else if (currentUserType === 'admin') navigateTo('admin');
  }
  function handleLogout() { 
    logout(); 
    sessionStorage.removeItem('nc_view'); 
    // Clear find-charging persistence
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('nc_fc_')) sessionStorage.removeItem(key);
    });
    setView('landing'); 
    showToast('Logged out successfully', 'info'); 
  }

  // ── After Login/Register ──────────────────────────────────────────────
  function afterLogin(user) {
    setActiveModal(null);
    if (user.type === 'admin')    { navigateTo('admin');        return; }
    if (user.type === 'host')     { navigateTo(user.status === 'pending' ? 'host-waiting' : 'host'); return; }
    if (user.type === 'ev-owner') { navigateTo('landing');      return; }
  }

  function afterRegister(user) {
    setActiveModal(null);
    if (user.type === 'host')     navigateTo('host-waiting');
    else                          navigateTo('landing');
  }

  return (
    <>
      {view === 'landing' && (
        <Landing 
          onLogin={() => setActiveModal('login')} 
          onRegister={() => setActiveModal('register')} 
          onFindCharging={showFindCharging} 
          onShowLanding={showLanding} 
          onShowProfile={showProfile} 
        />
      )}
      {view === 'find-charging' && <FindCharging onShowLanding={showLanding} onLogout={handleLogout} onShowProfile={showProfile} />}
      {view === 'ev-owner'     && <EVOwnerDashboard onShowLanding={showLanding} onLogout={handleLogout} />}
      {view === 'host'         && <HostDashboard onShowLanding={showLanding} onLogout={handleLogout} />}
      {view === 'host-waiting' && <HostWaiting onShowLanding={showLanding} onLogout={handleLogout} onApproved={() => setView('host')} />}
      {view === 'admin'        && <AdminDashboard onShowLanding={showLanding} onLogout={handleLogout} />}

      {/* Modals - Only one can be open at a time */}
      <RegisterModal
        isOpen={activeModal === 'register'}
        onClose={() => setActiveModal(null)}
        onOpenHostModal={() => setActiveModal('host')}
        onSuccess={afterRegister}
        onSwitchToLogin={() => setActiveModal('login')}
      />
      <HostRegisterModal
        isOpen={activeModal === 'host'}
        onClose={() => setActiveModal(null)}
        onSuccess={afterRegister}
        onSwitchToLogin={() => setActiveModal('login')}
      />
      <LoginModal
        isOpen={activeModal === 'login'}
        onClose={() => setActiveModal(null)}
        onSuccess={afterLogin}
        onSwitchToRegister={() => setActiveModal('register')}
      />

      {/* Global Toast */}
      <Toast />
    </>
  );
}
