import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect, Ellipse } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useFrameCallback,
  useAnimatedProps,
} from 'react-native-reanimated';

const AEllipse = Animated.createAnimatedComponent(Ellipse);

// ─── Arctic Ice palette — cool cyan / blue / ice-white over deep navy ─────────
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
  { cx: 0.22, cy: 0.1, rx: 0.58, ry: 0.44, col: '56,189,248', spd: 0.000028, ph: 0 },
  { cx: 0.7, cy: 0.08, rx: 0.5, ry: 0.4, col: '6,182,212', spd: 0.000024, ph: 2.1 },
  { cx: 0.5, cy: 0.48, rx: 0.62, ry: 0.5, col: '125,211,252', spd: 0.000021, ph: 1.0 },
  { cx: 0.16, cy: 0.68, rx: 0.5, ry: 0.38, col: '224,242,254', spd: 0.000031, ph: 4.0 },
  { cx: 0.82, cy: 0.6, rx: 0.46, ry: 0.4, col: '3,105,161', spd: 0.000019, ph: 3.2 },
  { cx: 0.58, cy: 0.24, rx: 0.44, ry: 0.34, col: '165,243,252', spd: 0.000034, ph: 0.5 },
  { cx: 0.38, cy: 0.82, rx: 0.55, ry: 0.4, col: '186,230,253', spd: 0.000026, ph: 1.7 },
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
    const ox = Math.sin(clock.value * cfg.spd + cfg.ph) * W * 0.13;
    const oy = Math.cos(clock.value * cfg.spd * 0.8 + cfg.ph * 1.3) * H * 0.11;
    return { cx: cfg.cx * W + ox, cy: cfg.cy * H + oy };
  });
  return (
    <AEllipse animatedProps={props} rx={cfg.rx * W} ry={cfg.ry * H} fill={`url(#${id})`} />
  );
}

/**
 * Persistent app-wide animated background (Arctic Ice aurora).
 * Mounted once at the app root so the animation never restarts between screens.
 */
export function AuroraBackground() {
  const { width: W, height: H } = useWindowDimensions();
  const clock = useSharedValue(0);

  useFrameCallback((frame) => {
    clock.value += frame.timeSincePreviousFrame ?? 16;
  });

  return (
    <View style={[StyleSheet.absoluteFill, styles.root]} pointerEvents="none">
      <Svg width={W} height={H}>
        <Defs>
          {BLOBS.map((b, i) => (
            <RadialGradient key={i} id={`aurora${i}`} cx="40%" cy="38%" r="65%">
              <Stop offset="0%" stopColor={`rgb(${b.col})`} stopOpacity={0.34} />
              <Stop offset="45%" stopColor={`rgb(${b.col})`} stopOpacity={0.13} />
              <Stop offset="100%" stopColor={`rgb(${b.col})`} stopOpacity={0} />
            </RadialGradient>
          ))}
          <RadialGradient id="auroraVignette" cx="50%" cy="42%" r="78%">
            <Stop offset="55%" stopColor="#000000" stopOpacity={0} />
            <Stop offset="100%" stopColor="#000000" stopOpacity={0.55} />
          </RadialGradient>
        </Defs>

        {/* deep frozen-navy base */}
        <Rect x={0} y={0} width={W} height={H} fill="#020c18" />

        {/* drifting ice-aurora clouds */}
        {BLOBS.map((b, i) => (
          <Blob key={i} clock={clock} W={W} H={H} cfg={b} id={`aurora${i}`} />
        ))}

        {/* soft vignette for depth */}
        <Rect x={0} y={0} width={W} height={H} fill="url(#auroraVignette)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: '#020c18', overflow: 'hidden' },
});
