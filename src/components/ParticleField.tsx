import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: W, height: H } = Dimensions.get('window');

// ─── Star config ─────────────────────────────────────────────────────────────

interface StarDef {
  x: number;
  y: number;
  size: number;
  color: string;
  bright: boolean;
  mid: boolean;
  // animation params
  baseOpacity: number;
  peakOpacity: number;
  breathDuration: number;    // slow background breathe (ms)
  breathDelay: number;
  shinePeriod: number;       // how often a bright flash fires (ms)
  shineDelay: number;        // initial offset so not all flash at once
  shineDuration: number;     // how long the flash lasts (ms)
  driftAmpX: number;
  driftAmpY: number;
  driftDuration: number;
}

// Star colour palette — real stars range from hot blue-white to warm gold
const COLOURS = [
  '#FFFFFF',   // pure white       (most common)
  '#FFFFFF',
  '#FFFFFF',
  '#E8F4FF',   // cool white
  '#D0E8FF',   // blue-white
  '#C0D8FF',   // blue
  '#FFF8E8',   // warm white
  '#FFF0C0',   // yellow-white
  '#A8C8FF',   // soft blue (hot stars)
  '#FFE8B0',   // gold
];

function makeStar(): StarDef {
  const sizeRoll = Math.random();
  // Most sparkles tiny; a few medium; rare large
  const size =
    sizeRoll < 0.65 ? 0.5 + Math.random() * 0.5   // 0.5–1.0  (dim background)
    : sizeRoll < 0.90 ? 1.0 + Math.random() * 0.8  // 1.0–1.8  (medium)
    : 1.8 + Math.random() * 1.0;                    // 1.8–2.8  (bright)

  const bright = size > 1.8;
  const mid    = size > 1.0;

  return {
    x: Math.random() * W,
    y: Math.random() * H,
    size,
    bright,
    mid,
    color: COLOURS[Math.floor(Math.random() * COLOURS.length)],
    baseOpacity:    bright ? 0.35 : mid ? 0.15 : 0.06,
    peakOpacity:    bright ? 1.0  : mid ? 0.75 : 0.40,
    breathDuration: 2800 + Math.random() * 4000,
    breathDelay:    Math.random() * 4000,
    shinePeriod:    bright ? 3000 + Math.random() * 4000
                           : mid   ? 5000 + Math.random() * 8000
                                   : 8000 + Math.random() * 14000,
    shineDelay:     Math.random() * 10000,
    shineDuration:  bright ? 600 + Math.random() * 400
                           : 300 + Math.random() * 300,
    driftAmpX: (Math.random() - 0.5) * (bright ? 3 : 1.5),
    driftAmpY: -(4 + Math.random() * (bright ? 10 : 5)),
    driftDuration: 7000 + Math.random() * 12000,
  };
}

const STAR_COUNT = 60;
const STARS: StarDef[] = Array.from({ length: STAR_COUNT }, makeStar);

// ─── 4-pointed sparkle shape ─────────────────────────────────────────────────
// 4 border-trick triangles pointing outward from the center.
// Each arm tapers to a sharp point. No background, no SVG needed.

function SparkleShape({ size, color }: { size: number; color: string }) {
  const S    = size * 14;
  const arm  = S * 0.48;   // distance from center to tip
  const half = S * 0.10;   // half-width of arm base (narrower = sharper)
  const cx   = S / 2;

  return (
    <View style={{ width: S, height: S, backgroundColor: 'transparent' }}>
      {/* ▲ up */}
      <View style={{
        position: 'absolute', width: 0, height: 0,
        borderLeftWidth: half, borderRightWidth: half, borderBottomWidth: arm,
        borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: color,
        left: cx - half, top: cx - arm,
      }} />
      {/* ▼ down */}
      <View style={{
        position: 'absolute', width: 0, height: 0,
        borderLeftWidth: half, borderRightWidth: half, borderTopWidth: arm,
        borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: color,
        left: cx - half, top: cx,
      }} />
      {/* ► right */}
      <View style={{
        position: 'absolute', width: 0, height: 0,
        borderTopWidth: half, borderBottomWidth: half, borderLeftWidth: arm,
        borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: color,
        left: cx, top: cx - half,
      }} />
      {/* ◄ left */}
      <View style={{
        position: 'absolute', width: 0, height: 0,
        borderTopWidth: half, borderBottomWidth: half, borderRightWidth: arm,
        borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: color,
        left: cx - arm, top: cx - half,
      }} />
    </View>
  );
}

