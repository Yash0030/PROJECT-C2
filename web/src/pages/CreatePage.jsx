import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupsApi } from '../../../shared/api/index.js';
import { useGroupsStore } from '../../../shared/store/groupsStore.js';
import { useLocation } from '../../../shared/hooks/useLocation.js';
import styles from './CreatePage.module.css';

const TEMPLATES = [
  { key: 'general',       label: 'General',       icon: 'groups' },
  { key: 'night-out',     label: 'Night Out',      icon: 'nightlife' },
  { key: 'local-issue',   label: 'Issue',          icon: 'report' },
  { key: 'festival',      label: 'Activity',       icon: 'directions_run' },
  { key: 'new-here',      label: "I'm New Here",   icon: 'waving_hand' },
  { key: 'transit-delay', label: 'Transit Delay',  icon: 'train' },
  { key: 'book-readers',  label: 'Book Readers',   icon: 'auto_stories' },
  { key: 'alert',         label: '🚨 Area Alert',  icon: 'warning' },
];

export default function CreatePage() {
  const navigate = useNavigate();
  const { location, loading: locLoading } = useLocation();
  const addGroup = useGroupsStore(s => s.addGroup);

  const [form, setForm] = useState({
    name: '', description: '', template: 'general',
    radiusKm: 5, lifetimeHours: 72, maxMembers: 12,
    minGhostScore: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!location) return setError('Location required');
    if (!form.name.trim()) return setError('Group name required');
    setSubmitting(true); setError(null);
    try {
      const group = await groupsApi.create({ ...form, lat: location.lat, lng: location.lng });
      addGroup(group);
      navigate(`/groups/${group.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create group');
    } finally { setSubmitting(false); }
  };

  const isAlert = form.template === 'alert';

  return (
    <div className={styles.page}>
      <div className={styles.title}>Create Signal</div>

      {/* Template */}
      <div className={styles.section}>
        <div className={styles.fieldLabel}>Group Type</div>
        <div className={styles.templateRow}>
          {TEMPLATES.map(t => (
            <button
              key={t.key}
              className={form.template === t.key ? styles.tplActive : styles.tpl}
              onClick={() => set('template', t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {isAlert && (
        <div className={styles.alertInfo}>
          🚨 <strong>Area Alert</strong> — open to everyone, auto-deletes in 6h. Use only for genuine local emergencies.
        </div>
      )}

      {/* Name */}
      <div className={styles.section}>
        <div className={styles.fieldLabel}>Group Name</div>
        <input
          className={styles.input}
          placeholder="Midnight Runners Club..."
          value={form.name}
          onChange={e => set('name', e.target.value)}
          maxLength={60}
        />
      </div>

      {/* Description / manifesto */}
      <div className={styles.section}>
        <div className={styles.fieldLabel}>Manifesto</div>
        <textarea
          className={styles.textarea}
          placeholder="What are the vibes? Who should join?"
          rows={3} maxLength={200}
          value={form.description}
          onChange={e => set('description', e.target.value)}
        />
      </div>

      {!isAlert && (
        <>
          {/* Steppers */}
          <div className={styles.section}>
            <div className={styles.fieldLabel}>Radius (km)</div>
            <div className={styles.stepperRow}>
              <div className={styles.stepper}>
                <div className={styles.stepperIcon}><span className="material-symbols-outlined">location_on</span></div>
                <div className={styles.stepperVal}>{form.radiusKm.toFixed(1)}</div>
                <div className={styles.stepperBtns}>
                  <button className={styles.stepperBtn} onClick={() => set('radiusKm', Math.min(5, form.radiusKm + 0.5))}>▲</button>
                  <button className={styles.stepperBtn} onClick={() => set('radiusKm', Math.max(0.5, form.radiusKm - 0.5))}>▼</button>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.fieldLabel}>Lifetime (Days)</div>
            <div className={styles.stepperRow}>
              <div className={styles.stepper}>
                <div className={styles.stepperIcon}><span className="material-symbols-outlined">schedule</span></div>
                <div className={styles.stepperVal}>{Math.round(form.lifetimeHours / 24)}</div>
                <div className={styles.stepperBtns}>
                  <button className={styles.stepperBtn} onClick={() => set('lifetimeHours', Math.min(120, form.lifetimeHours + 24))}>▲</button>
                  <button className={styles.stepperBtn} onClick={() => set('lifetimeHours', Math.max(24, form.lifetimeHours - 24))}>▼</button>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.fieldLabel}>Max Members</div>
            <div className={styles.stepperRow}>
              <div className={styles.stepper}>
                <div className={styles.stepperIcon}><span className="material-symbols-outlined">group</span></div>
                <div className={styles.stepperVal}>{form.maxMembers}</div>
                <div className={styles.stepperBtns}>
                  <button className={styles.stepperBtn} onClick={() => set('maxMembers', Math.min(40, form.maxMembers + 1))}>▲</button>
                  <button className={styles.stepperBtn} onClick={() => set('maxMembers', Math.max(2, form.maxMembers - 1))}>▼</button>
                </div>
              </div>
            </div>
          </div>

          {/* Ghost score */}
          <div className={styles.section}>
            <div className={styles.fieldLabel}>Min Ghost Score: <strong style={{ color: 'var(--primary)' }}>{form.minGhostScore}</strong></div>
            <div className={styles.sliderRow}>
              <input type="range" min={0} max={90} step={10} className={styles.slider}
                value={form.minGhostScore} onChange={e => set('minGhostScore', parseInt(e.target.value))} />
              <div className={styles.sliderLabels}><span>Open (0)</span><span>High trust (90)</span></div>
            </div>
          </div>
        </>
      )}

      {/* Live preview */}
      {form.name && (
        <div className={styles.section}>
          <div className={styles.fieldLabel}>Live Preview</div>
          <div className={styles.previewCard}>
            <div className={styles.previewTop}>
              <div className={styles.previewAvatar}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person</span>
              </div>
              <div>
                <div>
                  <span className={styles.previewName}>{form.name}</span>
                  <span className={styles.previewBadge}>Live Signal</span>
                </div>
                <div className={styles.previewBy}>by You · Active Now</div>
              </div>
            </div>
            {form.description && <div className={styles.previewDesc}>{form.description}</div>}
            <div className={styles.previewFooter}>
              <span className="material-symbols-outlined">location_on</span>
              {location ? 'Your area' : 'Getting location…'}
              &nbsp;·&nbsp;
              <span className="material-symbols-outlined">schedule</span>
              {form.lifetimeHours < 24 ? `${form.lifetimeHours}h` : `${form.lifetimeHours/24}d`}
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      {location && (
        <div className={styles.infoRow}>
          <span className="material-symbols-outlined">info</span>
          <span>
            Your signal will be broadcast to users within <strong>{form.radiusKm}km</strong>. It will automatically expire in <strong>{form.lifetimeHours < 24 ? `${form.lifetimeHours}h` : `${form.lifetimeHours/24} days`}</strong> unless extended.
          </span>
        </div>
      )}

      {error && <div className={styles.err}>{error}</div>}

      <button
        className={`${styles.submitBtn} btn-orange`}
        onClick={handleSubmit}
        disabled={submitting || !location || !form.name.trim()}
      >
        {submitting ? 'Broadcasting…' : isAlert ? '🚨 Broadcast Alert' : 'Create Signal'}
      </button>
    </div>
  );
}
