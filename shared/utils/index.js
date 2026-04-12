/**
 * Returns a human-readable "expires in X" string.
 */
export function expiresIn(expiresAt) {
  const ms = new Date(expiresAt) - Date.now();
  if (ms <= 0) return 'Expired';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 24) return `${Math.floor(h / 24)}d`;
  if (h > 0)  return `${h}h ${m}m`;
  return `${m}m`;
}

/**
 * Format distance nicely.
 */
export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

/**
 * Health score → label + colour class.
 */
export function healthLabel(score) {
  if (score >= 70) return { label: 'Healthy',  color: '#639922', bg: '#EAF3DE' };
  if (score >= 40) return { label: 'Moderate', color: '#BA7517', bg: '#FAEEDA' };
  return               { label: 'Tense',    color: '#A32D2D', bg: '#FCEBEB' };
}

/**
 * Template → display name.
 */
export const TEMPLATE_LABELS = {
  'general':       'General',
  'new-here':      "I'm New Here",
  'festival':      'Festival Crowd',
  'night-out':     'Night Out',
  'transit-delay': 'Transit Delay',
  'local-issue':   'Local Issue',
  'book-readers':  'Book Readers',
  'alert':         '🚨 Area Alert',
};

export function templateLabel(t) {
  return TEMPLATE_LABELS[t] || t;
}
