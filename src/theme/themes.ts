export type Theme = {
  name: string;
  isDark: boolean;
  bg: readonly [string, string, string];
  surface: string;
  surfBorder: string;
  text: string;
  sub: string;
  muted: string;
  a1: string;
  a2: string;
  a3: string;
  a4: string;
  heroGrad: readonly [string, string, string];
  cardBg: (i: number) => string;
  cardAccent: (i: number) => string;
};

export const THEMES: Record<'neonNight' | 'brightPop', Theme> = {
  neonNight: {
    name: 'Neon Night',
    isDark: true,
    bg: ['#07070f', '#0d0a1a', '#0a0f1e'],
    surface: 'rgba(255,255,255,0.04)',
    surfBorder: 'rgba(255,255,255,0.08)',
    text: '#fff',
    sub: 'rgba(255,255,255,0.55)',
    muted: 'rgba(255,255,255,0.3)',
    a1: '#00f0ff',
    a2: '#b44aff',
    a3: '#ff3d8a',
    a4: '#00ff88',
    heroGrad: ['#00f0ff', '#b44aff', '#ff3d8a'],
    cardBg: (i) =>
      ['rgba(0,240,255,0.10)', 'rgba(255,61,138,0.10)', 'rgba(0,255,136,0.08)', 'rgba(180,74,255,0.10)'][i % 4],
    cardAccent: (i) => ['#00f0ff', '#ff3d8a', '#00ff88', '#b44aff'][i % 4],
  },
  brightPop: {
    name: 'Bright Pop',
    isDark: false,
    bg: ['#faf7f2', '#fff5eb', '#f0f4ff'],
    surface: '#ffffff',
    surfBorder: 'rgba(0,0,0,0.06)',
    text: '#1a1625',
    sub: '#5a5270',
    muted: '#9890a8',
    a1: '#ff6b35',
    a2: '#7c3aed',
    a3: '#059669',
    a4: '#e11d48',
    heroGrad: ['#ff6b35', '#e11d48', '#7c3aed'],
    cardBg: (i) => ['#ffecd2', '#ede3fc', '#d5f5f0', '#ffe0e8'][i % 4],
    cardAccent: (i) => ['#ff6b35', '#7c3aed', '#059669', '#e11d48'][i % 4],
  },
};
