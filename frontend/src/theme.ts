export const theme = {
  colors: {
    background: '#04100c',
    backgroundAlt: '#0e1b16',
    surface: 'rgba(16, 32, 27, 0.82)',
    surfaceSolid: '#10211b',
    border: 'rgba(203, 244, 235, 0.14)',
    text: '#e2e8f0',
    textSoft: '#b2c6bc',
    textMuted: '#7b9188',
    primary: '#ccf5ec',
    primaryDeep: '#a8d7a5',
    secondary: '#709698',
    accent: '#b9d7a9',
    danger: '#d66f63',
    warning: '#c8dea8',
    success: '#9fc9a3',
    info: '#86a9aa',
    shadow: '0 22px 60px rgba(2, 10, 8, 0.42)',
  },
  radius: {
    xl: '28px',
    lg: '22px',
    md: '16px',
    sm: '12px',
  },
};

export const routeMeta = [
  { path: '/', label: 'Dashboard', icon: 'dashboard' },
  { path: '/emissions', label: 'Emissions', icon: 'eco' },
  { path: '/insights', label: 'Insights', icon: 'psychology' },
  { path: '/map', label: 'Map', icon: 'map' },
  { path: '/analytics', label: 'Analytics', icon: 'analytics' },
  { path: '/ml', label: 'ML', icon: 'smart_toy' },
  { path: '/score', label: 'Score', icon: 'star' },
] as const;

export const authRoutes = ['/auth/login', '/auth/register'];
