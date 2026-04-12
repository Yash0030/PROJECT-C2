import { useEffect, useState } from 'react';
import { joinApi } from '../../../shared/api/index.js';
import styles from './JoinRequestsPanel.module.css';

function timeAgo(iso) {
  const ms = Date.now() - new Date(iso);
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return `Intent submitted ${Math.floor(ms / 60000)}m ago`;
  if (h < 24) return `Intent submitted ${h}h ago`;
  return `Intent submitted ${Math.floor(h / 24) === 1 ? 'yesterday' : Math.floor(h / 24) + 'd ago'}`;
}

export default function JoinRequestsPanel({ groupId }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    joinApi.list(groupId)
      .then(r => { setRequests(r); setLoading(false); })
      .catch(() => setLoading(false));
  }, [groupId]);

  const decide = async (requestId, action) => {
    try {
      await joinApi.decide(groupId, requestId, action);
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch {}
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.groupCtx}>
          <div className={styles.dot} />
          <span className={styles.ctxLabel}>Active Requests</span>
        </div>
        <div className={styles.title}>Review anonymous intent and choose your cohort.</div>
      </div>

      {loading && <div className={styles.loading}>Loading requests…</div>}

      <div className={styles.list}>
        {requests.map(r => (
          <div key={r.id} className={styles.card}>
            <div style={{ flex: 1 }}>
              <div className={styles.reason}>"{r.reason}"</div>
              <div className={styles.time}>{timeAgo(r.created_at)}</div>
            </div>
            <div className={styles.actions}>
              <button className={styles.approveBtn} onClick={() => decide(r.id, 'approve')}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
              </button>
              <button className={styles.rejectBtn} onClick={() => decide(r.id, 'reject')}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>
        ))}

        {!loading && (
          <div className={styles.endRow}>
            <span className="material-symbols-outlined">history</span>
            <span className={styles.endLabel}>End of current queue</span>
          </div>
        )}
      </div>
    </div>
  );
}
