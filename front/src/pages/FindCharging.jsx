import { useState, useEffect, useRef } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/Toast';

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function FindCharging({ onShowLanding, onLogout, onShowProfile }) {
  const { currentUser } = useAuth();
  const [step, setStep]                     = useState(() => sessionStorage.getItem('nc_fc_step') || 'init');
  const [chargingPref, setChargingPref]     = useState(() => sessionStorage.getItem('nc_fc_pref') || 'own');
  const [chargerType, setChargerType]       = useState('');
  const [vehicleType, setVehicleType]       = useState(() => sessionStorage.getItem('nc_fc_vtype') || '');
  const [currentBattery, setCurrentBattery] = useState(() => Number(sessionStorage.getItem('nc_fc_cbatt')) || 20);
  const [targetBattery, setTargetBattery]   = useState(() => Number(sessionStorage.getItem('nc_fc_tbatt')) || 80);
  const [hosts, setHosts]                   = useState([]);
  const [selectedHostId, setSelectedHostId] = useState(() => sessionStorage.getItem('nc_fc_shost') || null);
  const [requestStatus, setRequestStatus]     = useState(() => sessionStorage.getItem('nc_fc_rstat') || null);
  const [currentRequestId, setCurrentRequestId] = useState(() => sessionStorage.getItem('nc_fc_rid') || null);
  const [otp, setOtp]                         = useState(() => sessionStorage.getItem('nc_fc_otp') || null);
  const [userCoords, setUserCoords]           = useState(() => {
    const saved = sessionStorage.getItem('nc_fc_coords');
    return saved ? JSON.parse(saved) : { lat: 17.6917, lng: 83.1663 }; // Default: Gajuwaka
  });
  const mapRef            = useRef(null);
  const markersRef        = useRef(null);
  const routingControlRef = useRef(null);

  // Persistence Helper
  const updateFCState = (key, val) => {
    sessionStorage.setItem(`nc_fc_${key}`, typeof val === 'object' ? JSON.stringify(val) : val);
  };

  useEffect(() => { fetchHosts(); }, [chargingPref, chargerType]);

  // Persistence Auto-Saver
  useEffect(() => {
    updateFCState('step', step);
    updateFCState('pref', chargingPref);
    updateFCState('vtype', vehicleType);
    updateFCState('cbatt', currentBattery);
    updateFCState('tbatt', targetBattery);
    updateFCState('coords', userCoords);
    if (selectedHostId) updateFCState('shost', selectedHostId);
    if (requestStatus) updateFCState('rstat', requestStatus);
    if (currentRequestId) updateFCState('rid', currentRequestId);
    if (otp) updateFCState('otp', otp);
  }, [step, chargingPref, vehicleType, currentBattery, targetBattery, userCoords, selectedHostId, requestStatus, currentRequestId, otp]);

  // Status Polling Effect: Periodically checks if host has accepted/rejected/completed
  useEffect(() => {
    if (!currentRequestId || ['completed', 'rejected', 'cancelled'].includes(requestStatus)) return;

    let timerId;
    const poll = async () => {
      try {
        const { data } = await client.get(`/api/requests/status/${currentRequestId}?t=${Date.now()}`);
        if (data.success) {
          const newStatus = data.request.status;
          
          if (data.request.otp) {
             setOtp(data.request.otp);
          }

          if (newStatus !== requestStatus) {
            setRequestStatus(newStatus);
            if (newStatus === 'accepted') showToast('Host accepted your request!', 'success');
            else if (newStatus === 'rejected') showToast('Host declined the request.', 'error');
            else if (newStatus === 'started') showToast('Charging started! ⚡', 'success');
            else if (newStatus === 'completed') showToast('Charging completed! Enjoy your ride.', 'success');
          }
          
          if (['completed', 'rejected', 'cancelled'].includes(newStatus)) return;
        }
        timerId = setTimeout(poll, 3000);
      } catch (err) { 
        console.error('Poll failed:', err);
        timerId = setTimeout(poll, 5000);
      }
    };

    poll(); 
    return () => { if (timerId) clearTimeout(timerId); };
  }, [currentRequestId, requestStatus]);

  async function manualCheck() {
    if (!currentRequestId) return;
    try {
      showToast('Checking for host response...', 'info');
      const { data } = await client.get(`/api/requests/status/${currentRequestId}?t=${Date.now()}`);
      if (data.success) {
        if (data.request.otp) setOtp(data.request.otp);
        if (data.request.status !== requestStatus) {
           setRequestStatus(data.request.status);
           if (data.request.status === 'accepted') showToast('Request accepted!', 'success');
           else if (data.request.status === 'rejected') showToast('Request declined.', 'error');
           else if (data.request.status === 'completed') showToast('Charging completed!', 'success');
        } else {
           showToast('Request status: ' + (data.request.status || 'pending'), 'info');
        }
      }
    } catch (err) { 
        showToast('Check failed. Connection error.', 'error'); 
    }
  }

  async function fetchHosts() {
    try {
      const params = new URLSearchParams({ mode: chargingPref });
      if (chargingPref === 'need' && chargerType) params.set('chargerType', chargerType);
      const { data } = await client.get(`/api/hosts?${params}`);
      if (data.success) setHosts(data.hosts);
    } catch { setHosts([]); }
  }

  function detectLocation() {
    if (!navigator.geolocation) { showToast('Geolocation not supported', 'error'); return; }
    showToast('Detecting your location...', 'info');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(newCoords);
        fetchHosts();
        showToast('Location found!', 'success');
        setStep('results');
      },
      () => { 
        showToast('Using default location.', 'warning'); 
        fetchHosts(); 
        setStep('results'); 
      }
    );
  }

  const allFilteredHosts = hosts
    .filter(h => h.status === 'approved' && h.lat && h.lng)
    .map(h => ({ ...h, realDistance: getDistance(userCoords.lat, userCoords.lng, h.lat, h.lng) }))
    .filter(h => {
      const isSelected = selectedHostId && (h._id || h.id)?.toString() === selectedHostId.toString();
      const activeStatus = ['pending', 'accepted', 'started'].includes(requestStatus);
      if (activeStatus && isSelected) return true;
      return h.realDistance <= 5;
    });

  const filteredHosts = (['accepted', 'started'].includes(requestStatus) && selectedHostId)
    ? allFilteredHosts.filter(h => (h._id || h.id)?.toString() === selectedHostId.toString())
    : allFilteredHosts;

  useEffect(() => {
    if (step !== 'results') return;
    const L = window.L;
    if (!L) return;

    const timer = setTimeout(() => {
      const mapContainer = document.getElementById('charging-map-area');
      if (!mapContainer) return;

      if (!mapRef.current) {
        const map = L.map('charging-map-area').setView([userCoords.lat, userCoords.lng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap'
        }).addTo(map);
        markersRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;
      } else {
        mapRef.current.setView([userCoords.lat, userCoords.lng], 13);
      }

      markersRef.current.clearLayers();

      const userIcon = L.divIcon({
        className: '',
        html: '<div style="background:var(--info);width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 0 10px rgba(0,0,0,0.3);"></div>',
        iconSize: [20, 20], iconAnchor: [10, 10]
      });
      L.marker([userCoords.lat, userCoords.lng], { icon: userIcon }).bindPopup('Your Location').addTo(markersRef.current);

      filteredHosts.forEach(host => {
        const hostIcon = L.divIcon({
          className: '',
          html: `<div style="background:var(--primary);width:30px;height:30px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;color:white;font-size:14px;box-shadow:0 0 10px rgba(0,0,0,0.3);"><i class="fas fa-${host.setup === 'own' ? 'home' : 'charging-station'}"></i></div>`,
          iconSize: [36, 36], iconAnchor: [18, 18]
        });
        L.marker([host.lat, host.lng], { icon: hostIcon })
          .bindPopup(`<b>${host.name}</b><br/>${host.location}<br/>₹${host.price}/hr`)
          .addTo(markersRef.current);
      });

      if (['accepted', 'started'].includes(requestStatus) && filteredHosts.length > 0) {
        const targetHost = filteredHosts[0];
        if (routingControlRef.current) mapRef.current.removeControl(routingControlRef.current);
        routingControlRef.current = L.Routing.control({
          waypoints: [L.latLng(userCoords.lat, userCoords.lng), L.latLng(targetHost.lat, targetHost.lng)],
          lineOptions: { styles: [{ color: 'var(--primary)', opacity: 0.8, weight: 6 }] },
          addWaypoints: false, draggableWaypoints: false, fitSelectedRoutes: true, showAlternatives: false,
          createMarker: () => null
        }).addTo(mapRef.current);
      } else if (routingControlRef.current) {
        mapRef.current.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = null;
      }
    };
  }, [step, userCoords, hosts, requestStatus]);

  async function confirmRequest() {
    if (!selectedHostId || !vehicleType) { showToast('Select host & vehicle type', 'error'); return; }
    setRequestStatus('pending');
    try {
      const { data } = await client.post('/api/requests', {
        userId: currentUser?._id, hostId: selectedHostId,
        vehicleType, currentBattery, targetBattery
      });
      if (data.success) {
        setCurrentRequestId(data.request._id);
        showToast('Request sent! Waiting for host.', 'info');
      }
    } catch { 
      setRequestStatus(null); 
      showToast('Failed to send request', 'error'); 
    }
  }

  const openGoogleMapsOnHost = (host) => {
    if (!host || !userCoords) return;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${host.lat},${host.lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const clearChargingSession = () => {
    Object.keys(sessionStorage).forEach(k => { if(k.startsWith('nc_fc_')) sessionStorage.removeItem(k); });
    onShowLanding();
  };

  const chargers = ['type1', 'type2', 'ccs2', 'bharat'];

  return (
    <div className="find-charging-page">
      <div className="charging-header">
        <div className="charging-header-container">
          <div className="logo" onClick={onShowLanding}><i className="fas fa-bolt" /> <span className="logo-text">Near Charge</span></div>
          <div className="charging-header-actions">
            <span className="user-name" style={{ display: 'none' /* Will be managed by CSS if needed, but adding user-name-text */ }}>{currentUser?.name}</span>
            <span className="user-name-text" style={{ fontWeight: 600, color: 'var(--gray-600)' }}>{currentUser?.name}</span>
            <button className="btn btn-primary btn-sm" onClick={onShowProfile}>Profile</button>
            <button className="btn btn-outline btn-sm" onClick={onLogout}>Logout</button>
          </div>
        </div>
      </div>

      {step === 'init' && (
        <div className="charging-init">
          <h3>Do you have your own charger?</h3>
          <div className="user-type-selector charging-selector">
            {[
              { id: 'own',  icon: 'fa-plug', title: 'Yes, I have my charger', desc: "Show all hosts with compatible sockets." },
              { id: 'need', icon: 'fa-charging-station', title: 'No, I need a charger', desc: 'Show only hosts providing chargers.' }
            ].map(o => (
              <div key={o.id} className={`user-type-option ${chargingPref === o.id ? 'active' : ''}`} onClick={() => setChargingPref(o.id)}>
                <i className={`fas ${o.icon}`} /><h3>{o.title}</h3>
                <p>{o.desc}</p>
              </div>
            ))}
          </div>
          <div className="charging-filters" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {chargingPref === 'need' && (
              <div>
                <label>EV Charger Type</label>
                <div className="charger-type-section" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                  {chargers.map(c => (
                    <div key={c} className={`charger-type-card ${chargerType === c ? 'active' : ''}`} onClick={() => setChargerType(c)}>
                      <i className="fas fa-bolt" /><br />{c.toUpperCase()}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label>Vehicle Type</label>
              <select value={vehicleType} onChange={e => setVehicleType(e.target.value)}>
                <option value="">Select vehicle</option>
                <option value="bike">Bike</option><option value="scooty">Scooty</option><option value="car">Car</option>
              </select>
            </div>
            <div>
              <label>Current Battery %</label>
              <input type="number" value={currentBattery} onChange={e => setCurrentBattery(+e.target.value)} />
            </div>
            <div>
              <label>Target Battery %</label>
              <input type="number" value={targetBattery} onChange={e => setTargetBattery(+e.target.value)} />
            </div>
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '1rem' }} onClick={detectLocation}>
            <i className="fas fa-location-arrow" /> Detect My Location
          </button>
        </div>
      )}

      {step === 'results' && (
        <div className="charging-results">
          {requestStatus !== 'completed' && <button className="back-step" onClick={() => setStep('init')}><i className="fas fa-arrow-left" /> Back</button>}
          {requestStatus !== 'completed' && <div className="results-map" id="charging-map-area" style={{ height: 380 }} />}
          <div className="results-list">
            {requestStatus !== 'completed' && (
              <>
                <h4>{['accepted', 'started'].includes(requestStatus) ? 'Accepted Host' : `Nearby Hosts (${allFilteredHosts.length})`}</h4>
                <div className="request-list">
                  {filteredHosts.length === 0 && !['pending', 'accepted', 'started', 'completed'].includes(requestStatus) && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>No hosts found within 5km.</div>
                  )}
                  {filteredHosts.map(host => {
                    const distStr = host.realDistance < 1 ? Math.round(host.realDistance * 1000) + 'm' : host.realDistance.toFixed(1) + 'km';
                    const isSelected = selectedHostId && (host._id || host.id)?.toString() === selectedHostId.toString();
                    const isLocked = ['pending', 'accepted', 'started', 'completed'].includes(requestStatus);
                    return (
                      <div key={host._id || host.id} className={`host-list-item ${isSelected ? 'selected' : ''} ${isLocked && !isSelected ? 'disabled' : ''}`}
                        onClick={() => { if (!isLocked) { setSelectedHostId(host._id || host.id); setRequestStatus(null); } }}>
                        <div style={{ width: 50, height: 50, background: 'var(--primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                          <i className={`fas fa-${host.setup === 'own' ? 'home' : 'charging-station'}`} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4>{host.name}</h4>
                          <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>{host.location} • <strong>{distStr} away</strong></p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-dark)' }}>₹{host.price}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div className="charging-request-area">
              {requestStatus !== 'completed' && (
                <button className="btn btn-primary" disabled={!selectedHostId || !vehicleType || ['pending', 'accepted', 'started'].includes(requestStatus)} onClick={confirmRequest}>
                  {requestStatus === 'pending' ? 'Waiting for host response...' : ['accepted', 'started'].includes(requestStatus) ? '✓ Request Confirmed' : 'Request Charging'}
                </button>
              )}
              <div className="request-status">
                {!selectedHostId ? 'Select an available host.' : !vehicleType ? 'Select your vehicle type.' :
                 requestStatus === 'pending' ? <div style={{ textAlign: 'center' }}><p>Request sent...</p><button onClick={manualCheck} className="btn btn-sm">Refresh</button></div> :
                 requestStatus === 'accepted' ? (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', width: '100%' }}>
                     <div style={{ background: '#f0fdf4', color: '#166534', padding: '1.25rem', borderRadius: '16px', textAlign: 'center', width: '100%' }}>
                       <i className="fas fa-key" style={{ fontSize: '1.5rem', color: 'var(--primary)' }} /><br/>
                       <strong>Share OTP with Host on arrival:</strong>
                       <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '4px', margin: '0.5rem 0' }}>{otp || '----'}</div>
                       <p>Host: {allFilteredHosts.find(h => (h._id || h.id)?.toString() === selectedHostId.toString())?.name}<br/>
                          Location: {allFilteredHosts.find(h => (h._id || h.id)?.toString() === selectedHostId.toString())?.location}
                       </p>
                     </div>
                     <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => openGoogleMapsOnHost(allFilteredHosts.find(h => (h._id || h.id)?.toString() === selectedHostId.toString()))}>
                       Navigate in Google Maps
                     </button>
                     <button className="btn btn-outline btn-sm" style={{ width: '100%', color: 'var(--danger)' }} onClick={async () => {
                       if (!confirm('Cancel request?')) return;
                       try { await client.patch(`/api/requests/${currentRequestId}/status`, { status: 'cancelled' }); setRequestStatus('cancelled'); } catch { showToast('Error', 'error'); }
                     }}>Cancel Request</button>
                   </div>
                 ) :
                 requestStatus === 'started' ? (
                   <div style={{ background: '#eff6ff', padding: '1.5rem', borderRadius: '16px', textAlign: 'center', width: '100%' }}>
                     <h3>Reached the Host & Charging Started</h3>
                     <p>Wait for host to complete the session.</p>
                   </div>
                 ) :
                 requestStatus === 'completed' ? (
                    <div className="charging-completed-card" style={{ 
                      textAlign: 'center', 
                      background: 'white', 
                      padding: '4rem 2rem', 
                      borderRadius: '2rem', 
                      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                      border: '2px solid var(--primary-light)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '1.5rem',
                      width: '100%',
                      maxWidth: '500px',
                      margin: '2rem auto'
                    }}>
                      <div style={{ width: '80px', height: '80px', background: '#f0fdf4', color: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
                        <i className="fas fa-check" />
                      </div>
                      <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-dark)', margin: 0 }}>Charging Completed!</h2>
                      <p style={{ fontSize: '1.25rem', color: 'var(--gray-600)', margin: 0 }}>Enjoy the ride! ⚡✨</p>
                      <button className="btn btn-primary btn-lg" style={{ minWidth: '200px', height: '60px', fontSize: '1.25rem' }} onClick={clearChargingSession}>New Search</button>
                    </div>
                  ) : (requestStatus === 'cancelled' || requestStatus === 'rejected') ? (
                   <div style={{ textAlign: 'center' }}><p style={{ color: 'var(--danger)' }}>Request {requestStatus}.</p><button onClick={clearChargingSession}>New Search</button></div>
                 ) : 'Ready to send request.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
