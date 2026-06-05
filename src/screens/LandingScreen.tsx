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
import { Asset } from 'expo-asset';
import { ShimmerCard } from '../components/ShimmerCard';
import { hapticMedium, hapticLight } from '../utils/haptics';
import { playSound } from '../utils/sounds';
import { countries, cities, animals } from '../data/categories';
import { ICON_MAP } from '../components/CategoryIcons';
import { THEMES, Theme } from '../theme/themes';

const CARD_BG_IMAGES: Record<string, any> = {
  countries: require('../../assets/categories/countries_bg.png'),
  cities:    require('../../assets/categories/cities_tr_bg.png'),
};

const _allItems = [...countries, ...cities, ...animals];
const TOTAL_HINTS = _allItems.reduce((sum, item) => sum + item.hints.length, 0);

function itemStats(id: string, available: boolean): string {
  if (!available) return 'Yakında';
  const counts: Record<string, number> = {
    countries: countries.length,
    cities: cities.length,
    animals: animals.length,
  };
  return `${counts[id] ?? 0} içerik`;
}

interface Category {
  id: string;
  label: string;
  sub: string;
  tag?: string;
  available: boolean;
}

const CATS: Category[] = [
  { id: 'countries', label: 'Ülkeler',     sub: 'Nadir gerçekler & gizli tarihler',              tag: 'OYNA', available: true },
  { id: 'cities',    label: 'Şehirler TR', sub: "Çocuklar için — Türkiye'den şehirler",           tag: 'OYNA', available: true },
  { id: 'animals',   label: 'Hayvanlar',   sub: 'Tuhaf ve büyüleyici canlılar',                   available: false },
  { id: 'people',    label: 'Kişiler',     sub: 'Tarihi değiştiren isimler',                      available: false },
];

const STATS_DATA = [
  { v: '4',              label: 'farklı oyun',   k: 'a1' as const },
  { v: String(TOTAL_HINTS), label: 'farklı bilgi', k: 'a2' as const },
  { v: '∞',              label: 'tekrar hakkı',  k: 'a4' as const },
];

const STEPS = [
  { icon: '🃏', t: 'İpucunu oku',  d: 'Her turda nadir bilgiler içeren bir kart belirir' },
  { icon: '⚡', t: 'Sonraki!',     d: 'Daha fazla ipucu için sola kaydır' },
  { icon: '💡', t: 'Bildim!',      d: 'Cevabı biliyorsan "Bildim!" butonuna bas' },
  { icon: '🏆', t: 'Puan kazan',   d: 'Maksimum 5 puan — her yanlış tahmin 1 puan düşürür' },
];

/* ─── Float animations ──────────────────────────────────────────────── */
function useFloat(amplitude: number, duration: number, delay = 0) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: -amplitude, duration, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, amplitude, duration, delay]);
  return anim;
}

function usePulse(min: number, max: number, duration: number) {
  const anim = useRef(new Animated.Value(min)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: max, duration, useNativeDriver: true }),
        Animated.timing(anim, { toValue: min, duration, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, min, max, duration]);
  return anim;
}

