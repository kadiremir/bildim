import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Rect,
  Ellipse,
  Circle,
  Path,
  G,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useFrameCallback,
  useAnimatedProps,
} from 'react-native-reanimated';

// ─── Animated SVG primitives ──────────────────────────────────────────────────
const AEllipse = Animated.createAnimatedComponent(Ellipse);
const ACircle = Animated.createAnimatedComponent(Circle);
const APath = Animated.createAnimatedComponent(Path);
const AG = Animated.createAnimatedComponent(G);

// ─── 3D field constants (mirrors the approved prototype) ──────────────────────
const Z_NEAR = 0.3;
const Z_FAR = 11.0;
const FOV = 0.7; // projection spread
const BASE_SPAN = 58; // wing half-span (px) at z = 1

type Bird = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  flapSpeed: number;
  flapPhase: number;
  flapAmp: number;
};

// Plain-JS factory used only at init (random place + count every session).
function makeBird(fresh: boolean): Bird {
  const z = fresh ? Z_NEAR + Math.random() * (Z_FAR - Z_NEAR) : Z_FAR;
  return {
    x: (Math.random() * 2 - 1) * 1.4,
    y: (Math.random() * 2 - 1) * 1.0,
    z,
    vx: (Math.random() * 2 - 1) * 0.0004,
    vy: (Math.random() * 2 - 1) * 0.0003,
    vz: -(0.0022 + Math.random() * 0.005), // always toward the camera
    flapSpeed: 0.004 + Math.random() * 0.004,
    flapPhase: Math.random() * Math.PI * 2,
    flapAmp: 0.8 + Math.random() * 0.4,
  };
}

// ─── Aurora cloud (soft drifting radial blob) ─────────────────────────────────
type BlobCfg = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  col: string;
  spd: number;
  ph: number;
};

const BLOBS: BlobCfg[] = [
  { cx: 0.72, cy: 0.3, rx: 0.55, ry: 0.42, col: '245,158,11', spd: 0.000033, ph: 0 },
  { cx: 0.3, cy: 0.18, rx: 0.46, ry: 0.36, col: '124,58,237', spd: 0.000029, ph: 2.1 },
  { cx: 0.5, cy: 0.6, rx: 0.55, ry: 0.44, col: '219,39,119', spd: 0.000027, ph: 1.0 },
  { cx: 0.15, cy: 0.72, rx: 0.44, ry: 0.35, col: '79,70,229', spd: 0.000036, ph: 3.2 },
  { cx: 0.88, cy: 0.7, rx: 0.42, ry: 0.34, col: '251,113,133', spd: 0.000025, ph: 0.5 },
  { cx: 0.45, cy: 0.38, rx: 0.4, ry: 0.32, col: '147,51,234', spd: 0.000041, ph: 4.0 },
];

function Blob({
  clock,
  W,
  H,
  cfg,
  id,
}: {
  clock: Animated.SharedValue<number>;
  W: number;
  H: number;
  cfg: BlobCfg;
  id: string;
}) {
  const props = useAnimatedProps(() => {
    const ox = Math.sin(clock.value * cfg.spd + cfg.ph) * W * 0.12;
    const oy = Math.cos(clock.value * cfg.spd * 0.8 + cfg.ph * 1.3) * H * 0.1;
    return { cx: cfg.cx * W + ox, cy: cfg.cy * H + oy };
  });
  return (
    <AEllipse animatedProps={props} rx={cfg.rx * W} ry={cfg.ry * H} fill={`url(#${id})`} />
  );
}

// ─── Single bird (path + depth opacity computed on the UI thread) ─────────────
function BirdPath({
  birds,
  clock,
  index,
  W,
  H,
}: {
  birds: Animated.SharedValue<Bird[]>;
  clock: Animated.SharedValue<number>;
  index: number;
  W: number;
  H: number;
}) {
  const props = useAnimatedProps(() => {
    const b = birds.value[index];
    if (!b) return { d: '', fillOpacity: 0 };

    const sx = W * 0.5 + (b.x / b.z) * W * FOV;
    const sy = H * 0.45 + (b.y / b.z) * H * FOV;
    const span = BASE_SPAN / b.z;

    const flap = Math.sin(clock.value * b.flapSpeed + b.flapPhase) * b.flapAmp;
    const up = flap * span * 0.55; // wingtip lift
    const body = span * 0.16; // body droop — wings stay horizontal

    const d =
      `M ${sx} ${sy}` +
      ` Q ${sx - span * 0.5} ${sy - up * 0.65} ${sx - span} ${sy - up}` +
      ` Q ${sx - span * 0.45} ${sy - up * 0.15 + body} ${sx} ${sy + body}` +
      ` Q ${sx + span * 0.45} ${sy - up * 0.15 + body} ${sx + span} ${sy - up}` +
      ` Q ${sx + span * 0.5} ${sy - up * 0.65} ${sx} ${sy} Z`;

    const t = (b.z - Z_NEAR) / (Z_FAR - Z_NEAR); // 0 near → 1 far
    const fillOpacity = 0.95 - 0.74 * t;
    return { d, fillOpacity };
  });

  return <APath animatedProps={props} fill="#0e0914" />;
}

