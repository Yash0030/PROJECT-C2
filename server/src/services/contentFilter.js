import pkg from 'bad-words';

const Filter = pkg.default || pkg;

const filter = new Filter();
// Add domain-specific blocked patterns
const BLOCKED_PATTERNS = [
  /\b(kill|murder|rape|bomb)\s+(you|him|her|them)\b/i,
  /\b(your\s+mom|ur\s+mom)\b/i,
];

/**
 * Returns true if the content should be blocked.
 */
export function isBlocked(text) {
  if (!text || typeof text !== 'string') return true;
  if (filter.isProfane(text)) return true;
  return BLOCKED_PATTERNS.some(p => p.test(text));
}

/**
 * Lightweight sentiment → toxicity score (0–100, higher = more toxic).
 * In production swap with a proper ML model.
 */
const TOXIC_WORDS = ['hate', 'stupid', 'idiot', 'moron', 'loser', 'ugly', 'die'];

export function toxicityScore(text) {
  if (!text) return 0;
  const lower = text.toLowerCase();
  const hits = TOXIC_WORDS.filter(w => lower.includes(w)).length;
  return Math.min(hits * 20, 100);
}