/* ─── Hero ──────────────────────────────────────────────────────────── */
function Hero({ th }: { th: Theme }) {
  const heroOp = useRef(new Animated.Value(0)).current;
  const heroY  = useRef(new Animated.Value(-16)).current;
  const float1 = useFloat(8, 2500);
  const float2 = useFloat(10, 3500, 1000);
  const float3 = useFloat(6, 3000, 500);
  const dot    = usePulse(0.4, 1, 1000);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroOp, { toValue: 1, duration: 700, delay: 150, useNativeDriver: true }),
      Animated.spring(heroY, { toValue: 0, delay: 150, tension: 55, friction: 10, useNativeDriver: true }),
    ]).start();
  }, [heroOp, heroY]);

  return (
    <Animated.View style={[styles.hero, { opacity: heroOp, transform: [{ translateY: heroY }] }]}>
      {/* floating decorative shapes */}
      <Animated.View pointerEvents="none" style={[styles.floatShape, styles.floatSquare, { borderColor: th.a1 + '40', transform: [{ translateY: float1 }] }]} />
      <Animated.View pointerEvents="none" style={[styles.floatShape, styles.floatCircle, { backgroundColor: th.a3 + '30', transform: [{ translateY: float2 }] }]} />
      <Animated.View pointerEvents="none" style={[styles.floatShape, styles.floatDiamond, { borderColor: th.a2 + '35', transform: [{ translateY: float3 }] }]} />

      {/* tagline */}
      <View style={styles.tagRow}>
        <Animated.View style={[styles.tagDot, { backgroundColor: th.a1, opacity: dot }]} />
        <Text style={[styles.tagText, { color: th.isDark ? th.a1 + 'cc' : th.a2 }]}>
          DÜŞÜN · TAHMİN ET · ÖĞREN
        </Text>
      </View>

      {/* title */}
      <Text style={[
        styles.heroTitle,
        { color: th.text, textShadowColor: th.isDark ? th.a2 + '60' : 'transparent', textShadowRadius: th.isDark ? 30 : 0 },
      ]}>
        Bildim!
      </Text>

      {/* underline */}
      <LinearGradient
        colors={th.heroGrad}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.underline}
      />

      <Text style={[styles.heroSub, { color: th.sub }]}>
        İpuçlarını oku, cevabı bul.{'\n'}Kaç ipucunda bileceksin?
      </Text>
    </Animated.View>
  );
}

