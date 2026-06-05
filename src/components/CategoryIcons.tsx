import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import Svg, {
  Circle, Ellipse, Rect, Path, Line, G, Defs,
  RadialGradient, LinearGradient, Stop, Text as SvgText,
} from 'react-native-svg';
import { Theme } from '../theme/themes';

type IconProps = { th: Theme; size?: number };

/* ─── Globe (Ülkeler) ─────────────────────────────────────────────── */
export function GlobeIcon({ th, size = 56 }: IconProps) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 20000, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pinAnim, { toValue: -3, duration: 700, useNativeDriver: true }),
        Animated.timing(pinAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    ).start();
    return () => { spinAnim.stopAnimation(); pinAnim.stopAnimation(); };
  }, [spinAnim, pinAnim]);

  const c = th.cardAccent(0);
  const c2 = th.a2;
  const c3 = th.a3;
  const c4 = th.a4;
  const S = size;
  const cx = S / 2;
  const cy = S * 0.45;
  const r = S * 0.36;

  return (
    <Svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
      <Defs>
        <RadialGradient id="gg" cx="35%" cy="30%" r="65%">
          <Stop offset="0%" stopColor="#fff" stopOpacity={th.isDark ? 0.3 : 0.2} />
          <Stop offset="100%" stopColor={c} stopOpacity={0.08} />
        </RadialGradient>
        <LinearGradient id="gs" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor={c} />
          <Stop offset="50%" stopColor={c2} />
          <Stop offset="100%" stopColor={c3} />
        </LinearGradient>
      </Defs>
      {/* shadow */}
      <Ellipse cx={cx} cy={S * 0.92} rx={r * 0.82} ry={S * 0.055} fill={c} fillOpacity={0.15} />
      {/* sphere */}
      <Circle cx={cx} cy={cy} r={r} fill="url(#gs)" fillOpacity={0.35} />
      <Circle cx={cx} cy={cy} r={r} fill="url(#gg)" />
      <Circle cx={cx} cy={cy} r={r} stroke={c} strokeWidth={1.5} strokeOpacity={0.5} fill="none" />
      {/* equator */}
      <Ellipse cx={cx} cy={cy} rx={r} ry={r * 0.24} stroke={c} strokeWidth={1} strokeOpacity={0.25} fill="none" />
      {/* parallels */}
      <Ellipse cx={cx} cy={cy - r * 0.35} rx={r * 0.88} ry={r * 0.2} stroke={c3} strokeWidth={0.8} strokeOpacity={0.2} fill="none" />
      <Ellipse cx={cx} cy={cy + r * 0.35} rx={r * 0.88} ry={r * 0.2} stroke={c4} strokeWidth={0.8} strokeOpacity={0.2} fill="none" />
      {/* continents */}
      <Path d={`M${cx-8} ${cy-6} Q${cx-4} ${cy-10} ${cx+2} ${cy-7} Q${cx+3} ${cy-3} ${cx} ${cy} Q${cx-6} ${cy-1} ${cx-8} ${cy-6}Z`} fill={c4} fillOpacity={0.55} />
      <Path d={`M${cx+4} ${cy-10} Q${cx+9} ${cy-11} ${cx+10} ${cy-5} Q${cx+9} ${cy-2} ${cx+6} ${cy-3} Q${cx+3} ${cy-5} ${cx+4} ${cy-10}Z`} fill={c2} fillOpacity={0.5} />
      <Path d={`M${cx+5} ${cy+2} Q${cx+10} ${cy+1} ${cx+11} ${cy+6} Q${cx+9} ${cy+9} ${cx+6} ${cy+8} Q${cx+4} ${cy+6} ${cx+5} ${cy+2}Z`} fill={c3} fillOpacity={0.45} />
      {/* highlight */}
      <Ellipse cx={cx - r * 0.25} cy={cy - r * 0.3} rx={r * 0.45} ry={r * 0.28} fill="#fff" fillOpacity={th.isDark ? 0.2 : 0.3} transform={`rotate(-20 ${cx - r * 0.25} ${cy - r * 0.3})`} />
      {/* pin */}
      <Animated.View
        style={{ position: 'absolute', top: S * 0.18, left: S * 0.56, transform: [{ translateY: pinAnim }] }}
      >
        <Svg width={10} height={10} viewBox="0 0 10 10">
          <Circle cx={5} cy={5} r={4} fill={c3} fillOpacity={0.85} />
          <Circle cx={5} cy={5} r={1.6} fill="#fff" fillOpacity={0.8} />
        </Svg>
      </Animated.View>
    </Svg>
  );
}

