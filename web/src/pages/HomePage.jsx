import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroupsStore } from '../../../shared/store/groupsStore.js';
import { useLocation } from '../../../shared/hooks/useLocation.js';
import GroupCard from '../components/GroupCard.jsx';
import styles from './HomePage.module.css';

export default function HomePage() {
  const navigate = useNavigate();
  const { location, error: locError, loading: locLoading } = useLocation();
  const { groups, loading, error, fetchNearby } = useGroupsStore();
  const [radiusKm, setRadiusKm] = useState(1);

  useEffect(() => {
    if (location) fetchNearby(location.lat, location.lng, radiusKm);
  }, [location, radiusKm]);

  const alerts  = groups.filter(g => g.isAlert);
  const regular = groups.filter(g => !g.isAlert);

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <h1 className={styles.title}>Explore Nearby</h1>
      </div>

      {/* Radius chips */}
      <div className={styles.radRow}>
        {[1, 2, 3, 5].map(r => (
          <button
            key={r}
            className={radiusKm === r ? styles.radBtnActive : styles.radBtn}
            onClick={() => setRadiusKm(r)}
          >
            {r}km
          </button>
        ))}
      </div>

      {locLoading && <div className={styles.state}>Getting your location…</div>}
      {locError   && <div className={styles.stateErr}>Enable location to see nearby groups.</div>}
      {loading    && <div className={styles.state}>Scanning the grid…</div>}
      {error      && <div className={styles.stateErr}>{error}</div>}

      {alerts.length > 0 && (
        <section>
          <div className={styles.sectionLabel}>🚨 Area Alerts</div>
          <div className={styles.list}>
            {alerts.map(g => <GroupCard key={g.id} group={g} />)}
          </div>
        </section>
      )}

      {regular.length > 0 && (
        <div className={styles.list}>
          {regular.map(g => <GroupCard key={g.id} group={g} />)}
        </div>
      )}

      {!loading && !locLoading && location && groups.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🌐</div>
          <div className={styles.emptyTitle}>No signals nearby</div>
          <div className={styles.emptySub}>Be the first to broadcast in your area.</div>
        </div>
      )}

      {/* FAB */}
      <button
        className={`${styles.createFab} btn-primary`}
        onClick={() => navigate('/groups/new')}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>add</span>
        Create
      </button>
    </div>
  );
}