/* ─── Stats pills ───────────────────────────────────────────────────── */
function Stats({ th }: { th: Theme }) {
  return (
    <View style={styles.statsRow}>
      {STATS_DATA.map((s, i) => {
        const c = th[s.k];
        return (
          <View key={s.label} style={[
            styles.statPill,
            { backgroundColor: th.isDark ? c + '12' : c + '10', borderColor: th.isDark ? c + '30' : c + '22' },
          ]}>
            <Text style={[styles.statValue, { color: c, fontSize: s.v === '∞' ? 32 : 26 }]}>{s.v}</Text>
            <Text style={[styles.statLabel, { color: th.muted }]}>{s.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

/* ─── Section divider ───────────────────────────────────────────────── */
function SectionDivider({ label, th }: { label: string; th: Theme }) {
  const lineC = th.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';
  return (
    <View style={styles.divRow}>
      <LinearGradient
        colors={['transparent', lineC, 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.divLine}
      />
      <Text style={[styles.divLabel, { color: th.muted }]}>{label}</Text>
      <LinearGradient
        colors={['transparent', lineC, 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.divLine}
      />
    </View>
  );
}

/* ─── Category card ─────────────────────────────────────────────────── */
function CategoryCard({ cat, i, th, onSelect, cardWidth, isMobile }: {
  cat: Category; i: number; th: Theme; onSelect: (id: string) => void; cardWidth: number; isMobile: boolean;
}) {
  const enter = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(1)).current;
  const iconBob = useFloat(3, 1500, i * 400);
  const c = th.cardAccent(i);
  const IconComp = ICON_MAP[cat.id];
  const cardRef = useRef<View>(null);

  // Apply background via CSS custom property + ::before pseudo for opacity control
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const module = CARD_BG_IMAGES[cat.id];
    if (!module) return;
    let cancelled = false;

    if (!document.getElementById('card-bg-style')) {
      const s = document.createElement('style');
      s.id = 'card-bg-style';
      s.textContent = `[data-card-bg]::before{content:"";position:absolute;inset:0;background-image:var(--card-bg-url);background-size:100% 100%;background-repeat:no-repeat;opacity:0.18;z-index:0;pointer-events:none;border-radius:inherit;}`;
      document.head.appendChild(s);
    }

    Asset.fromModule(module).downloadAsync().then((asset) => {
      if (cancelled) return;
      const uri = asset.localUri || asset.uri;
      if (!uri) return;
      const el = (cardRef.current as unknown) as HTMLElement | null;
      if (!el) return;
      el.style.setProperty('--card-bg-url', `url(${uri})`);
      el.setAttribute('data-card-bg', cat.id);
    });

    return () => {
      cancelled = true;
      const el = (cardRef.current as unknown) as HTMLElement | null;
      if (el) {
        el.style.removeProperty('--card-bg-url');
        el.removeAttribute('data-card-bg');
      }
    };
  }, [cat.id]);

  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1, delay: 400 + i * 120,
      tension: 55, friction: 10, useNativeDriver: true,
    }).start();
  }, [enter, i]);

  const onPressIn  = () => {
    if (!cat.available) return;
    hapticLight();
    Animated.spring(press, { toValue: 0.94, tension: 300, friction: 10, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(press, { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }).start();
  };
  const onPress = () => {
    if (!cat.available) return;
    hapticMedium(); playSound('tap'); onSelect(cat.id);
  };

  const ty = enter.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });

  return (
    <Animated.View style={{ opacity: enter, transform: [{ translateY: ty }, { scale: press }], width: cardWidth }}>
      <TouchableOpacity
        onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}
        activeOpacity={1} disabled={!cat.available}
      >
        <ShimmerCard
          style={{ borderRadius: isMobile ? 18 : 24 }}
          enabled={cat.available}
          shimmerColor={th.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.45)'}
        >
          <View
            ref={cardRef}
            style={[
              isMobile ? styles.cardRow : styles.card,
              {
                backgroundColor: th.cardBg(i),
                borderColor: th.isDark ? c + '30' : c + '18',
                opacity: cat.available ? 1 : 0.45,
                overflow: 'hidden',
              },
            ]}
          >
            {/* tag badge: absolute top-right on row, inline on column */}
            {isMobile ? (
              <View style={[
                styles.tagBadgeAbsolute,
                { backgroundColor: cat.available ? c + '20' : (th.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                  borderColor: cat.available ? c + '40' : (th.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)') },
              ]}>
                <Text style={[styles.tagBadgeTextSm, { color: cat.available ? c : th.muted }]}>
                  {cat.tag || 'YAKINDA'}
                </Text>
              </View>
            ) : (
              <View style={[
                styles.tagBadge,
                { backgroundColor: cat.available ? c + '20' : (th.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                  borderColor: cat.available ? c + '40' : (th.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)') },
              ]}>
                <Text style={[styles.tagBadgeText, { color: cat.available ? c : th.muted }]}>
                  {cat.tag || 'YAKINDA'}
                </Text>
              </View>
            )}

            {/* icon */}
            <Animated.View style={{ flexShrink: 0, transform: [{ translateY: iconBob }] }}>
              {IconComp && <IconComp th={th} size={isMobile ? 80 : 52} />}
            </Animated.View>

            {/* text block */}
            <View style={{ flex: 1, minWidth: 0, gap: isMobile ? 8 : 3 }}>
              <Text style={[isMobile ? styles.cardLabelSm : styles.cardLabel, { color: th.text }]}>{cat.label}</Text>
              <Text style={[isMobile ? styles.cardSubSm : styles.cardSub, { color: th.sub }]} numberOfLines={2}>{cat.sub}</Text>

              {/* chip */}
              <LinearGradient
                colors={cat.available ? [`${c}35`, `${c}15`] : [th.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={isMobile ? styles.playChipSm : styles.playChip}
              >
                <Text style={[isMobile ? styles.playChipTextSm : styles.playChipText, { color: cat.available ? (th.isDark ? '#e2e8f0' : th.text) : th.muted }]}>
                  {itemStats(cat.id, cat.available)}
                </Text>
              </LinearGradient>
            </View>
          </View>
        </ShimmerCard>
      </TouchableOpacity>
    </Animated.View>
  );
}

/* ─── How to play ───────────────────────────────────────────────────── */
function HowTo({ th }: { th: Theme }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setActive((s) => (s + 1) % STEPS.length), 3000);
    return () => clearInterval(iv);
  }, []);

  return (
    <View style={[
      styles.howCard,
      {
        backgroundColor: th.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.85)',
        borderColor: th.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
      },
    ]}>
      {/* progress bars */}
      <View style={styles.howProgress}>
        {STEPS.map((_, i) => (
          <TouchableOpacity key={i} style={[
            styles.howBar,
            { backgroundColor: i === active ? th.a1 : (th.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') },
          ]} onPress={() => setActive(i)} />
        ))}
      </View>

      {STEPS.map((s, i) => (
        <View key={s.t} style={[
          styles.howRow,
          { backgroundColor: i === active ? (th.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)') : 'transparent' },
        ]}>
          {/* active indicator */}
          <View style={[
            styles.howActiveBar,
            { backgroundColor: th.a1, transform: [{ scaleY: i === active ? 1 : 0 }] },
          ]} />

          <View style={[
            styles.howIconBox,
            {
              backgroundColor: i === active ? th.a1 + '18' : (th.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
              borderColor: i === active ? th.a1 + '30' : 'transparent',
            },
          ]}>
            <Text style={styles.howIconText}>{s.icon}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.howTitle, { color: th.text }]}>{s.t}</Text>
            <Text style={[styles.howDesc, { color: th.sub, opacity: i === active ? 1 : 0.65 }]}>{s.d}</Text>
          </View>

          <View style={[
            styles.howNum,
            {
              backgroundColor: i === active ? th.a1 : 'transparent',
              borderColor: i === active ? 'transparent' : (th.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'),
            },
          ]}>
            <Text style={[styles.howNumText, { color: i === active ? '#fff' : th.muted }]}>{i + 1}</Text>
          </View>

          {i < STEPS.length - 1 && (
            <View style={[styles.howDivider, { backgroundColor: th.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]} />
          )}
        </View>
      ))}
    </View>
  );
}

/* ─── Theme toggle ──────────────────────────────────────────────────── */
function ThemeToggle({ th, onToggle }: { th: Theme; onToggle: () => void }) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      style={[
        styles.themeToggle,
        {
          backgroundColor: th.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          shadowColor: th.isDark ? th.a1 : '#000',
        },
      ]}
    >
      <Text style={{ fontSize: 20 }}>{th.isDark ? '☀️' : '🌙'}</Text>
    </TouchableOpacity>
  );
}

/* ─── Main screen ───────────────────────────────────────────────────── */
export function LandingScreen({ onSelect, darkMode, onToggleDark }: {
  onSelect: (id: string) => void;
  darkMode: boolean;
  onToggleDark: () => void;
}) {
  const { width } = useWindowDimensions();
  const th = darkMode ? THEMES.neonNight : THEMES.brightPop;
  const contentW = Math.min(width, 900) - 40; // minus 2 * paddingHorizontal
  const isMobile = width < 640;
  const GRID_GAP = 16;
  const cardWidth = isMobile ? contentW : (contentW - GRID_GAP) / 2;

  return (
    <View style={styles.root}>
      <StatusBar barStyle={th.isDark ? 'light-content' : 'dark-content'} />

      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={[styles.contentWrap, { maxWidth: Math.min(width, 900) }]}>
            {/* theme toggle */}
            <View style={styles.toggleRow}>
              <ThemeToggle th={th} onToggle={onToggleDark} />
            </View>

            <Hero th={th} />
            <Stats th={th} />
            <SectionDivider label="KATEGORİ SEÇ" th={th} />

            <View style={styles.grid}>
              {CATS.map((cat, i) => (
                <CategoryCard key={cat.id} cat={cat} i={i} th={th} onSelect={onSelect} cardWidth={cardWidth} isMobile={isMobile} />
              ))}
            </View>

            <SectionDivider label="NASIL OYNANIR" th={th} />
            <HowTo th={th} />

            {/* footer */}
            <View style={styles.footer}>
              <LinearGradient colors={th.heroGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.footerDash} />
              <Text style={[styles.footerText, { color: th.muted }]}>Yeni kategoriler yakında geliyor</Text>
              <LinearGradient colors={th.heroGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.footerDash} />
            </View>
            <View style={{ height: 32 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1, overflow: 'hidden' },
  safe:  { flex: 1 },
  scroll: { alignItems: 'center' },
  contentWrap: { width: '100%', paddingHorizontal: 20, alignSelf: 'center' },

  toggleRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 8 },
  themeToggle: {
    width: 48, height: 48, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 4,
  },

  // Hero
  hero: { alignItems: 'center', paddingTop: 28, paddingBottom: 20, position: 'relative' },
  floatShape: { position: 'absolute', pointerEvents: 'none' },
  floatSquare: { width: 36, height: 36, borderRadius: 10, borderWidth: 2, top: 20, left: 12 },
  floatCircle: { width: 22, height: 22, borderRadius: 11, top: 44, right: 20 },
  floatDiamond: { width: 16, height: 16, borderWidth: 2, bottom: 44, left: 30 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 14 },
  tagDot: { width: 6, height: 6, borderRadius: 3 },
  tagText: { fontSize: 11, fontWeight: '800', letterSpacing: 2.5 },
  heroTitle: {
    fontSize: 68, fontWeight: '900', letterSpacing: -2.5,
    lineHeight: 74, marginBottom: 12, textAlign: 'center',
  },
  underline: { width: 160, height: 4, borderRadius: 2, marginBottom: 18 },
  heroSub: { fontSize: 16, lineHeight: 26, fontWeight: '400', textAlign: 'center' },

  // Stats
  statsRow: {
    flexDirection: 'row', gap: 12,
    paddingVertical: 12, marginBottom: 8,
  },
  statPill: {
    flex: 1, alignItems: 'center', gap: 5,
    paddingVertical: 16, paddingHorizontal: 8,
    borderRadius: 20, borderWidth: 1,
  },
  statValue: { fontWeight: '900', letterSpacing: -0.5, lineHeight: 36 },
  statLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3, textTransform: 'uppercase', textAlign: 'center' },

  // Divider
  divRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 16 },
  divLine: { flex: 1, height: 1 },
  divLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2.5 },

  // Cards
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 8,
  },
  card: {
    borderRadius: 24, borderWidth: 1,
    padding: 18, gap: 6,
    minHeight: 220,
    flexDirection: 'column',
  },
  cardRow: {
    borderRadius: 18, borderWidth: 1,
    paddingHorizontal: 20, paddingVertical: 24,
    flexDirection: 'row', alignItems: 'center', gap: 16,
    minHeight: 130,
  },
  tagBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 10, borderWidth: 1, marginBottom: 4,
  },
  tagBadgeAbsolute: {
    position: 'absolute', top: 10, right: 12,
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 8, borderWidth: 1,
  },
  tagBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  tagBadgeTextSm: { fontSize: 8, fontWeight: '800', letterSpacing: 1.5 },
  cardLabel: { fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  cardLabelSm: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  cardSub:   { fontSize: 12, lineHeight: 17, flex: 1 },
  cardSubSm: { fontSize: 14, lineHeight: 20 },
  playChip:  { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, alignSelf: 'flex-start', marginTop: 4 },
  playChipSm: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginTop: 2 },
  playChipText: { fontSize: 12, fontWeight: '700' },
  playChipTextSm: { fontSize: 12, fontWeight: '700' },

  // HowTo
  howCard: {
    borderRadius: 24, overflow: 'hidden',
    borderWidth: 1, marginBottom: 16,
  },
  howProgress: { flexDirection: 'row', gap: 5, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, justifyContent: 'center' },
  howBar: { height: 3, borderRadius: 2, flex: 1 },
  howRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 14, position: 'relative' },
  howActiveBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: 2 },
  howIconBox: {
    width: 48, height: 48, borderRadius: 14, flexShrink: 0,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  howIconText: { fontSize: 22 },
  howTitle:    { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  howDesc:     { fontSize: 12, lineHeight: 17 },
  howNum: {
    width: 28, height: 28, borderRadius: 14, flexShrink: 0,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  howNumText: { fontSize: 12, fontWeight: '800' },
  howDivider: { position: 'absolute', bottom: 0, left: 82, right: 18, height: 1 },

  // Footer
  footer:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 8 },
  footerDash: { width: 20, height: 2, borderRadius: 1 },
  footerText: { fontSize: 11, fontWeight: '500', letterSpacing: 0.3 },
});
