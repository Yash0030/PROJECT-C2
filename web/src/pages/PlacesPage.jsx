import { useEffect, useState } from 'react';
import { placesApi } from '../../../shared/api/index.js';
import { useLocation } from '../../../shared/hooks/useLocation.js';
import styles from './PlacesPage.module.css';

function timeAgo(iso) {
  const ms = Date.now() - new Date(iso);
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return `${Math.floor(ms / 60000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function PlacesPage() {
  const { location, loading: locLoading } = useLocation();
  const [tips, setTips]             = useState([]);
  const [loading, setLoading]       = useState(false);
  const [showForm, setShowForm]     = useState(false);
  const [tipContent, setTipContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState(null);

  useEffect(() => {
    if (!location) return;
    setLoading(true);
    placesApi.listTips(location.lat, location.lng)
      .then(t => { setTips(t); setLoading(false); })
      .catch(() => setLoading(false));
  }, [location]);

  const handleSubmit = async () => {
    if (!tipContent.trim() || !location) return;
    setSubmitting(true); setError(null);
    try {
      const tip = await placesApi.submitTip(location.lat, location.lng, tipContent.trim());
      setTips(prev => [tip, ...prev]);
      setTipContent(''); setShowForm(false);
    } catch { setError('Failed to post. Try again.'); }
    finally { setSubmitting(false); }
  };

  const handleUpvote = async (id) => {
    try {
      const { upvotes } = await placesApi.upvoteTip(id);
      setTips(prev => prev.map(t => t.id === id ? { ...t, upvotes } : t));
    } catch {}
  };

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.hero}>
          <div className={styles.title}>City Whispers</div>
          <div className={styles.sub}>Real stories from the concrete. Anonymous tips left for those who know where to look.</div>
        </div>

        {locLoading && <div className={styles.state}>Getting location…</div>}
        {loading    && <div className={styles.state}>Loading whispers…</div>}

        {!loading && tips.length === 0 && location && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📍</div>
            <div className={styles.emptyTitle}>No tips yet</div>
            <div className={styles.emptySub}>Be the first to leave a local tip.</div>
          </div>
        )}

        <div className={styles.grid}>
          {tips.map(tip => (
            <div key={tip.id} className={styles.tipCard}>
              <span className={styles.neighborhood}>{tip.neighborhood}</span>
              <div className={styles.tipContent}>"{tip.content}"</div>
              <div className={styles.tipFooter}>
                <button className={styles.upvoteBtn} onClick={() => handleUpvote(tip.id)}>
                  <span className="material-symbols-outlined">arrow_upward</span>
                  {tip.upvotes}
                </button>
                <span className={styles.timeAgo}>{timeAgo(tip.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Tip FAB */}
      {location && (
        <button className={`${styles.fab} btn-primary`} onClick={() => setShowForm(true)}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>add</span>
          Add Tip
        </button>
      )}

      {/* Bottom sheet form */}
      {showForm && (
        <div className={styles.formOverlay} onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className={styles.formSheet}>
            <div className={styles.formTitle}>Drop a Whisper</div>
            <textarea
              className={styles.formTextarea}
              placeholder="Share a local secret about this area… (10–240 chars)"
              rows={4} maxLength={240}
              value={tipContent}
              onChange={e => setTipContent(e.target.value)}
              autoFocus
            />
            {error && <div className={styles.err}>{error}</div>}
            <div className={styles.formActions}>
              <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
              <button
                className={`${styles.submitBtn} btn-primary`}
                onClick={handleSubmit}
                disabled={submitting || tipContent.trim().length < 10}
              >
                {submitting ? 'Posting…' : 'Post Tip'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
