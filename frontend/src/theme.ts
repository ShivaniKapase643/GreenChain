export const theme = {
  colors: {
    background: '#f4fbf6',
    backgroundAlt: '#ffffff',
    surface: '#ffffff',
    surfaceSolid: '#ffffff',
    surfaceMuted: '#f0fdf4',
    border: '#dcfce7',
    borderStrong: '#bbf7d0',
    text: '#0b1f17',
    textSoft: '#3f6b54',
    textMuted: '#7f9a8b',
    primary: '#16a34a',
    primaryDeep: '#15803d',
    primarySoft: '#bbf7d0',
    secondary: '#0ea5e9',
    accent: '#22c55e',
    danger: '#dc2626',
    warning: '#f59e0b',
    success: '#16a34a',
    info: '#2563eb',
    overlay: 'rgba(11, 31, 23, 0.55)',
    shadow: '0 18px 40px rgba(20, 83, 45, 0.10)',
    shadowSoft: '0 8px 24px rgba(20, 83, 45, 0.06)',
  },
  radius: {
    xl: '24px',
    lg: '20px',
    md: '14px',
    sm: '10px',
  },
};

export const routeMeta = [
  { path: '/', label: 'Dashboard', icon: 'dashboard' },
  { path: '/emissions', label: 'Emissions', icon: 'eco' },
  { path: '/insights', label: 'AI Insights', icon: 'psychology' },
  { path: '/map', label: 'Live Map', icon: 'map' },
  { path: '/analytics', label: 'Analytics', icon: 'analytics' },
  { path: '/ml', label: 'ML Models', icon: 'smart_toy' },
  { path: '/score', label: 'Green Score', icon: 'star' },
] as const;

export const authRoutes = ['/auth/login', '/auth/register'];

// Indian city coordinates used by the live map.
export const CITY_COORDS: Record<string, [number, number]> = {
  Delhi: [28.6139, 77.209],
  Mumbai: [19.076, 72.8777],
  Pune: [18.5204, 73.8567],
  Bengaluru: [12.9716, 77.5946],
  Bangalore: [12.9716, 77.5946],
  Hyderabad: [17.385, 78.4867],
  Chennai: [13.0827, 80.2707],
  Kolkata: [22.5726, 88.3639],
  Bhubaneswar: [20.2961, 85.8245],
  Ahmedabad: [23.0225, 72.5714],
  Jaipur: [26.9124, 75.7873],
  Lucknow: [26.8467, 80.9462],
  Nagpur: [21.1458, 79.0882],
  Chandigarh: [30.7333, 76.7794],
  Surat: [21.1702, 72.8311],
  Indore: [22.7196, 75.8577],
  Bhopal: [23.2599, 77.4126],
  Kochi: [9.9312, 76.2673],
  Guwahati: [26.1445, 91.7362],
  Patna: [25.5941, 85.1376],
};

export const cityToCoords = (city: string): [number, number] | null => {
  if (!city) return null;
  const trimmed = city.trim();
  return CITY_COORDS[trimmed] ?? CITY_COORDS[trimmed.split(',')[0].trim()] ?? null;
};