// ─── Background ───────────────────────────────────────────────────────────────
export function BirdsBackground() {
  const { width: W, height: H } = useWindowDimensions();

  // Random count (scales with screen area) + random positions, fresh each mount.
  const count = useMemo(() => {
    const density = (W * H) / 24000;
    const n = Math.round(density * (0.7 + Math.random() * 0.6));
    return Math.max(18, Math.min(80, n));
  }, [W, H]);

  const initial = useMemo(
    () => Array.from({ length: count }, () => makeBird(true)),
    [count],
  );

  const birds = useSharedValue<Bird[]>(initial);
  const clock = useSharedValue(0);

  // Keep the field in sync if the screen resizes / count changes.
  React.useEffect(() => {
    birds.value = initial;
  }, [initial, birds]);

  // One UI-thread loop drives everything: advance birds toward the camera,
  // respawn any that pass through or leave the frustum.
  useFrameCallback((frame) => {
    const dt = frame.timeSincePreviousFrame ?? 16;
    const f = dt / 16.7;
    clock.value += dt;

    const arr = birds.value;
    for (let i = 0; i < arr.length; i++) {
      const b = arr[i];
      b.x += b.vx * f;
      b.y += b.vy * f;
      b.z += b.vz * f;

      const off =
        b.z < Z_NEAR ||
        b.z > Z_FAR ||
        Math.abs(b.x / b.z) > 2.0 ||
        Math.abs(b.y / b.z) > 1.7;

      if (off) {
        b.z = Z_FAR;
        b.x = (Math.random() * 2 - 1) * 1.4;
        b.y = (Math.random() * 2 - 1) * 1.0;
        b.vx = (Math.random() * 2 - 1) * 0.0004;
        b.vy = (Math.random() * 2 - 1) * 0.0003;
        b.vz = -(0.0022 + Math.random() * 0.005);
        b.flapPhase = Math.random() * Math.PI * 2;
        b.flapSpeed = 0.004 + Math.random() * 0.004;
        b.flapAmp = 0.8 + Math.random() * 0.4;
      }
    }
    birds.value = arr;
  });

  // Sun
  const sunX = W * 0.72;
  const sunY = H * 0.3;
  const sunPulse = useAnimatedProps(() => ({
    r: H * 0.2 * (1 + 0.04 * Math.sin(clock.value * 0.0006)),
  }));
  const rayRot = useAnimatedProps(() => ({
    rotation: (clock.value * 0.004) % 360,
  }));

  // Static god-ray geometry (relative to sun centre)
  const rays = useMemo(() => {
    const len = H * 0.55;
    const w = 0.05;
    return Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      const x1 = Math.cos(a - w) * len;
      const y1 = Math.sin(a - w) * len;
      const x2 = Math.cos(a + w) * len;
      const y2 = Math.sin(a + w) * len;
      return `M0 0 L${x1} ${y1} L${x2} ${y2} Z`;
    });
  }, [H]);

  return (
    <View style={[StyleSheet.absoluteFill, styles.root]} pointerEvents="none">
      <Svg width={W} height={H}>
        <Defs>
          {BLOBS.map((b, i) => (
            <RadialGradient key={i} id={`blob${i}`} cx="38%" cy="38%" r="65%">
              <Stop offset="0%" stopColor={`rgb(${b.col})`} stopOpacity={0.38} />
              <Stop offset="45%" stopColor={`rgb(${b.col})`} stopOpacity={0.14} />
              <Stop offset="100%" stopColor={`rgb(${b.col})`} stopOpacity={0} />
            </RadialGradient>
          ))}
          <RadialGradient id="sunHalo" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="rgb(255,236,190)" stopOpacity={0.55} />
            <Stop offset="18%" stopColor="rgb(255,210,140)" stopOpacity={0.3} />
            <Stop offset="45%" stopColor="rgb(251,146,60)" stopOpacity={0.12} />
            <Stop offset="100%" stopColor="rgb(251,146,60)" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="sunCore" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="rgb(255,250,235)" stopOpacity={0.95} />
            <Stop offset="60%" stopColor="rgb(255,232,180)" stopOpacity={0.7} />
            <Stop offset="100%" stopColor="rgb(255,210,150)" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="vignette" cx="50%" cy="45%" r="75%">
            <Stop offset="55%" stopColor="#000000" stopOpacity={0} />
            <Stop offset="100%" stopColor="#000000" stopOpacity={0.62} />
          </RadialGradient>
        </Defs>

        {/* deep twilight base */}
        <Rect x={0} y={0} width={W} height={H} fill="#0a0618" />

        {/* aurora clouds */}
        {BLOBS.map((b, i) => (
          <Blob key={i} clock={clock} W={W} H={H} cfg={b} id={`blob${i}`} />
        ))}

        {/* sun halo + rotating god rays + bright core */}
        <Circle cx={sunX} cy={sunY} r={H * 0.52} fill="url(#sunHalo)" />
        <G x={sunX} y={sunY}>
          <AG animatedProps={rayRot}>
            {rays.map((d, i) => (
              <Path key={i} d={d} fill="rgb(255,224,170)" fillOpacity={0.08} />
            ))}
          </AG>
        </G>
        <ACircle cx={sunX} cy={sunY} animatedProps={sunPulse} fill="url(#sunCore)" />

        {/* 3D birds */}
        {initial.map((_, i) => (
          <BirdPath key={i} birds={birds} clock={clock} index={i} W={W} H={H} />
        ))}

        {/* cinematic vignette */}
        <Rect x={0} y={0} width={W} height={H} fill="url(#vignette)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: '#0a0618', overflow: 'hidden' },
});
