import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ParticleField } from '../components/ParticleField';
import { ShimmerCard } from '../components/ShimmerCard';
import { hapticMedium, hapticLight } from '../utils/haptics';
import { playSound } from '../utils/sounds';

const CARD_GAP = 12;

type LandingLayout = {
  width: number;
  height: number;
  isSmall: boolean;
  isDesktop: boolean;
  columns: 1 | 2;
  sidePad: number;
  contentW: number;
  cardW: number;
};

function createLayout(width: number, height: number): LandingLayout {
  const isSmall = width < 380;
  const isDesktop = width >= 900;
  const columns: 1 | 2 = width >= 640 ? 2 : 1;
  const sidePad = isDesktop ? 56 : width >= 640 ? 32 : isSmall ? 16 : 20;
  const contentW = Math.max(1, Math.min(width - sidePad * 2, isDesktop ? 1040 : columns === 2 ? 760 : 420));
  const cardW = columns === 1 ? contentW : (contentW - CARD_GAP) / 2;

  return { width, height, isSmall, isDesktop, columns, sidePad, contentW, cardW };
}

const W = 390;
const H = 844;
const IS_DESKTOP = false;
const isSmall = false;
const SIDE_PAD = 20;
const CONTENT_W = 350;

function r(layout: LandingLayout, small: number, phone: number, desktop: number): number;
function r(small: number, phone: number, desktop: number): number;
function r(layoutOrSmall: LandingLayout | number, smallOrPhone: number, phoneOrDesktop: number, desktop?: number) {
  if (typeof layoutOrSmall === 'number') {
    return IS_DESKTOP ? phoneOrDesktop : isSmall ? layoutOrSmall : smallOrPhone;
  }

  return layoutOrSmall.isDesktop ? desktop : layoutOrSmall.isSmall ? smallOrPhone : phoneOrDesktop;
}

// ─── Responsive helpers ──────────────────────────────────────────────────────

// Scale helper: small / phone / desktop

// Side padding inside the content wrapper
// Usable content width after padding — cards are sized off this

// ─── Data ────────────────────────────────────────────────────────────────────
interface Category {
  id: string;
  emoji: string;
  label: string;
  sub: string;
  colors: readonly [string, string, ...string[]];
  glow: string;
  tag?: string;
  available: boolean;
}

const CATS: Category[] = [
  {
    id: 'countries',
    emoji: '🌍',
    label: 'Ülkeler',
    sub: 'Nadir gerçekler & gizli tarihler',
    colors: ['#1e1b4b', '#312e81', '#4338ca'],
    glow: '#6366f1',
    tag: 'OYNA',
    available: true,
  },
  {
    id: 'animals',
    emoji: '🦁',
    label: 'Hayvanlar',
    sub: 'Tuhaf ve büyüleyici canlılar',
    colors: ['#1c1917', '#292524', '#44403c'],
    glow: '#d97706',
    available: false,
  },
  {
    id: 'cities',
    emoji: '🏙️',
    label: 'Şehirler',
    sub: 'Kentsel efsaneler & silüetler',
    colors: ['#0c0a09', '#1c1917', '#292524'],
    glow: '#f97316',
    available: false,
  },
  {
    id: 'people',
    emoji: '🧠',
    label: 'Kişiler',
    sub: 'Tarihi değiştiren isimler',
    colors: ['#0f0b1e', '#1e1235', '#2d1a54'],
    glow: '#a855f7',
    available: false,
  },
];

const HOW_TO = [
  { icon: '🃏', title: 'İpucunu oku',      desc: 'Kart üzerinde nadir bir bilgi görünür'      },
  { icon: '👆', title: 'Kaydır ya da düşün', desc: 'Bildiğinde sağa kaydır'                   },
  { icon: '✍️', title: 'Cevabını yaz',     desc: 'Az ipucuyla daha fazla puan kazan'          },
];

