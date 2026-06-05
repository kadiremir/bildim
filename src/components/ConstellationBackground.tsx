import React, { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Line, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import Animated, { useSharedValue, useFrameCallback, useAnimatedProps } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../theme/themes';

/* ─── Web: canvas-based full animation ─── */
function ConstellationWeb({ th }: { th: Theme }) {
  const containerRef = useRef<View>(null);
  const thRef = useRef(th);
  thRef.current = th;

  const bgColors = th.isDark
    ? ['#07070f', '#0d0a1a', '#0a0f1e']
    : ['#faf7f2', '#fff5eb', '#f0f4ff'];

  useEffect(() => {
    // On web, containerRef.current is the underlying HTMLElement
    const container = (containerRef.current as unknown) as HTMLElement | null;
    if (!container) return;

    const bgDiv = document.createElement('div');
    bgDiv.style.cssText = `position:absolute;inset:0;background:linear-gradient(155deg,${bgColors[0]},${bgColors[1]} 40%,${bgColors[2]})`;
    container.appendChild(bgDiv);

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    let animId: number;

    function resize() {
      const w = container!.clientWidth || window.innerWidth;
      const h = container!.clientHeight || window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const W = () => canvas.width / dpr;
    const H = () => canvas.height / dpr;

    type Star = {
      baseX: number; baseY: number; x: number; y: number;
      size: number; layer: number; opacity: number; color: string;
      pulseSpeed: number; pulsePhase: number; driftX: number; driftY: number;
    };
    type Shooter = { x: number; y: number; vx: number; vy: number; life: number; decay: number; length: number; color: string };

    const layerDefs = [
      { count: 35, sizeMin: 1, sizeMax: 2.5, opacity: 0.3 },
      { count: 22, sizeMin: 1.5, sizeMax: 3.5, opacity: 0.5 },
      { count: 12, sizeMin: 2.5, sizeMax: 4.5, opacity: 0.8 },
    ];

    function makeColors() { const t = thRef.current; return [t.a1, t.a2, t.a3, t.a4]; }

    function makeStars(): Star[] {
      const out: Star[] = [];
      const colors = makeColors();
      layerDefs.forEach((ld, li) => {
        for (let i = 0; i < ld.count; i++) {
          const bx = Math.random() * W(), by = Math.random() * H();
          out.push({
            baseX: bx, baseY: by, x: bx, y: by,
            size: ld.sizeMin + Math.random() * (ld.sizeMax - ld.sizeMin),
            layer: li, opacity: ld.opacity * (0.5 + Math.random() * 0.5),
            color: colors[Math.floor(Math.random() * colors.length)],
            pulseSpeed: 1.5 + Math.random() * 3,
            pulsePhase: Math.random() * Math.PI * 2,
            driftX: (Math.random() - 0.5) * 0.3,
            driftY: (Math.random() - 0.5) * 0.15,
          });
        }
      });
      return out;
    }

    let stars = makeStars();
    const shooters: Shooter[] = [];
    let lastShoot = 0, t = 0, prevDark = thRef.current.isDark;

    function spawnShooter() {
      const c = makeColors();
      shooters.push({ x: Math.random() * W() * 0.6, y: Math.random() * H() * 0.4, vx: 2.5 + Math.random() * 3, vy: 1.5 + Math.random() * 2, life: 1, decay: 0.008 + Math.random() * 0.012, length: 25 + Math.random() * 35, color: c[Math.floor(Math.random() * c.length)] });
    }

    function draw() {
      const th = thRef.current;
      const w = W(), h = H();
      if (th.isDark !== prevDark) { stars = makeStars(); prevDark = th.isDark; }
      ctx.clearRect(0, 0, w, h); t += 0.016;

      // Update nebula bg div colors when theme changes
      bgDiv.style.background = `linear-gradient(155deg,${th.isDark ? '#07070f,#0d0a1a 40%,#0a0f1e' : '#faf7f2,#fff5eb 40%,#f0f4ff'})`;

      stars.forEach(s => {
        s.x = s.baseX + Math.sin(t * s.driftX + s.pulsePhase) * 12;
        s.y = s.baseY + Math.cos(t * s.driftY + s.pulsePhase) * 8;
      });

      const connDist = th.isDark ? 100 : 85;
      ctx.lineWidth = 0.5;
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          if (Math.abs(stars[i].layer - stars[j].layer) > 1) continue;
          const dx = stars[i].x - stars[j].x, dy = stars[i].y - stars[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connDist) {
            ctx.strokeStyle = stars[i].color;
            ctx.globalAlpha = (1 - dist / connDist) * 0.15 * (th.isDark ? 1 : 0.5);
            ctx.beginPath(); ctx.moveTo(stars[i].x, stars[i].y); ctx.lineTo(stars[j].x, stars[j].y); ctx.stroke();
          }
        }
      }

      stars.forEach(s => {
        const pulse = 0.6 + 0.4 * Math.sin(t * s.pulseSpeed + s.pulsePhase);
        const sz = s.size * pulse;
        if (s.layer >= 1) {
          const gs = sz * (th.isDark ? 4 : 2.5);
          const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, gs);
          g.addColorStop(0, s.color); g.addColorStop(1, 'transparent');
          ctx.globalAlpha = s.opacity * pulse * (th.isDark ? 0.25 : 0.12);
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.x, s.y, gs, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = s.opacity * pulse; ctx.fillStyle = s.color;
        ctx.beginPath(); ctx.arc(s.x, s.y, sz, 0, Math.PI * 2); ctx.fill();
        if (sz > 2.5) { ctx.globalAlpha = pulse * 0.9; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.x, s.y, sz * 0.35, 0, Math.PI * 2); ctx.fill(); }
      });

      lastShoot += 0.016;
      if (lastShoot > 3 + Math.random() * 4) { spawnShooter(); lastShoot = 0; }

      for (let i = shooters.length - 1; i >= 0; i--) {
        const ss = shooters[i];
        ss.x += ss.vx; ss.y += ss.vy; ss.life -= ss.decay;
        if (ss.life <= 0) { shooters.splice(i, 1); continue; }
        const tx = ss.x - ss.vx * ss.length / 3, ty = ss.y - ss.vy * ss.length / 3;
        const g = ctx.createLinearGradient(tx, ty, ss.x, ss.y);
        g.addColorStop(0, 'transparent'); g.addColorStop(1, ss.color);
        ctx.globalAlpha = ss.life * (th.isDark ? 0.7 : 0.4); ctx.strokeStyle = g; ctx.lineWidth = 1.5 * ss.life;
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(ss.x, ss.y); ctx.stroke();
        ctx.globalAlpha = ss.life * 0.8; ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(ss.x, ss.y, 1.5 * ss.life, 0, Math.PI * 2); ctx.fill();
      }

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      container.removeChild(canvas);
      container.removeChild(bgDiv);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View
      ref={containerRef}
      style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}
      pointerEvents="none"
    />
  );
}