/* ─── Cityscape (Şehirler) ────────────────────────────────────────── */
export function CityscapeIcon({ th, size = 56 }: IconProps) {
  const blink1 = useRef(new Animated.Value(0.7)).current;
  const blink2 = useRef(new Animated.Value(0.5)).current;
  const moonPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blink1, { toValue: 0.15, duration: 800, useNativeDriver: true }),
        Animated.timing(blink1, { toValue: 0.7, duration: 800, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(blink2, { toValue: 0.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(blink2, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(moonPulse, { toValue: 1.2, duration: 2000, useNativeDriver: true }),
        Animated.timing(moonPulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, [blink1, blink2, moonPulse]);

  const c = th.cardAccent(1);
  const c2 = th.a2;
  const c3 = th.a3;
  const c4 = th.a4;
  const S = size;

  return (
    <Svg width={S} height={S} viewBox="0 0 48 48">
      <Defs>
        <LinearGradient id="cb" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={c} />
          <Stop offset="100%" stopColor={c2} stopOpacity={0.6} />
        </LinearGradient>
        <LinearGradient id="ct" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={c2} />
          <Stop offset="100%" stopColor={c3} stopOpacity={0.5} />
        </LinearGradient>
        <LinearGradient id="cs" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={c3} />
          <Stop offset="100%" stopColor={c4} stopOpacity={0.4} />
        </LinearGradient>
      </Defs>
      {/* ground */}
      <Ellipse cx={24} cy={44} rx={20} ry={4} fill={c} fillOpacity={0.08} />
      {/* moon */}
      <Circle cx={38} cy={8} r={4} fill={c4} fillOpacity={0.15} />
      <Circle cx={38} cy={8} r={2.5} fill={c4} fillOpacity={0.45} />
      {/* stars */}
      <Circle cx={8} cy={6} r={1} fill={c} fillOpacity={0.5} />
      <Circle cx={14} cy={4} r={0.7} fill={c2} fillOpacity={0.4} />
      {/* main tower */}
      <Rect x={17} y={6} width={11} height={34} rx={2.5} fill="url(#cb)" fillOpacity={0.65} />
      {/* windows center */}
      {[11, 15, 19, 23, 27, 31].map((y) => (
        <React.Fragment key={y}>
          <Rect x={19} y={y} width={3} height={2.5} rx={0.6} fill={th.isDark ? '#ffe066' : '#ffb938'} fillOpacity={0.7} />
          <Rect x={24} y={y} width={3} height={2.5} rx={0.6} fill={th.isDark ? '#66d9ff' : '#38b6ff'} fillOpacity={0.5} />
        </React.Fragment>
      ))}
      {/* left building */}
      <Rect x={4} y={18} width={11} height={22} rx={2} fill="url(#ct)" fillOpacity={0.55} />
      {[20, 24, 28, 33].map((y) => (
        <React.Fragment key={y}>
          <Rect x={6} y={y} width={2.5} height={2} rx={0.4} fill={th.isDark ? '#ffe066' : '#ffb938'} fillOpacity={0.55} />
          <Rect x={10.5} y={y} width={2.5} height={2} rx={0.4} fill={th.isDark ? '#a78bfa' : '#7c3aed'} fillOpacity={0.4} />
        </React.Fragment>
      ))}
      {/* right building */}
      <Rect x={30} y={14} width={10} height={26} rx={2} fill="url(#cs)" fillOpacity={0.5} />
      {[16, 20, 24, 28, 33].map((y) => (
        <Rect key={y} x={32} y={y} width={6} height={2} rx={0.5} fill={th.isDark ? '#86efac' : '#34d399'} fillOpacity={0.45} />
      ))}
      {/* antenna */}
      <Line x1={22.5} y1={6} x2={22.5} y2={2} stroke={c} strokeWidth={1.2} strokeOpacity={0.6} />
      <Circle cx={22.5} cy={1.5} r={1.2} fill={c4} fillOpacity={0.7} />
    </Svg>
  );
}

/* ─── Animal (Hayvanlar) ─────────────────────────────────────────── */
export function AnimalIcon({ th, size = 56 }: IconProps) {
  const earWiggle = useRef(new Animated.Value(0)).current;
  const eyeBlink = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(earWiggle, { toValue: 4, duration: 200, useNativeDriver: true }),
        Animated.timing(earWiggle, { toValue: -4, duration: 200, useNativeDriver: true }),
        Animated.timing(earWiggle, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.delay(2000),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.delay(3000),
        Animated.timing(eyeBlink, { toValue: 0.1, duration: 80, useNativeDriver: true }),
        Animated.timing(eyeBlink, { toValue: 1, duration: 80, useNativeDriver: true }),
      ])
    ).start();
  }, [earWiggle, eyeBlink]);

  const c = th.cardAccent(2);
  const c2 = th.a2;
  const c3 = th.a3;
  const S = size;

  return (
    <Svg width={S} height={S} viewBox="0 0 48 48">
      <Defs>
        <RadialGradient id="ag" cx="38%" cy="32%" r="65%">
          <Stop offset="0%" stopColor="#fff" stopOpacity={th.isDark ? 0.3 : 0.2} />
          <Stop offset="100%" stopColor={c} stopOpacity={0.08} />
        </RadialGradient>
        <LinearGradient id="af" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor={c} />
          <Stop offset="60%" stopColor={c2} />
          <Stop offset="100%" stopColor={c3} />
        </LinearGradient>
      </Defs>
      {/* shadow */}
      <Ellipse cx={24} cy={44} rx={13} ry={3} fill={c} fillOpacity={0.15} />
      {/* ears */}
      <Ellipse cx={13} cy={16} rx={5} ry={7} fill={c2} fillOpacity={0.6} />
      <Ellipse cx={35} cy={16} rx={5} ry={7} fill={c2} fillOpacity={0.6} />
      <Ellipse cx={13} cy={16} rx={3} ry={5} fill={c3} fillOpacity={0.55} />
      <Ellipse cx={35} cy={16} rx={3} ry={5} fill={c3} fillOpacity={0.55} />
      {/* head */}
      <Circle cx={24} cy={26} r={16} fill="url(#af)" fillOpacity={0.35} />
      <Circle cx={24} cy={26} r={16} fill="url(#ag)" />
      <Circle cx={24} cy={26} r={16} stroke={c} strokeWidth={1.5} strokeOpacity={0.45} fill="none" />
      {/* eyes */}
      <Circle cx={18} cy={23} r={4} fill={th.isDark ? '#0d0a1a' : '#fff'} fillOpacity={0.9} />
      <Circle cx={30} cy={23} r={4} fill={th.isDark ? '#0d0a1a' : '#fff'} fillOpacity={0.9} />
      <Circle cx={18.5} cy={22.5} r={2.5} fill={c} fillOpacity={0.9} />
      <Circle cx={30.5} cy={22.5} r={2.5} fill={c} fillOpacity={0.9} />
      <Circle cx={19.2} cy={21.8} r={1} fill="#fff" fillOpacity={0.9} />
      <Circle cx={31.2} cy={21.8} r={1} fill="#fff" fillOpacity={0.9} />
      {/* nose */}
      <Ellipse cx={24} cy={29} rx={4} ry={2.5} fill={c3} fillOpacity={0.7} />
      <Ellipse cx={24} cy={28.5} rx={3} ry={1.5} fill={c3} fillOpacity={0.4} />
      {/* nostrils */}
      <Circle cx={22.5} cy={29.5} r={0.9} fill={th.isDark ? '#0d0a1a' : '#1a1625'} fillOpacity={0.5} />
      <Circle cx={25.5} cy={29.5} r={0.9} fill={th.isDark ? '#0d0a1a' : '#1a1625'} fillOpacity={0.5} />
      {/* whiskers */}
      <Line x1={8} y1={28} x2={18} y2={29} stroke={c2} strokeWidth={0.8} strokeOpacity={0.5} />
      <Line x1={8} y1={31} x2={18} y2={30} stroke={c2} strokeWidth={0.8} strokeOpacity={0.4} />
      <Line x1={30} y1={29} x2={40} y2={28} stroke={c2} strokeWidth={0.8} strokeOpacity={0.5} />
      <Line x1={30} y1={30} x2={40} y2={31} stroke={c2} strokeWidth={0.8} strokeOpacity={0.4} />
      {/* highlight */}
      <Ellipse cx={17} cy={18} rx={8} ry={5} fill="#fff" fillOpacity={th.isDark ? 0.15 : 0.25} transform="rotate(-20 17 18)" />
    </Svg>
  );
}