// ─── Typewriter ──────────────────────────────────────────────────────────────
function useTypewriter(text: string, speed = 55, delay = 800) {
  const [out, setOut] = useState('');
  useEffect(() => {
    const t = setTimeout(() => {
      let i = 0;
      const iv = setInterval(() => {
        i++;
        setOut(text.slice(0, i));
        if (i >= text.length) clearInterval(iv);
      }, speed);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t);
  }, []);
  return out;
}

// ─── Pulsing glow ring ───────────────────────────────────────────────────────
function GlowRing({ color }: { color: string }) {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale,   { toValue: 1.14, duration: 1500, useNativeDriver: true }),
          Animated.timing(scale,   { toValue: 1,    duration: 1500, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0,    duration: 1500, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.45, duration: 1500, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: -4, left: -4, right: -4, bottom: -4,
        borderRadius: 28,
        borderWidth: 1.5,
        borderColor: color,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

// ─── Category card ───────────────────────────────────────────────────────────
function CategoryCard({ cat, onSelect, index, layout }: {
  cat: Category; onSelect: (id: string) => void; index: number; layout: LandingLayout;
}) {
  const enter      = useRef(new Animated.Value(0)).current;
  const press      = useRef(new Animated.Value(1)).current;
  const glowAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1, delay: 500 + index * 100,
      tension: 55, friction: 10, useNativeDriver: true,
    }).start();
  }, []);

  const onPressIn  = () => {
    if (!cat.available) return;
    hapticLight();
    Animated.parallel([
      Animated.spring(press,    { toValue: 0.93, tension: 300, friction: 10, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };
  const onPressOut = () => {
    Animated.parallel([
      Animated.spring(press,    { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  };
  const onPress    = () => {
    if (!cat.available) return;
    hapticMedium(); playSound('tap'); onSelect(cat.id);
  };

  const ty = enter.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });

  return (
    <Animated.View style={{ opacity: enter, transform: [{ translateY: ty }, { scale: press }], width: layout.cardW }}>
      <TouchableOpacity onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}
        activeOpacity={1} disabled={!cat.available}>
        <ShimmerCard style={{ borderRadius: 22 }} enabled={cat.available} shimmerColor="rgba(255,255,255,0.07)">
          <LinearGradient
            colors={cat.available ? cat.colors : ['#0f1117', '#171b24']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[
              s.cardGrad,
              {
                padding: layout.isDesktop ? 28 : r(layout, 16, 18, 28),
                minHeight: layout.isDesktop ? 238 : layout.columns === 1 ? 156 : 180,
                gap: layout.isDesktop ? 8 : 6,
              },
            ]}
          >
            {cat.available && <GlowRing color={cat.glow} />}

            {/* press glow */}
            <Animated.View pointerEvents="none" style={[
              StyleSheet.absoluteFill,
              { borderRadius: 22, backgroundColor: cat.glow,
                opacity: Animated.multiply(glowAnim, new Animated.Value(0.14)) },
            ]} />

            {/* tag row */}
            <View style={s.cardTagRow}>
              {cat.tag
                ? <View style={[s.liveTag, { backgroundColor: cat.glow + '30', borderColor: cat.glow + '60' }]}>
                    <Text style={[s.liveTagText, { color: cat.glow, fontSize: layout.isDesktop ? 10 : 9 }]}>{cat.tag}</Text>
                  </View>
                : <View style={[s.liveTag, s.soonTag]}>
                    <Text style={s.soonTagText}>YAKINDA</Text>
                  </View>
              }
            </View>

            <Text style={[s.cardEmoji, { fontSize: layout.isDesktop ? 44 : layout.columns === 1 ? 32 : 30 }, !cat.available && s.dim]}>{cat.emoji}</Text>
            <Text style={[s.cardLabel, { fontSize: layout.isDesktop ? 24 : layout.columns === 1 ? 18 : 17 }, !cat.available && s.dimText]} numberOfLines={1}>
              {cat.label}
            </Text>
            <Text style={[
              s.cardSub,
              { fontSize: layout.isDesktop ? 14 : 12, lineHeight: layout.isDesktop ? 21 : 17 },
              !cat.available && s.dimSub,
            ]} numberOfLines={2}>
              {cat.sub}
            </Text>

            {cat.available
              ? <LinearGradient colors={[cat.glow + '40', cat.glow + '18']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.playChip}>
                  <Text style={[s.playChipText, { color: '#c7d2fe' }]}>Oyna →</Text>
                </LinearGradient>
              : null}
          </LinearGradient>
        </ShimmerCard>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── How-to step ─────────────────────────────────────────────────────────────
function HowToStep({ icon, title, desc, index, last }: {
  icon: string; title: string; desc: string; index: number; last: boolean;
}) {
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1, delay: 1100 + index * 130,
      tension: 55, friction: 11, useNativeDriver: true,
    }).start();
  }, []);
  const ty = enter.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <Animated.View style={[s.howRow, { opacity: enter, transform: [{ translateY: ty }] }]}>
      <View style={s.howIconBox}>
        <Text style={s.howIconText}>{icon}</Text>
      </View>
      <View style={s.howTextBox}>
        <Text style={s.howTitle}>{title}</Text>
        <Text style={s.howDesc}>{desc}</Text>
      </View>
      {!last && <View style={s.howDivider} />}
    </Animated.View>
  );
}

// ─── Divider row ─────────────────────────────────────────────────────────────
function SectionDivider({ label }: { label: string }) {
  return (
    <View style={s.divRow}>
      <LinearGradient colors={['transparent', 'rgba(255,255,255,0.12)', 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.divLine} />
      <Text style={s.divLabel}>{label}</Text>
      <LinearGradient colors={['transparent', 'rgba(255,255,255,0.12)', 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.divLine} />
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function LandingScreen({ onSelect }: { onSelect: (id: string) => void }) {
  const { width, height } = useWindowDimensions();
  const layout = createLayout(width, height);
  const tagline     = useTypewriter('BİLGİNİ SINAVDA', 55, 350);
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroY       = useRef(new Animated.Value(-16)).current;
  const statsOp     = useRef(new Animated.Value(0)).current;
  const orbRotate   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroOpacity, { toValue: 1, duration: 700, delay: 150, useNativeDriver: true }),
      Animated.spring(heroY, { toValue: 0, delay: 150, tension: 55, friction: 10, useNativeDriver: true }),
    ]).start();
    Animated.timing(statsOp, { toValue: 1, duration: 600, delay: 800, useNativeDriver: true }).start();
    Animated.loop(
      Animated.timing(orbRotate, { toValue: 1, duration: 22000, useNativeDriver: true })
    ).start();
  }, []);

  const orbSpin = orbRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* Background */}
      <LinearGradient colors={['#06040F', '#09071A', '#0D0B22', '#06040F']}
        locations={[0, 0.3, 0.7, 1]} style={StyleSheet.absoluteFill} />

      {/* Rotating orb */}
      <Animated.View style={[s.bigOrb, { left: layout.width / 2 - 250, transform: [{ rotate: orbSpin }] }]}>
        <LinearGradient colors={['#4F46E5', '#7C3AED', '#EC4899', '#4F46E5']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <View style={s.glowTL} />
      <View style={s.glowBR} />

      <ParticleField />

      {/* Subtle horizontal grid lines */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: 9 }).map((_, i) => (
          <View key={i} style={[s.gridLine, { top: (layout.height / 8) * i }]} />
        ))}
      </View>

      <SafeAreaView style={s.safe}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Centering wrapper — caps content width on desktop */}
          <View style={[s.contentWrap, { maxWidth: layout.contentW, paddingHorizontal: 0 }]}>
          {/* ── Hero ── */}
          <Animated.View style={[
            s.hero,
            {
              opacity: heroOpacity,
              paddingTop: layout.isDesktop ? 52 : r(layout, 22, 28, 52),
              paddingBottom: layout.isDesktop ? 42 : r(layout, 24, 30, 42),
              transform: [{ translateY: heroY }],
            },
          ]}>
            <View style={s.tagRow}>
              <View style={s.tagDot} />
              <Text style={s.tagText} numberOfLines={1}>{tagline}</Text>
              <Text style={s.tagCursor}>|</Text>
            </View>

            <Text style={[
              s.heroTitle,
              {
                fontSize: layout.isDesktop ? 72 : r(layout, 38, 44, 72),
                lineHeight: layout.isDesktop ? 76 : r(layout, 43, 50, 76),
              },
            ]}>Bildim{'\n'}mi acaba?</Text>

            <LinearGradient
              colors={['transparent', '#6366f1', '#a855f7', '#ec4899', 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[s.underline, { width: layout.isDesktop ? 440 : Math.min(layout.contentW * 0.62, 260) }]}
            />

            <Text style={[
              s.heroSub,
              {
                fontSize: layout.isDesktop ? 18 : r(layout, 13, 14, 18),
                lineHeight: layout.isDesktop ? 30 : r(layout, 20, 22, 30),
              },
            ]}>
              Nadir ipuçları. Gizli gerçekler.{'\n'}Dünyayı ne kadar iyi tanıyorsun?
            </Text>
          </Animated.View>

          {/* ── Stats ── */}
          <Animated.View style={[
            s.statsRow,
            {
              opacity: statsOp,
              borderRadius: layout.isDesktop ? 20 : 16,
              paddingVertical: layout.isDesktop ? 22 : r(layout, 12, 14, 22),
              marginBottom: layout.isDesktop ? 40 : r(layout, 24, 30, 40),
            },
          ]}>
            {[
              { n: '10', label: 'Ülke'       },
              { n: '5',  label: 'İpucu'      },
              { n: '∞',  label: 'Sonsuz'     },
            ].map((item, i) => (
              <React.Fragment key={item.label}>
                <View style={s.statItem}>
                  <Text style={[s.statNum, { fontSize: layout.isDesktop ? 32 : r(layout, 20, 23, 32) }]}>{item.n}</Text>
                  <Text style={[s.statLabel, { fontSize: layout.isDesktop ? 13 : r(layout, 10, 11, 13) }]}>{item.label}</Text>
                </View>
                {i < 2 && <View style={s.statDivider} />}
              </React.Fragment>
            ))}
          </Animated.View>

          {/* ── Category grid ── */}
          <SectionDivider label="KATEGORİ SEÇ" />
          <View style={[
            s.grid,
            {
              gap: CARD_GAP,
              marginBottom: layout.isDesktop ? 48 : r(layout, 28, 34, 48),
              justifyContent: 'center',
            },
          ]}>
            {CATS.map((cat, i) => (
              <CategoryCard key={cat.id} cat={cat} onSelect={onSelect} index={i} layout={layout} />
            ))}
          </View>

          {/* ── How to play ── */}
          <SectionDivider label="NASIL OYNANIR" />
          <View style={[
            s.howCard,
            {
              borderRadius: layout.isDesktop ? 24 : 20,
              marginBottom: layout.isDesktop ? 48 : r(layout, 24, 30, 48),
            },
          ]}>
            {HOW_TO.map((step, i) => (
              <HowToStep key={step.title} {...step} index={i} last={i === HOW_TO.length - 1} />
            ))}
          </View>

          {/* ── Footer ── */}
          <View style={s.footer}>
            <LinearGradient colors={['#6366f1', '#a855f7', '#ec4899']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.footerDash} />
            <Text style={s.footerText}>Yeni kategoriler yakında geliyor</Text>
            <LinearGradient colors={['#6366f1', '#a855f7', '#ec4899']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.footerDash} />
          </View>

          <View style={{ height: 28 }} />
          </View>{/* end contentWrap */}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: '#06040F', overflow: 'hidden' },
  safe:  { flex: 1 },
  // Remove horizontal padding from ScrollView — contentWrap handles centering
  scroll: { alignItems: 'center' },
  // Centers and pads all content; on mobile adds explicit side margins
  contentWrap: {
    width: '100%',
    maxWidth: IS_DESKTOP ? CONTENT_W : undefined,
    paddingHorizontal: SIDE_PAD,
    alignSelf: 'center',
  },

  // Background
  bigOrb: {
    position: 'absolute',
    width: 500, height: 500, borderRadius: 250,
    top: -260, left: W / 2 - 250,
    opacity: 0.07, overflow: 'hidden',
  },
  glowTL: {
    position: 'absolute',
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(99,102,241,0.11)',
    top: -80, left: -60,
  },
  glowBR: {
    position: 'absolute',
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(168,85,247,0.09)',
    bottom: 20, right: -50,
  },
  gridLine: {
    position: 'absolute', left: 0, right: 0,
    height: 1, backgroundColor: 'rgba(255,255,255,0.022)',
  },

  // Hero
  hero: {
    paddingTop: IS_DESKTOP ? 48 : r(16, 20, 24),
    paddingBottom: IS_DESKTOP ? 40 : r(20, 24, 28),
    alignItems: 'center',
  },
  tagRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center',
    gap: 7, marginBottom: IS_DESKTOP ? 20 : r(12, 14, 16), height: 20,
  },
  tagDot: {
    width: IS_DESKTOP ? 7 : 5,
    height: IS_DESKTOP ? 7 : 5,
    borderRadius: IS_DESKTOP ? 3.5 : 2.5,
    backgroundColor: '#6366f1',
  },
  tagText: {
    color: 'rgba(165,180,252,0.85)',
    fontSize: IS_DESKTOP ? 12 : r(9, 10, 11),
    fontWeight: '700', letterSpacing: 2.5,
    flexShrink: 1,
  },
  tagCursor: { color: '#6366f1', fontSize: IS_DESKTOP ? 16 : 13, fontWeight: '300' },

  heroTitle: {
    color: '#FFFFFF',
    fontSize: IS_DESKTOP ? 68 : r(36, 42, 68),
    fontWeight: '900',
    letterSpacing: IS_DESKTOP ? -3 : r(-1, -1.5, -3),
    lineHeight: IS_DESKTOP ? 74 : r(42, 48, 74),
    marginBottom: r(8, 10, 14),
    textAlign: 'center',
  },
  underline: {
    height: IS_DESKTOP ? 3 : 2,
    borderRadius: 2,
    width: IS_DESKTOP ? '55%' : r('65%' as any, '70%' as any, '75%' as any),
    marginBottom: IS_DESKTOP ? 24 : r(14, 16, 20),
  },
  heroSub: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: IS_DESKTOP ? 18 : r(13, 14, 18),
    lineHeight: IS_DESKTOP ? 30 : r(20, 22, 30),
    fontWeight: '300',
    textAlign: 'center',
  },

  // Stats
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: IS_DESKTOP ? 20 : 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    paddingVertical: IS_DESKTOP ? 22 : r(12, 14, 16),
    marginBottom: IS_DESKTOP ? 40 : r(24, 28, 32),
  },
  statItem:    { alignItems: 'center', flex: 1 },
  statNum:     { color: '#fff', fontSize: IS_DESKTOP ? 32 : r(20, 22, 26), fontWeight: '900', letterSpacing: -0.5 },
  statLabel:   { color: 'rgba(255,255,255,0.32)', fontSize: IS_DESKTOP ? 13 : r(10, 11, 11), fontWeight: '600', marginTop: 3, letterSpacing: 0.5 },
  statDivider: { width: 1, height: IS_DESKTOP ? 40 : 28, backgroundColor: 'rgba(255,255,255,0.07)' },

  // Divider
  divRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: IS_DESKTOP ? 24 : r(14, 16, 18) },
  divLine:  { flex: 1, height: 1 },
  divLabel: { color: 'rgba(255,255,255,0.28)', fontSize: IS_DESKTOP ? 10 : 9, fontWeight: '800', letterSpacing: 2.5, flexShrink: 0 },

  // Grid — always strict 2×2, no space-between (use gap + fixed CARD_W)
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: CARD_GAP,
    marginBottom: IS_DESKTOP ? 48 : r(28, 32, 36),
    // Do NOT use justifyContent: 'space-between' — it breaks 2-col on desktop
  },
  cardGrad: {
    borderRadius: 22,
    padding: IS_DESKTOP ? 28 : r(14, 16, 18),
    minHeight: IS_DESKTOP ? 240 : r(160, 170, 185),
    gap: IS_DESKTOP ? 8 : r(4, 5, 6),
  },
  cardTagRow: { flexDirection: 'row', marginBottom: IS_DESKTOP ? 8 : r(4, 5, 6) },
  liveTag: {
    borderRadius: 7, borderWidth: 1,
    paddingHorizontal: IS_DESKTOP ? 10 : 8,
    paddingVertical: IS_DESKTOP ? 4 : 3,
    alignSelf: 'flex-start',
  },
  liveTagText: { fontSize: IS_DESKTOP ? 10 : 9, fontWeight: '800', letterSpacing: 1.5 },
  soonTag:     { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' },
  soonTagText: { color: 'rgba(255,255,255,0.22)', fontSize: IS_DESKTOP ? 10 : 9, fontWeight: '800', letterSpacing: 1.5 },
  cardEmoji:   { fontSize: IS_DESKTOP ? 44 : r(28, 30, 34), marginBottom: 4 },
  dim:         { opacity: 0.28 },
  cardLabel:   { color: '#fff', fontSize: IS_DESKTOP ? 24 : r(16, 17, 19), fontWeight: '800', letterSpacing: -0.4 },
  dimText:     { color: 'rgba(255,255,255,0.22)' },
  cardSub:     { color: 'rgba(255,255,255,0.48)', fontSize: IS_DESKTOP ? 14 : r(11, 11, 12), lineHeight: IS_DESKTOP ? 21 : r(15, 16, 17), flex: 1 },
  dimSub:      { color: 'rgba(255,255,255,0.14)' },
  playChip:    { borderRadius: 10, paddingHorizontal: IS_DESKTOP ? 14 : 10, paddingVertical: IS_DESKTOP ? 8 : 6, alignSelf: 'flex-start', marginTop: IS_DESKTOP ? 14 : r(6, 8, 10) },
  playChipText:{ fontSize: IS_DESKTOP ? 14 : r(11, 12, 13), fontWeight: '700' },

  // How-to
  howCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: IS_DESKTOP ? 24 : 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
    marginBottom: IS_DESKTOP ? 48 : r(24, 28, 32),
  },
  howRow:     { flexDirection: 'row', alignItems: 'center', padding: IS_DESKTOP ? 22 : r(14, 16, 18), gap: IS_DESKTOP ? 18 : 14, position: 'relative' },
  howIconBox: {
    width: IS_DESKTOP ? 56 : r(40, 44, 48),
    height: IS_DESKTOP ? 56 : r(40, 44, 48),
    borderRadius: IS_DESKTOP ? 16 : r(11, 12, 13),
    backgroundColor: 'rgba(99,102,241,0.12)',
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.22)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  howIconText: { fontSize: IS_DESKTOP ? 26 : r(18, 20, 22) },
  howTextBox:  { flex: 1 },
  howTitle:    { color: '#fff', fontSize: IS_DESKTOP ? 16 : r(13, 14, 15), fontWeight: '700', marginBottom: 3 },
  howDesc:     { color: 'rgba(255,255,255,0.38)', fontSize: IS_DESKTOP ? 14 : r(11, 12, 13), lineHeight: IS_DESKTOP ? 21 : r(16, 17, 18) },
  howDivider:  { position: 'absolute', bottom: 0, left: IS_DESKTOP ? 96 : r(68, 74, 82), right: 16, height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },

  // Footer
  footer:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 },
  footerDash:{ width: IS_DESKTOP ? 28 : 18, height: 2, borderRadius: 1 },
  footerText:{ color: 'rgba(255,255,255,0.18)', fontSize: IS_DESKTOP ? 13 : 11, fontWeight: '500', letterSpacing: 0.5 },
});
