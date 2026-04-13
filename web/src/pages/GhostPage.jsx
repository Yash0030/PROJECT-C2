import { useEffect, useState } from 'react';
import { ghostApi } from '../../../shared/api/index.js';
import styles from './GhostPage.module.css';

const CIRCUMFERENCE = 2 * Math.PI * 90; // r=90 in a 200x200 viewBox

function scoreColor(s) {
  if (s >= 70) return '#bc13fe';
  if (s >= 40) return '#bc13fe';
  return '#ffb4ab';
}
function scoreStatus(s) {
  if (s >= 70) return 'Trusted';
  if (s >= 40) return 'Neutral';
  return 'Low Trust';
}

function fluxLabel(reason) {
  if (reason.includes('completed')) return 'Collective handshake';
  if (reason.includes('kicked'))    return 'Flagged echo';
  if (reason.includes('flag'))      return 'Sub-grid flag';
  return 'Node verification';
}
function fluxSub(reason, time) {
  const ago = timeAgo(time);
  return `${ago}`;
}
function timeAgo(iso) {
  const ms = Date.now() - new Date(iso);
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return `${Math.floor(ms / 60000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function GhostPage() {
  const [score, setScore]     = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rotationsLeft, setRotationsLeft] = useState(5);

  useEffect(() => {
    Promise.all([ghostApi.score(), ghostApi.history()])
      .then(([s, h]) => { setScore(s.score); setRotationsLeft(s.rotationsLeft); setHistory(h); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const [rotating, setRotating] = useState(false);
  
  const handleRotate = async () => {
    if (!window.confirm("This will permanently rotate your anonymous identities in all current groups. Continue?")) return;
    setRotating(true);
    try {
      await ghostApi.rotate();
      const s = await ghostApi.score();
      const h = await ghostApi.history();
      setScore(s.score);
      setRotationsLeft(s.rotationsLeft);
      setHistory(h);
      alert("Ghost ID successfully rotated!");
    } catch {
      alert("Failed to rotate identity.");
    } finally {
      setRotating(false);
    }
  };

  if (loading) return <div className={styles.page}><div className={styles.state}>Loading ghost trail…</div></div>;

  const pct = (score ?? 50) / 100;
  const offset = CIRCUMFERENCE * (1 - pct);
  const color = scoreColor(score ?? 50);

  return (
    <div className={styles.page}>
      <div style={{ textAlign: 'center' }}>
        <div className={styles.standingLabel}>Current Standing</div>

        {/* Score ring */}
        <div className={styles.ringWrap}>
          <svg className={styles.ring} viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="90" fill="none" stroke="var(--bg4)" strokeWidth="10" />
            <circle
              cx="100" cy="100" r="90"
              fill="none" stroke={color} strokeWidth="10"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div className={styles.ringInner}>
            <div className={styles.scoreNum}>{score ?? 50}</div>
            <div className={styles.scoreStatus}>{scoreStatus(score ?? 50)}</div>
          </div>
          <div className={styles.glowBg} />
        </div>

        <div className={styles.desc}>
          Your presence in the local grid is currently stabilized. Actions remain private.
        </div>
      </div>

      {/* System calibration */}
      <div className={`glass ${styles.calibCard}`}>
        <div className={styles.calibHeader}>
          <span className="material-symbols-outlined">info</span>
          <div className={styles.calibTitle}>System Calibration</div>
        </div>
        <div className={styles.calibRow}>
          <div className={styles.calibItem}>
            <div className={styles.calibIcon} style={{ background: 'rgba(188, 19, 254,0.12)' }}>
              <span className="material-symbols-outlined" style={{ color: '#bc13fe' }}>add_circle</span>
            </div>
            <div>
              <div className={styles.calibVal}>+3 points</div>
              <div className={styles.calibDesc}>For positive collective handshakes and verified contributions.</div>
            </div>
          </div>
          <div className={styles.calibItem}>
            <div className={styles.calibIcon} style={{ background: 'rgba(255, 0, 85,0.15)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>remove_circle</span>
            </div>
            <div>
              <div className={styles.calibVal}>-5 points</div>
              <div className={styles.calibDesc}>Triggered by sub-grid flags or kicks from active sectors.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent flux */}
      <div className={styles.fluxLabel}>Recent Flux</div>
      {history.length === 0 ? (
        <div className={styles.empty}>No events yet. Join groups to build your trail.</div>
      ) : (
        <div className={styles.fluxList}>
          {history.map((e, i) => (
            <div key={i} className={`glass ${styles.fluxItem}`}>
              <div className={styles.fluxLeft}>
                <div className={styles.fluxDot} style={{ background: e.delta >= 0 ? '#bc13fe' : 'var(--error)' }} />
                <div>
                  <div className={styles.fluxName}>{fluxLabel(e.reason)}</div>
                  <div className={styles.fluxSub}>{fluxSub(e.reason, e.created_at)}</div>
                </div>
              </div>
              <div className={styles.fluxDelta} style={{ color: e.delta >= 0 ? '#bc13fe' : 'var(--error)' }}>
                {e.delta >= 0 ? '+' : ''}{e.delta}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Shadow persistence */}
      <div className={`glass ${styles.shadowCard}`}>
        <div className={styles.shadowIcon}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>visibility_off</span>
        </div>
        <div className={styles.shadowTitle}>Shadow Persistence</div>
        <div className={styles.shadowDesc}>
          Your Ghost Trail is an encrypted ledger. No user, including administrators, can map these score changes back to specific people or places. Your identity remains absolute.
        </div>
        <button className={`${styles.rotateBtn} ${rotationsLeft <= 0 ? '' : 'btn-primary'}`} onClick={handleRotate} disabled={rotating || rotationsLeft <= 0} style={{ opacity: rotationsLeft <= 0 ? 0.5 : 1 }}>
          {rotating ? 'Rotating...' : `Rotate Ghost ID (${rotationsLeft}/5 left)`}
        </button>
      </div>
    </div>
  );
}
