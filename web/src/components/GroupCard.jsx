import { useNavigate } from 'react-router-dom';
import { expiresIn, formatDistance, templateLabel, healthLabel } from '../../../shared/utils/index.js';
import styles from './GroupCard.module.css';

function statusInfo(group) {
  const msLeft = new Date(group.expiresAt) - Date.now();
  const hLeft = msLeft / 3_600_000;
  if (group.isAlert) return { label: 'ALERT', color: '#ffb4ab', dotColor: '#ffb4ab' };
  if (hLeft < 1)    return { label: 'ENDING SOON', color: '#ffb68b', dotColor: '#ff7a00' };
  const pct = group.memberCount / group.maxMembers;
  if (pct > 0.7)    return { label: 'TRENDING', color: '#ffde56', dotColor: '#ffde56' };
  return               { label: 'ACTIVE', color: '#4ade80', dotColor: '#4ade80' };
}

export default function GroupCard({ group }) {
  const navigate = useNavigate();
  const status = statusInfo(group);
  const tmpl = templateLabel(group.template);

  // Fake 2-3 avatar stacks + member count
  const shown = Math.min(group.memberCount, 3);
  const extra = group.memberCount > 3 ? `+${group.memberCount - 3}` : null;

  return (
    <div className={styles.card} onClick={() => navigate(`/groups/${group.id}`)}>
      {group.isAlert && <div className={styles.alertBar}>🚨 Emergency Area Alert</div>}

      <div className={styles.topRow}>
        <div>
          <div className={styles.name}>{group.name}</div>
          <div className={styles.locRow}>
            <span className="material-symbols-outlined">location_on</span>
            {group.neighborhood}
            {group.distanceKm != null && <span>• {formatDistance(group.distanceKm)}</span>}
          </div>
        </div>
        <div className={styles.statusBadge} style={{ color: status.color }}>
          <div className={styles.dot} style={{ background: status.dotColor, boxShadow: `0 0 6px ${status.dotColor}` }} />
          {status.label}
        </div>
      </div>

      {group.description && (
        <div className={styles.desc}>{group.description}</div>
      )}

      <div className={styles.tags}>
        <span className={styles.tag}>{tmpl}</span>
        {group.minGhostScore > 0 && (
          <span className={styles.tag} style={{ color: '#ff7a00', borderColor: 'rgba(255,122,0,0.3)' }}>
            Ghost {group.minGhostScore}+
          </span>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.membersRow}>
          <div className={styles.avatarStack}>
            {Array.from({ length: shown }).map((_, i) => (
              <div key={i} className={styles.avatarThumb} />
            ))}
            {extra && <div className={styles.avatarThumb}>{extra}</div>}
          </div>
          <span>{group.memberCount}/{group.maxMembers} JOINED</span>
        </div>
        <div className={styles.timeRow}>
          <span className="material-symbols-outlined">schedule</span>
          {expiresIn(group.expiresAt)} LEFT
        </div>
      </div>
    </div>
  );
}