/* ─── Native: SVG opacity-pulse ─── */
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

type StarDef = { x: number; y: number; r: number; layer: number; phase: number; speed: number };
type ConLine = { a: number; b: number };

function makeStarsNative(W: number, H: number): StarDef[] {
  return Array.from({ length: 80 }, () => {
    const layer = Math.random() < 0.6 ? 0 : Math.random() < 0.65 ? 1 : 2;
    return { x: Math.random() * W, y: Math.random() * H, r: layer === 0 ? 0.5 + Math.random() * 0.5 : layer === 1 ? 1 + Math.random() * 0.8 : 1.8 + Math.random() * 1.2, layer, phase: Math.random() * Math.PI * 2, speed: 0.0004 + Math.random() * 0.0006 };
  });
}

function makeLinesNative(stars: StarDef[], maxDist: number): ConLine[] {
  const lines: ConLine[] = [];
  for (let i = 0; i < stars.length; i++) {
    let c = 0;
    for (let j = i + 1; j < stars.length && c < 2; j++) {
      const dx = stars[i].x - stars[j].x, dy = stars[i].y - stars[j].y;
      if (Math.sqrt(dx * dx + dy * dy) < maxDist) { lines.push({ a: i, b: j }); c++; }
    }
  }
  return lines;
}

function StarDot({ star, clock }: { star: StarDef; clock: SharedValue<number> }) {
  const props = useAnimatedProps(() => {
    const pulse = Math.sin(clock.value * star.speed + star.phase);
    return { opacity: star.layer === 0 ? 0.15 + pulse * 0.08 : star.layer === 1 ? 0.35 + pulse * 0.15 : 0.6 + pulse * 0.25 };
  });
  return <AnimatedCircle cx={star.x} cy={star.y} r={star.r} fill="#ffffff" animatedProps={props} />;
}

