/**
 * Maps precise GPS coordinates to a neighborhood label.
 * Phase 1: static bounding boxes for Mumbai.
 * Phase 2: reverse-geocode via a maps API (OSM Nominatim / Google).
 */

const MUMBAI_NEIGHBORHOODS = [
  { name: 'Bandra West',      lat: [19.040, 19.068], lng: [72.820, 72.845] },
  { name: 'Bandra East',      lat: [19.040, 19.068], lng: [72.845, 72.870] },
  { name: 'Andheri West',     lat: [19.112, 19.145], lng: [72.815, 72.840] },
  { name: 'Andheri East',     lat: [19.112, 19.145], lng: [72.840, 72.880] },
  { name: 'Juhu',             lat: [19.090, 19.120], lng: [72.820, 72.840] },
  { name: 'Colaba',           lat: [18.898, 18.925], lng: [72.800, 72.832] },
  { name: 'Lower Parel',      lat: [18.993, 19.020], lng: [72.818, 72.840] },
  { name: 'Worli',            lat: [19.005, 19.035], lng: [72.808, 72.830] },
  { name: 'Dadar',            lat: [19.015, 19.040], lng: [72.836, 72.860] },
  { name: 'Kurla',            lat: [19.060, 19.090], lng: [72.870, 72.900] },
  { name: 'Powai',            lat: [19.110, 19.140], lng: [72.895, 72.930] },
  { name: 'Malad West',       lat: [19.175, 19.210], lng: [72.820, 72.852] },
  { name: 'Borivali',         lat: [19.215, 19.255], lng: [72.845, 72.880] },
  { name: 'Thane',            lat: [19.185, 19.250], lng: [72.955, 73.010] },
];

/**
 * Returns a human-readable neighborhood string for the given coords.
 * Falls back to "Mumbai Area" if no bounding box matched.
 */
export function toNeighborhood(lat, lng) {
  for (const n of MUMBAI_NEIGHBORHOODS) {
    if (lat >= n.lat[0] && lat <= n.lat[1] &&
        lng >= n.lng[0] && lng <= n.lng[1]) {
      return n.name;
    }
  }
  // Generic fallback — never expose raw coords to clients
  return 'Mumbai Area';
}

/**
 * Haversine distance in km between two lat/lng pairs.
 */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) { return deg * Math.PI / 180; }
