import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ShimmerCard } from '../components/ShimmerCard';
import { hapticMedium, hapticLight } from '../utils/haptics';
import { playSound } from '../utils/sounds';
import { countries, cities, animals } from '../data/categories';

const DATA_COUNTS: Record<string, number> = {
  countries: countries.length,
  cities: cities.length,
  animals: animals.length,
};

function itemStats(id: string, available: boolean): string {
  if (!available) return 'Yakında';
  const count = DATA_COUNTS[id] ?? 0;
  return `${count} içerik`;
}

const CARD_GAP = 32;

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
    id: 'cities',
    emoji: '🏙️',
    label: 'Şehirler TR',
    sub: 'Çocuklar için — Türkiye\'den şehirler',
    colors: ['#1a1200', '#2d1f00', '#78350f'],
    glow: '#f59e0b',
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
    setOut('');
    let iv: ReturnType<typeof setInterval> | undefined;
    const t = setTimeout(() => {
      let i = 0;
      iv = setInterval(() => {
        i++;
        setOut(text.slice(0, i));
        if (i >= text.length && iv) clearInterval(iv);
      }, speed);
    }, delay);
    return () => {
      clearTimeout(t);
      if (iv) clearInterval(iv);
    };
  }, [delay, speed, text]);
  return out;
}

// ─── Pulsing glow ring ───────────────────────────────────────────────────────
function GlowRing({ color }: { color: string }) {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const ringAnimation = Animated.loop(
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
    );
    ringAnimation.start();
    return () => ringAnimation.stop();
  }, [opacity, scale]);

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

  const bgImage =
    cat.id === 'countries' ? require('../../assets/categories/countries_bg.png') :
    cat.id === 'cities'    ? require('../../assets/categories/cities_tr_bg.png') :
    undefined;

  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1, delay: 500 + index * 100,
      tension: 55, friction: 10, useNativeDriver: true,
    }).start();
  }, [enter, index]);

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

  const CARD_HEIGHT = layout.isDesktop ? 238 : layout.columns === 1 ? 190 : 190;

  const cardStyle = [
    s.cardGrad,
    {
      padding: layout.isDesktop ? 28 : r(layout, 16, 18, 28),
      height: CARD_HEIGHT,
      gap: layout.isDesktop ? 8 : 6,
    },
  ];

  // GlowRing lives outside cardContent so it always positions relative to the full card
  const glowRing = cat.available ? <GlowRing color={cat.glow} /> : null;

  const cardContent = (
    <>
      <Animated.View pointerEvents="none" style={[
        StyleSheet.absoluteFill,
        { borderRadius: 22, backgroundColor: cat.glow,
          opacity: Animated.multiply(glowAnim, new Animated.Value(0.14)) },
      ]} />
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
      <Text style={[s.cardSub, { fontSize: layout.isDesktop ? 14 : 12, lineHeight: layout.isDesktop ? 21 : 17 }, !cat.available && s.dimSub]} numberOfLines={2}>
        {cat.sub}
      </Text>
      <LinearGradient
        colors={cat.available ? [cat.glow + '40', cat.glow + '18'] : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={s.playChip}
      >
        <Text style={[s.playChipText, { color: cat.available ? '#e2e8f0' : 'rgba(255,255,255,0.25)' }]}>
          {itemStats(cat.id, cat.available)}
        </Text>
      </LinearGradient>
    </>
  );

  return (
    <Animated.View style={{ opacity: enter, transform: [{ translateY: ty }, { scale: press }], width: layout.cardW }}>
      <TouchableOpacity onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}
        activeOpacity={1} disabled={!cat.available}>
        <ShimmerCard style={{ borderRadius: 22 }} enabled={cat.available} shimmerColor="rgba(255,255,255,0.07)">
          {(cat.id === 'countries' || cat.id === 'cities') ? (
            <ImageBackground
              source={bgImage}
              style={[cardStyle, { overflow: 'hidden', borderRadius: 22 }]}
              imageStyle={{ borderRadius: 22, width: '100%', height: '100%' }}
              resizeMode="stretch"
            >
              {glowRing}
              <LinearGradient
                colors={['rgba(4,6,20,0.55)', 'rgba(6,10,30,0.28)', 'rgba(3,6,20,0.62)']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <View style={{ position: 'relative', zIndex: 1, overflow: 'hidden' }}>
                {cardContent}
              </View>
            </ImageBackground>
          ) : (
            <LinearGradient
              colors={cat.available ? cat.colors : ['#0f1117', '#171b24']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={cardStyle}
            >
              {glowRing}
              <View style={{ position: 'relative', zIndex: 1, overflow: 'hidden' }}>
                {cardContent}
              </View>
            </LinearGradient>
          )}
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
  }, [enter, index]);
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

// ─── Stats bar ───────────────────────────────────────────────────────────────
const STATS = [
  { numeric: 4,    display: '4', label: 'farklı oyun', color: '#818cf8' },
  { numeric: 5,    display: '5', label: 'ipucu',       color: '#f59e0b' },
  { numeric: null, display: '∞', label: 'tekrar hakkı',color: '#34d399' },
];

function CountUp({ target, duration = 900, delay = 0, style }: {
  target: number; duration?: number; delay?: number; style?: any;
}) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    let raf: number;
    const timeout = setTimeout(() => {
      const step = (ts: number) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        setVal(Math.round(progress * target));
        if (progress < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(timeout); cancelAnimationFrame(raf); };
  }, [target, duration, delay]);
  return <Text style={style}>{val}</Text>;
}