/* ─── Person (Kişiler) ────────────────────────────────────────────── */
export function PersonIcon({ th, size = 56 }: IconProps) {
  const orbit1 = useRef(new Animated.Value(0)).current;
  const orbit2 = useRef(new Animated.Value(0)).current;
  const bulbPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(orbit1, { toValue: 1, duration: 4000, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.timing(orbit2, { toValue: 1, duration: 6000, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(bulbPulse, { toValue: 1.3, duration: 800, useNativeDriver: true }),
        Animated.timing(bulbPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [orbit1, orbit2, bulbPulse]);

  const c = th.cardAccent(3);
  const c2 = th.a2;
  const c3 = th.a3;
  const c4 = th.a4;
  const S = size;

  return (
    <Svg width={S} height={S} viewBox="0 0 48 48">
      <Defs>
        <RadialGradient id="pg" cx="36%" cy="30%" r="65%">
          <Stop offset="0%" stopColor="#fff" stopOpacity={th.isDark ? 0.3 : 0.2} />
          <Stop offset="100%" stopColor={c} stopOpacity={0.08} />
        </RadialGradient>
        <LinearGradient id="pf" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor={c} />
          <Stop offset="50%" stopColor={c2} />
          <Stop offset="100%" stopColor={c3} />
        </LinearGradient>
      </Defs>
      {/* shadow */}
      <Ellipse cx={24} cy={45} rx={13} ry={2.5} fill={c} fillOpacity={0.15} />
      {/* body */}
      <Path d="M10 45 Q10 34 24 32 Q38 34 38 45" fill="url(#pf)" fillOpacity={0.4} />
      <Path d="M10 45 Q10 34 24 32 Q38 34 38 45" stroke={c} strokeWidth={1} strokeOpacity={0.3} fill="none" />
      {/* head */}
      <Circle cx={24} cy={22} r={13} fill="url(#pf)" fillOpacity={0.4} />
      <Circle cx={24} cy={22} r={13} fill="url(#pg)" />
      <Circle cx={24} cy={22} r={13} stroke={c} strokeWidth={1.5} strokeOpacity={0.45} fill="none" />
      {/* hair */}
      <Path d="M12 20 Q12 10 24 9 Q36 10 36 20 Q34 14 24 13 Q14 14 12 20Z" fill={c2} fillOpacity={0.65} />
      {/* eyes */}
      <Circle cx={19} cy={22} r={2.5} fill={th.isDark ? '#0d0a1a' : '#fff'} fillOpacity={0.9} />
      <Circle cx={29} cy={22} r={2.5} fill={th.isDark ? '#0d0a1a' : '#fff'} fillOpacity={0.9} />
      <Circle cx={19.3} cy={21.7} r={1.5} fill={c} fillOpacity={0.9} />
      <Circle cx={29.3} cy={21.7} r={1.5} fill={c} fillOpacity={0.9} />
      <Circle cx={19.8} cy={21.2} r={0.6} fill="#fff" fillOpacity={0.9} />
      <Circle cx={29.8} cy={21.2} r={0.6} fill="#fff" fillOpacity={0.9} />
      {/* smile */}
      <Path d="M19 27 Q24 31 29 27" stroke={c3} strokeWidth={1.5} strokeLinecap="round" fill="none" strokeOpacity={0.7} />
      {/* highlight */}
      <Ellipse cx={17} cy={15} rx={7} ry={4.5} fill="#fff" fillOpacity={th.isDark ? 0.18 : 0.28} transform="rotate(-20 17 15)" />
      {/* sparkles around head */}
      <Circle cx={38} cy={10} r={2} fill={c4} fillOpacity={0.7} />
      <Circle cx={38} cy={10} r={1} fill="#fff" fillOpacity={0.9} />
      <Circle cx={12} cy={8} r={1.5} fill={c3} fillOpacity={0.6} />
      <Circle cx={12} cy={8} r={0.7} fill="#fff" fillOpacity={0.9} />
      {/* lightbulb top */}
      <Circle cx={24} cy={2} r={3} fill={c4} fillOpacity={0.55} />
      <Circle cx={24} cy={2} r={1.5} fill="#fff" fillOpacity={0.8} />
    </Svg>
  );
}

export const ICON_MAP: Record<string, React.ComponentType<IconProps>> = {
  countries: GlobeIcon,
  cities: CityscapeIcon,
  animals: AnimalIcon,
  people: PersonIcon,
};
