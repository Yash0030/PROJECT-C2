import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupsApi } from '../../../shared/api/index.js';
import styles from './ExplorePage.module.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const ICONS = {
  'general': 'groups', 'night-out': 'nightlife', 'local-issue': 'report',
  'festival': 'directions_run', 'new-here': 'waving_hand',
  'transit-delay': 'train', 'book-readers': 'auto_stories', 'alert': 'warning',
};
const TYPE_LABELS = {
  'general': 'General', 'night-out': 'Night Out', 'local-issue': 'Issue',
  'festival': 'Activity', 'new-here': 'New Here',
  'transit-delay': 'Transit', 'book-readers': 'Books', 'alert': 'Alert',
};

function expiresIn(iso) {
  const diff = new Date(iso) - Date.now();
  if (diff <= 0) return 'Expired';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function healthColor(h) {
  if (h > 75) return '#4caf7d';
  if (h > 40) return '#ff9800';
  return '#ff5252';
}

// Custom orange pin marker
function makeMarker(color = '#ff7a00') {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:14px;height:14px;border-radius:50%;
      background:${color};border:2px solid #0e0e0e;
      box-shadow:0 0 0 3px ${color}44;
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

// You marker (yellow)
const youMarker = L.divIcon({
  className: '',
  html: `<div style="
    width:16px;height:16px;border-radius:50%;
    background:#ffde56;border:2px solid #0e0e0e;
    box-shadow:0 0 0 5px rgba(255,222,86,0.25);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export default function ExplorePage() {
  const navigate  = useNavigate();
  const mapRef    = useRef(null);
  const mapInst   = useRef(null);
  const markersRef = useRef([]);
  const circleRef = useRef(null);
  const youRef    = useRef(null);

  const [tab, setTab]         = useState('nearby');
  const [groups, setGroups]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [radius, setRadius]   = useState(3);
  const [manualLoc, setManualLoc] = useState('');
  const [location, setLocation]   = useState(null);
  const [error, setError]         = useState(null);

  // Init map
  useEffect(() => {
    if (mapInst.current) return;

    const map = L.map(mapRef.current, {
      center: [20.5937, 78.9629],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    mapInst.current = map;

    // Get location
    navigator.geolocation?.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(loc);
        map.setView([loc.lat, loc.lng], 14);
      },
      () => setError('Location access denied — enter manually')
    );

    return () => { map.remove(); mapInst.current = null; };
  }, []);

  // When location changes — update you marker + circle
  useEffect(() => {
    if (!location || !mapInst.current) return;
    const map = mapInst.current;

    youRef.current?.remove();
    youRef.current = L.marker([location.lat, location.lng], { icon: youMarker }).addTo(map);

    circleRef.current?.remove();
    circleRef.current = L.circle([location.lat, location.lng], {
      radius: radius * 1000,
      color: '#ff7a00',
      fillColor: '#ff7a00',
      fillOpacity: 0.04,
      weight: 1,
      dashArray: '4 4',
    }).addTo(map);

    fetchGroups(location.lat, location.lng);
  }, [location]);

  // Update circle when radius changes
  useEffect(() => {
    if (!location || !mapInst.current) return;
    circleRef.current?.setRadius(radius * 1000);
    fetchGroups(location.lat, location.lng);
  }, [radius]);

  const fetchGroups = async (lat, lng) => {
    setLoading(true);
    setError(null);
    try {
      const data = await groupsApi.list(lat, lng, radius);
      setGroups(data);
      updateMarkers(data);
    } catch {
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const updateMarkers = (data) => {
    if (!mapInst.current) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = data.map(g => {
      if (!g.lat && !g.lng) return null;
      const color = g.isAlert ? '#ff5252' : '#ff7a00';
      const m = L.marker([g.lat, g.lng], { icon: makeMarker(color) })
        .addTo(mapInst.current)
        .bindPopup(`<b style="color:#e5e2e1">${g.name}</b>`, {
          className: 'lokaal-popup',
        });
      m.on('click', () => {
        document.getElementById(`group-${g.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
      return m;
    }).filter(Boolean);
  };

  const handleManualSearch = async () => {
    if (!manualLoc.trim()) return;
    setError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(manualLoc)}&format=json&limit=1`
      );
      const data = await res.json();
      if (data[0]) {
        const loc = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        setLocation(loc);
        mapInst.current?.setView([loc.lat, loc.lng], 14);
      } else {
        setError('Location not found');
      }
    } catch {
      setError('Search failed');
    }
  };

  const changeRadius = (d) => setRadius(r => Math.max(1, Math.min(10, r + d)));

  const focusOnMap = (g) => {
    if (!g.lat || !mapInst.current) return;
    mapInst.current.setView([g.lat, g.lng], 15, { animate: true });
  };

  return (
    <div className={styles.page}>

      {/* Map */}
      <div className={styles.mapArea}>
        <div ref={mapRef} className={styles.mapContainer} />
        <div className={styles.mapOverlayBottom} />

        {/* Search bar */}
        <div className={styles.searchBar}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#a78b7c' }}>search</span>
          <input
            className={styles.searchInput}
            placeholder="Search city, neighborhood…"
            value={manualLoc}
            onChange={e => setManualLoc(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
          />
          <button className={styles.locateBtn} onClick={() => {
            navigator.geolocation?.getCurrentPosition(pos => {
              const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              setLocation(loc);
              mapInst.current?.setView([loc.lat, loc.lng], 14);
            });
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>my_location</span>
          </button>
        </div>

        {/* Radius pill */}
        <div className={styles.radiusPill}>
          <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#a78b7c' }}>radar</span>
          <span className={styles.radiusLabel}>RADIUS</span>
          <span className={styles.radiusVal}>{radius} km</span>
          <div className={styles.radiusBtns}>
            <button className={styles.radiusStep} onClick={() => changeRadius(-1)}>−</button>
            <button className={styles.radiusStep} onClick={() => changeRadius(1)}>+</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {[
          { key: 'nearby', label: 'Near me' },
          { key: 'manual', label: 'Enter location' },
        ].map(t => (
          <button
            key={t.key}
            className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Manual input */}
      {tab === 'manual' && (
        <div className={styles.manualInput}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#a78b7c' }}>location_on</span>
          <input
            className={styles.manualInputField}
            placeholder="City, neighborhood or address…"
            value={manualLoc}
            onChange={e => setManualLoc(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
          />
          <button className={styles.goBtn} onClick={handleManualSearch}>Search</button>
        </div>
      )}

      {/* Section header */}
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>Signals nearby</span>
        <span className={styles.groupCount}>{groups.length} active</span>
      </div>

      {error  && <div className={styles.error}>{error}</div>}
      {loading && <div className={styles.loading}>Scanning area…</div>}

      {/* Groups list */}
      <div className={styles.groupsList}>
        {!loading && groups.length === 0 && !error && (
          <div className={styles.emptyState}>No signals in this area.<br/>Try increasing the radius.</div>
        )}
        {groups.map(g => (
          <div
            key={g.id}
            id={`group-${g.id}`}
            className={`${styles.groupCard} ${g.isAlert ? styles.alertCard : ''}`}
            onClick={() => navigate(`/groups/${g.id}`)}
            onMouseEnter={() => focusOnMap(g)}
          >
            <div className={styles.cardTop}>
              <div className={styles.cardAvatar}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: g.isAlert ? '#ff6b6b' : '#ff7a00' }}>
                  {ICONS[g.template] || 'groups'}
                </span>
              </div>
              <div className={styles.cardInfo}>
                <div className={styles.cardName}>{g.name}</div>
                <div className={styles.cardDesc}>{g.description || 'No description'}</div>
              </div>
            </div>
            <div className={styles.cardBadges}>
              <span className={`${styles.badge} ${styles.badgeDist}`}>
                <span className="material-symbols-outlined" style={{ fontSize: 11 }}>location_on</span>
                {g.distanceKm} km
              </span>
              <span className={`${styles.badge} ${styles.badgeMembers}`}>
                <span className="material-symbols-outlined" style={{ fontSize: 11 }}>group</span>
                {g.memberCount}{g.maxMembers < 9999 ? `/${g.maxMembers}` : ''}
              </span>
              <span className={`${styles.badge} ${g.isAlert ? styles.badgeAlert : styles.badgeType}`}>
                {TYPE_LABELS[g.template] || g.template}
              </span>
              <span className={`${styles.badge} ${styles.badgeExpires}`}>
                <span className="material-symbols-outlined" style={{ fontSize: 11 }}>schedule</span>
                {expiresIn(g.expiresAt)}
              </span>
            </div>
            <div className={styles.healthBar}>
              <div className={styles.healthFill} style={{ width: `${g.healthScore}%`, background: healthColor(g.healthScore) }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}