function StatsBar({ layout }: { layout: LandingLayout }) {
  const anims  = useRef(STATS.map(() => new Animated.Value(0))).current;
  const glows  = useRef(STATS.map(() => new Animated.Value(0))).current;
  const infSpin = useRef(new Animated.Value(0)).current;
  const infPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // staggered slide-up entry
    Animated.parallel(
      anims.map((a, i) =>
        Animated.spring(a, { toValue: 1, delay: 500 + i * 150, tension: 55, friction: 9, useNativeDriver: true })
      )
    ).start();

    // staggered glow flash after entry
    glows.forEach((g, i) => {
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(g, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(g, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]).start();
      }, 900 + i * 150);
    });

    // ∞ rotate + pulse loop
    const spin = Animated.loop(
      Animated.timing(infSpin, { toValue: 1, duration: 4000, useNativeDriver: true })
    );
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(infPulse, { toValue: 1.22, duration: 800, useNativeDriver: true }),
        Animated.timing(infPulse, { toValue: 1,    duration: 800, useNativeDriver: true }),
      ])
    );
    spin.start(); pulse.start();
    return () => { spin.stop(); pulse.stop(); };
  }, [anims, glows, infSpin, infPulse]);

  const fontSize = layout.isDesktop ? 30 : 24;

  return (
    <View style={[sb.row, { marginBottom: layout.isDesktop ? 32 : r(layout, 16, 20, 32) }]}>
      {STATS.map((stat, i) => {
        const ty = anims[i].interpolate({ inputRange: [0, 1], outputRange: [24, 0] });
        const glowOp = glows[i].interpolate({ inputRange: [0, 1], outputRange: [0, 0.6] });
        const isInfinity = stat.numeric === null;

        return (
          <React.Fragment key={stat.label}>
            <Animated.View style={[sb.cell, { opacity: anims[i], transform: [{ translateY: ty }] }]}>
              {/* glow flash behind value */}
              <Animated.View pointerEvents="none" style={[
                sb.glow, { backgroundColor: stat.color, opacity: glowOp }
              ]} />

              {isInfinity ? (
                <Animated.Text style={[
                  sb.value, { fontSize, color: stat.color },
                  { transform: [{ scale: infPulse }] },
                ]}>
                  {stat.display}
                </Animated.Text>
              ) : (
                <CountUp
                  target={stat.numeric!}
                  duration={700}
                  delay={500 + i * 150}
                  style={[sb.value, { fontSize, color: stat.color }]}
                />
              )}

              <Text style={[sb.label, { fontSize: layout.isDesktop ? 12 : 10 }]}>
                {stat.label}
              </Text>
            </Animated.View>
            {i < STATS.length - 1 && <View style={sb.divider} />}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const sb = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 18,
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  cell:    { flex: 1, alignItems: 'center', gap: 6, position: 'relative' },
  glow:    { position: 'absolute', width: 60, height: 60, borderRadius: 30, top: -10 },
  value:   { fontWeight: '900', letterSpacing: -0.5 },
  label:   { color: 'rgba(255,255,255,0.38)', fontWeight: '600', letterSpacing: 0.3 },
  divider: { width: 1, height: 48, backgroundColor: 'transparent' },
});

// ─── Main ─────────────────────────────────────────────────────────────────────
export function LandingScreen({ onSelect }: { onSelect: (id: string) => void }) {
  const { width, height } = useWindowDimensions();
  const layout = createLayout(width, height);
  const tagline     = useTypewriter('DÜŞÜN · BİL · KAZAN', 55, 350);
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
    const spinAnimation = Animated.loop(
      Animated.timing(orbRotate, { toValue: 1, duration: 22000, useNativeDriver: true })
    );
    spinAnimation.start();
    return () => spinAnimation.stop();
  }, [heroOpacity, heroY, orbRotate, statsOp]);

  const orbSpin = orbRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />


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
            ]}>Bildim!</Text>

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
              İpuçlarını oku, cevabı bul.{'\n'}Kaç ipucunda bileceksin?
            </Text>
          </Animated.View>

          {/* ── Stats bar ── */}
          <StatsBar layout={layout} />

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
  root:  { flex: 1, backgroundColor: 'transparent', overflow: 'hidden' },
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