function ConLineComp({ a, b, stars, clock }: { a: number; b: number; stars: StarDef[]; clock: SharedValue<number> }) {
  const sa = stars[a], sb = stars[b];
  const props = useAnimatedProps(() => ({ strokeOpacity: 0.04 + Math.sin(clock.value * 0.0003 + sa.phase) * 0.04 }));
  return <AnimatedLine x1={sa.x} y1={sa.y} x2={sb.x} y2={sb.y} stroke="#ffffff" strokeWidth={0.5} animatedProps={props} />;
}

function ConstellationNative({ th }: { th: Theme }) {
  const { width: W, height: H } = useWindowDimensions();
  const clock = useSharedValue(0);
  useFrameCallback((f) => { clock.value += f.timeSincePreviousFrame ?? 16; });
  const stars = React.useMemo(() => makeStarsNative(W, H), [W, H]);
  const lines = React.useMemo(() => makeLinesNative(stars, Math.min(W, H) * 0.22), [stars, W, H]);
  const bgColors = th.isDark ? (['#07070f', '#0d0a1a', '#0a0f1e'] as const) : (['#faf7f2', '#fff5eb', '#f0f4ff'] as const);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={bgColors} start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
      <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="nb1" cx="15%" cy="10%" r="40%"><Stop offset="0%" stopColor={th.a1} stopOpacity={th.isDark ? 0.06 : 0.04} /><Stop offset="100%" stopColor={th.a1} stopOpacity={0} /></RadialGradient>
          <RadialGradient id="nb2" cx="85%" cy="35%" r="35%"><Stop offset="0%" stopColor={th.a2} stopOpacity={th.isDark ? 0.05 : 0.04} /><Stop offset="100%" stopColor={th.a2} stopOpacity={0} /></RadialGradient>
          <RadialGradient id="nb3" cx="30%" cy="75%" r="38%"><Stop offset="0%" stopColor={th.a3} stopOpacity={th.isDark ? 0.04 : 0.03} /><Stop offset="100%" stopColor={th.a3} stopOpacity={0} /></RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={W} height={H} fill="url(#nb1)" />
        <Rect x={0} y={0} width={W} height={H} fill="url(#nb2)" />
        <Rect x={0} y={0} width={W} height={H} fill="url(#nb3)" />
        {th.isDark && lines.map((ln, i) => <ConLineComp key={i} a={ln.a} b={ln.b} stars={stars} clock={clock} />)}
        {th.isDark && stars.map((star, i) => <StarDot key={i} star={star} clock={clock} />)}
      </Svg>
    </View>
  );
}

/* ─── Export ─── */
export function ConstellationBackground({ th }: { th: Theme }) {
  if (Platform.OS === 'web') return <ConstellationWeb th={th} />;
  return <ConstellationNative th={th} />;
}