// ─── Single star ─────────────────────────────────────────────────────────────

function Star({ def }: { def: StarDef }) {
  const opacity  = useRef(new Animated.Value(def.baseOpacity)).current;
  const scale    = useRef(new Animated.Value(1)).current;
  const driftX   = useRef(new Animated.Value(0)).current;
  const driftY   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // ── 1. Slow breathe (always running) ──────────────────────────────────
    Animated.loop(
      Animated.sequence([
        Animated.delay(def.breathDelay),
        Animated.timing(opacity, {
          toValue: def.baseOpacity * 2.2,
          duration: def.breathDuration,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: def.baseOpacity,
          duration: def.breathDuration,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // ── 2. Occasional bright shine flash ──────────────────────────────────
    const scheduleShine = (delay: number) => {
      const t = setTimeout(() => {
        // Quick rise to peak, then fall back
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: def.peakOpacity,
            duration: def.shineDuration * 0.25,
            useNativeDriver: true,
          }),
          // Hold at peak very briefly
          Animated.delay(def.shineDuration * 0.1),
          Animated.timing(opacity, {
            toValue: def.baseOpacity,
            duration: def.shineDuration * 0.65,
            useNativeDriver: true,
          }),
        ]).start();

        // Scale pulse only for larger sparkles
        if (def.size > 1.0) {
          Animated.sequence([
            Animated.spring(scale, {
              toValue: 1 + (def.size > 1.8 ? 0.9 : 0.45),
              tension: 120,
              friction: 4,
              useNativeDriver: true,
            }),
            Animated.spring(scale, {
              toValue: 1,
              tension: 80,
              friction: 8,
              useNativeDriver: true,
            }),
          ]).start();
        }

        // Schedule next shine
        scheduleShine(def.shinePeriod + (Math.random() - 0.5) * def.shinePeriod * 0.4);
      }, delay);
      return t;
    };

    const shineTimer = scheduleShine(def.shineDelay);

    // ── 3. Gentle drift ───────────────────────────────────────────────────
    Animated.loop(
      Animated.sequence([
        Animated.timing(driftY, {
          toValue: def.driftAmpY,
          duration: def.driftDuration,
          useNativeDriver: true,
        }),
        Animated.timing(driftY, {
          toValue: 0,
          duration: def.driftDuration,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(driftX, {
          toValue: def.driftAmpX,
          duration: def.driftDuration * 0.7,
          useNativeDriver: true,
        }),
        Animated.timing(driftX, {
          toValue: -def.driftAmpX,
          duration: def.driftDuration * 0.7,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => clearTimeout(shineTimer);
  }, []);

  const span = def.size * 10;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: def.x - span / 2,
        top:  def.y - span / 2,
        backgroundColor: 'transparent',
        opacity,
        transform: [{ scale }, { translateX: driftX }, { translateY: driftY }],
      }}
    >
      <SparkleShape size={def.size} color={def.color} />
    </Animated.View>
  );
}

// ─── Milky Way band ───────────────────────────────────────────────────────────

function MilkyWayBand() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 8000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 8000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.75] });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity }]} pointerEvents="none">
      {/* Main galactic band — diagonal */}
      <LinearGradient
        colors={[
          'transparent',
          'rgba(180,210,255,0.025)',
          'rgba(200,225,255,0.055)',
          'rgba(180,210,255,0.025)',
          'transparent',
        ]}
        locations={[0, 0.3, 0.5, 0.7, 1]}
        start={{ x: 0.0, y: 0.15 }}
        end={{ x: 1.0, y: 0.85 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Secondary denser core */}
      <LinearGradient
        colors={[
          'transparent',
          'rgba(210,230,255,0.03)',
          'rgba(220,235,255,0.07)',
          'rgba(210,230,255,0.03)',
          'transparent',
        ]}
        locations={[0, 0.38, 0.5, 0.62, 1]}
        start={{ x: 0.1, y: 0.2 }}
        end={{ x: 0.9, y: 0.8 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

// ─── Exported field ───────────────────────────────────────────────────────────

export function ParticleField() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <MilkyWayBand />
      {STARS.map((def, i) => (
        <Star key={i} def={def} />
      ))}
    </View>
  );
}
