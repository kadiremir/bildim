import React, { useMemo } from 'react';
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Rect, Circle, Ellipse, Path } from 'react-native-svg';

interface Props { width: number; height: number; }

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export function NightEarthSvg({ width, height }: Props) {
  const dots = useMemo(() => {
    const rng = seededRandom(7331);
    const result = [];
    // Dense cluster regions (Europe, East Asia, East Coast US)
    const clusters = [
      { cx: 0.55, cy: 0.35, spread: 0.14, count: 22 }, // Europe
      { cx: 0.78, cy: 0.32, spread: 0.12, count: 18 }, // East Asia
      { cx: 0.18, cy: 0.38, spread: 0.10, count: 14 }, // East US
      { cx: 0.48, cy: 0.52, spread: 0.10, count: 10 }, // Middle East
      { cx: 0.25, cy: 0.55, spread: 0.08, count:  8 }, // South America
      { cx: 0.55, cy: 0.60, spread: 0.09, count:  6 }, // Africa
    ];

    clusters.forEach(cl => {
      for (let i = 0; i < cl.count; i++) {
        const angle = rng() * Math.PI * 2;
        const dist  = rng() * cl.spread;
        const x = (cl.cx + Math.cos(angle) * dist) * width;
        const y = (cl.cy + Math.sin(angle) * dist) * height;
        const r = 0.6 + rng() * 1.6;
        const op = 0.35 + rng() * 0.65;
        const warm = rng();
        const color = warm > 0.6 ? '#fffbe8' : warm > 0.3 ? '#ffe9a0' : '#ffffff';
        result.push({ x, y, r, op, color });
      }
    });

    // Scattered background stars / isolated city lights
    for (let i = 0; i < 55; i++) {
      const x = rng() * width;
      const y = rng() * height * 0.85;
      const r = 0.3 + rng() * 0.9;
      const op = 0.15 + rng() * 0.4;
      result.push({ x, y, r, op, color: '#ffffff' });
    }

    return result;
  }, [width, height]);

  const w = width;
  const h = height;

  return (
    <Svg width={w} height={h} style={{ position: 'absolute', top: 0, left: 0 }}>
      <Defs>
        {/* Deep space background */}
        <RadialGradient id="space" cx="40%" cy="30%" r="80%">
          <Stop offset="0%"   stopColor="#0d1535" stopOpacity="1" />
          <Stop offset="60%"  stopColor="#06091c" stopOpacity="1" />
          <Stop offset="100%" stopColor="#020308" stopOpacity="1" />
        </RadialGradient>
        {/* Earth atmosphere glow — bottom */}
        <RadialGradient id="atm" cx="50%" cy="105%" r="65%">
          <Stop offset="0%"   stopColor="#1565c0" stopOpacity="0.7" />
          <Stop offset="40%"  stopColor="#0d3b7e" stopOpacity="0.45" />
          <Stop offset="100%" stopColor="#020308" stopOpacity="0" />
        </RadialGradient>
        {/* Milky-way diagonal haze */}
        <LinearGradient id="mw" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%"   stopColor="#1a2a5e" stopOpacity="0" />
          <Stop offset="40%"  stopColor="#1a2a5e" stopOpacity="0.18" />
          <Stop offset="100%" stopColor="#1a2a5e" stopOpacity="0" />
        </LinearGradient>
      </Defs>

      {/* Space base */}
      <Rect x="0" y="0" width={w} height={h} fill="url(#space)" />

      {/* Milky way haze */}
      <Rect x="0" y="0" width={w} height={h} fill="url(#mw)" />

      {/* City light dots */}
      {dots.map((d, i) => (
        <Circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.color} opacity={d.op} />
      ))}

      {/* Earth horizon glow */}
      <Rect x="0" y="0" width={w} height={h} fill="url(#atm)" />

      {/* Horizon arc */}
      <Ellipse
        cx={w * 0.5} cy={h + w * 0.38}
        rx={w * 1.05} ry={w * 0.55}
        fill="none"
        stroke="#2979ff"
        strokeWidth="1"
        opacity="0.35"
      />
    </Svg>
  );
}
