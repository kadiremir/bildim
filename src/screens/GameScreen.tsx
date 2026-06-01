import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { countries } from '../data/countries';
import { TinderCard } from '../components/TinderCard';
import { GuessInput } from '../components/GuessInput';
import { Confetti } from '../components/Confetti';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { hapticSuccess, hapticError, hapticMedium, hapticLight } from '../utils/haptics';
import { playSound } from '../utils/sounds';

type Phase = 'swiping' | 'guessing' | 'correct' | 'revealed';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Props {
  onBack: () => void;
}

export function GameScreen({ onBack }: Props) {
  const { width, height } = useWindowDimensions();
  const cardAreaHeight = height * 0.50;
  const cardWidth = Math.max(1, width - 40);
  const cardHeight = Math.max(240, cardAreaHeight);

  const [deck] = useState(() => shuffle(countries));
  const [countryIndex, setCountryIndex] = useState(0);
  const [hintIndex, setHintIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('swiping');
  const [wrongCount, setWrongCount] = useState(0);
  const [shakeSignal, setShakeSignal] = useState(0);
  const [score, setScore] = useState(0);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [streak, setStreak] = useState(0);

  const resultSlide   = useRef(new Animated.Value(height)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const streakScale   = useRef(new Animated.Value(1)).current;
  const wrongShake    = useRef(new Animated.Value(0)).current;
  // Fades the whole card stack in — resets to 0 on every new country to kill residue flash
  const stackFade     = useRef(new Animated.Value(0)).current;

  const country = deck[countryIndex % deck.length];
  const totalHints = country.hints.length;
  const isLastHint = hintIndex >= totalHints - 1;
  const visibleHints = country.hints.slice(hintIndex, hintIndex + 3);

  // Snap stack to invisible then fade in — runs on every hint change AND country change
  useEffect(() => {
    stackFade.setValue(0);
    Animated.timing(stackFade, { toValue: 1, duration: 120, useNativeDriver: true }).start();
  }, [countryIndex, hintIndex]);
  const pointsEarned = Math.max(5 - wrongCount, 1);
  // Turkish-aware capitalisation (handles ı → I, i → İ)
  const capitalised = country.answer.charAt(0).toLocaleUpperCase('tr-TR') + country.answer.slice(1);

  useEffect(() => {
    if (phase !== 'correct' && phase !== 'revealed') {
      resultSlide.setValue(height);
    }
  }, [height, phase, resultSlide]);

  const showResult = useCallback((success: boolean) => {
    Animated.parallel([
      Animated.spring(resultSlide, {
        toValue: 0,
        tension: 65,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.timing(resultOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    if (success) {
      setTimeout(() => setConfettiTrigger((c) => c + 1), 200);
    }
  }, [resultOpacity, resultSlide]);

  const hideResult = useCallback((cb: () => void) => {
    Animated.parallel([
      Animated.timing(resultSlide, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(resultOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(cb);
  }, [height, resultOpacity, resultSlide]);

  const handleSwipeLeft = useCallback(() => {
    if (isLastHint) return;
    hapticLight();
    setHintIndex((i) => i + 1);
  }, [isLastHint]);

  const handleSwipeRight = useCallback(() => {
    hapticMedium();
    setPhase('guessing');
  }, []);

  const handleGuess = useCallback(
    (guess: string) => {
      if (guess.toLocaleLowerCase('tr-TR').trim() === country.answer) {
        hapticSuccess();
        playSound('correct');
        const pts = pointsEarned;
        setScore((s) => s + pts);
        setStreak((s) => {
          const next = s + 1;
          Animated.sequence([
            Animated.spring(streakScale, { toValue: 1.4, tension: 200, friction: 6, useNativeDriver: true }),
            Animated.spring(streakScale, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }),
          ]).start();
          return next;
        });
        setPhase('correct');
        showResult(true);
        setTimeout(() => playSound('points'), 400);
      } else {
        hapticError();
        playSound('wrong');
        setWrongCount((c) => c + 1);
        setStreak(0);
        setShakeSignal((s) => s + 1);
        if (!isLastHint) setHintIndex((i) => i + 1);
      }
    },
    [country.answer, pointsEarned, isLastHint, showResult]
  );

  const handleNext = useCallback(() => {
    hideResult(() => {
      resultSlide.setValue(height);
      setCountryIndex((i) => i + 1);
      setHintIndex(0);
      setPhase('swiping');
      setWrongCount(0);
    });
  }, [height, hideResult, resultSlide]);

  const handleGiveUp = useCallback(() => {
    hapticMedium();
    setStreak(0);
    setHintIndex(totalHints - 1);
    setPhase('revealed');
    showResult(false);
  }, [totalHints, showResult]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#080C18', '#0D1530', '#080C18']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => { hapticLight(); onBack(); }}
            activeOpacity={0.75}
            style={styles.backBtn}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Ülkeler</Text>
            {streak >= 2 && (
              <Animated.View style={[styles.streakBadge, { transform: [{ scale: streakScale }] }]}>
                <Text style={styles.streakText}>🔥 {streak}</Text>
              </Animated.View>
            )}
          </View>

          <View style={styles.scorePill}>
            <Text style={styles.scoreLabel}>PUAN</Text>
            <AnimatedCounter value={score} style={styles.scoreValue} />
          </View>
        </View>

        {/* Card stack */}
        {(phase === 'swiping' || phase === 'guessing') && (
          <Animated.View style={[styles.cardArea, { height: cardHeight, opacity: stackFade }]}>
            {[...visibleHints].reverse().map((hint, reverseIdx) => {
              const stackIndex = visibleHints.length - 1 - reverseIdx;
              // Include position label in key so React always remounts when a card
              // moves from a background slot to the top slot (fixes typewriter re-trigger)
              const posLabel = stackIndex === 0 ? 'top' : 'bg';
              return (
                <TinderCard
                  key={`${countryIndex}-${hintIndex + stackIndex}-${posLabel}`}
                  hint={hint}
                  hintIndex={hintIndex + stackIndex}
                  totalHints={totalHints}
                  stackIndex={stackIndex}
                  isTop={stackIndex === 0}
                  cardWidth={cardWidth}
                  cardHeight={cardHeight}
                  screenWidth={width}
                  onSwipeLeft={handleSwipeLeft}
                  onSwipeRight={handleSwipeRight}
                />
              );
            })}
          </Animated.View>
        )}

        {/* Action bar */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.actionArea}
        >
          {phase === 'swiping' && (
            <View style={styles.swipeActions}>
              <View style={styles.actionButtonsRow}>
                {/* Skip / Next clue */}
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnBlue, isLastHint && styles.actionBtnDisabled]}
                  onPress={isLastHint ? undefined : () => { hapticLight(); handleSwipeLeft(); }}
                  activeOpacity={isLastHint ? 1 : 0.8}
                >
                  <LinearGradient
                    colors={isLastHint ? ['#1a2030', '#1a2030'] : ['#1d4ed8', '#3b82f6']}
                    style={styles.actionBtnGradient}
                  >
                    <Text style={[styles.actionBtnIcon, isLastHint && styles.actionBtnIconDim]}>←</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.actionBtnCenter}>
                  <Text style={styles.actionCenterLabel}>kaydır veya dokun</Text>
                </View>

                {/* I know */}
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnGreen]}
                  onPress={() => { hapticMedium(); handleSwipeRight(); }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#065f46', '#10b981']}
                    style={styles.actionBtnGradient}
                  >
                    <Text style={styles.actionBtnIcon}>✓</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={styles.actionLabelsRow}>
                <Text style={[styles.actionLabel, isLastHint && styles.actionLabelDim]}>
                  {isLastHint ? 'Başka ipucu yok' : 'Sonraki ipucu'}
                </Text>
                <View style={{ flex: 1 }} />
                <Text style={styles.actionLabel}>Bildim!</Text>
              </View>

              {isLastHint && (
                <TouchableOpacity onPress={handleGiveUp} activeOpacity={0.6} style={styles.giveUpBtn}>
                  <Text style={styles.giveUpText}>Vazgeçtim — cevabı göster</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {phase === 'guessing' && (
            <View style={styles.guessActions}>
              <View style={styles.guessHeaderRow}>
                <Text style={styles.guessTitle}>Hangi ülke?</Text>
                {wrongCount > 0 && (
                  <View style={styles.wrongCounter}>
                    <Text style={styles.wrongCounterText}>{wrongCount} ✗</Text>
                  </View>
                )}
              </View>

              <GuessInput onSubmit={handleGuess} shakeSignal={shakeSignal} />

              {wrongCount > 0 && (
                <View style={styles.wrongBanner}>
                  <Text style={styles.wrongBannerIcon}>✗</Text>
                  <Text style={styles.wrongBannerText}>
                    Yanlış!{isLastHint ? " Tüm ipuçları gösterildi." : " Yeni ipucu açıldı."}
                  </Text>
                </View>
              )}

              <TouchableOpacity onPress={() => setPhase('swiping')} activeOpacity={0.7}>
                <Text style={styles.backToClues}>← İpuçlarına dön</Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Result sheet */}
      {(phase === 'correct' || phase === 'revealed') && (
        <Animated.View
          style={[
            styles.resultSheet,
            {
              transform: [{ translateY: resultSlide }],
              opacity: resultOpacity,
            },
          ]}
        >
          <LinearGradient
            colors={
              phase === 'correct'
                ? ['#0D2818', '#0A1F2E', '#0D0F1A']
                : ['#1A0A0A', '#0A1520', '#0D0F1A']
            }
            style={styles.resultSheetInner}
          >
            {/* Handle bar */}
            <View style={styles.handle} />

            {phase === 'correct' ? (
              <>
                <Text style={styles.resultEmoji}>🎉</Text>
                <Text style={styles.resultCorrectLabel}>DOĞRU!</Text>
                <Text style={styles.resultCountry}>{capitalised}</Text>

                <View style={styles.pointsRow}>
                  <LinearGradient
                    colors={['#7C3AED', '#4F46E5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.pointsBadge}
                  >
                    <Text style={styles.pointsBadgeText}>+{pointsEarned} points</Text>
                  </LinearGradient>

                  {streak >= 2 && (
                    <View style={styles.streakResultBadge}>
                      <Text style={styles.streakResultText}>🔥 {streak} seri</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity onPress={handleNext} activeOpacity={0.85} style={styles.nextBtnWrap}>
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.nextBtn}
                  >
                    <Text style={styles.nextBtnText}>Sonraki Ülke →</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.resultEmoji}>🌍</Text>
                <Text style={styles.resultRevealLabel}>CEVAP ŞUYDU</Text>
                <Text style={styles.resultCountry}>{capitalised}</Text>

                <TouchableOpacity onPress={handleNext} activeOpacity={0.85} style={styles.nextBtnWrap}>
                  <LinearGradient
                    colors={['#374151', '#4B5563']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.nextBtn}
                  >
                    <Text style={styles.nextBtnText}>Sonrakini Dene →</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </LinearGradient>
        </Animated.View>
      )}

      {/* Confetti layer */}
      <Confetti trigger={confettiTrigger} originX={width / 2} originY={height * 0.4} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080C18', overflow: 'hidden' },
  safe: { flex: 1 },
  orb1: {
    position: 'absolute', width: 340, height: 340, borderRadius: 170,
    backgroundColor: 'rgba(59,130,246,0.07)', top: -80, left: -100,
  },
  orb2: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(139,92,246,0.07)', bottom: 120, right: -80,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 12,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  backIcon: { color: '#fff', fontSize: 18, fontWeight: '600' },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: { color: '#fff', fontSize: 19, fontWeight: '800' },
  streakBadge: {
    backgroundColor: 'rgba(249,115,22,0.2)',
    borderWidth: 1, borderColor: 'rgba(249,115,22,0.4)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  streakText: { color: '#fb923c', fontSize: 12, fontWeight: '800' },
  scorePill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    minWidth: 64,
  },
  scoreLabel: {
    color: 'rgba(255,255,255,0.35)', fontSize: 9,
    fontWeight: '800', letterSpacing: 1.5,
  },
  scoreValue: { color: '#a5b4fc', fontSize: 20, fontWeight: '900' },

  // Card area
  cardArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
  },

  // Action area
  actionArea: { flex: 1, justifyContent: 'flex-start', paddingTop: 20 },

  // Swipe actions
  swipeActions: { gap: 12 },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 52,
  },
  actionBtn: {
    width: 68, height: 68, borderRadius: 34,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  actionBtnBlue: { shadowColor: '#3b82f6' },
  actionBtnGreen: { shadowColor: '#10b981' },
  actionBtnDisabled: { shadowColor: 'transparent' },
  actionBtnGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  actionBtnIcon: { color: '#fff', fontSize: 26, fontWeight: '700' },
  actionBtnIconDim: { color: 'rgba(255,255,255,0.2)' },
  actionBtnCenter: { alignItems: 'center' },
  actionCenterLabel: { color: 'rgba(255,255,255,0.18)', fontSize: 11, fontWeight: '500' },
  actionLabelsRow: {
    flexDirection: 'row', paddingHorizontal: 44,
  },
  actionLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: '600' },
  actionLabelDim: { color: 'rgba(255,255,255,0.15)' },
  giveUpBtn: { alignItems: 'center', paddingVertical: 4 },
  giveUpText: { color: 'rgba(255,255,255,0.2)', fontSize: 13 },

  // Guess actions
  guessActions: { gap: 14 },
  guessHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, gap: 10,
  },
  guessTitle: { color: '#fff', fontSize: 21, fontWeight: '800', flex: 1 },
  wrongCounter: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  wrongCounterText: { color: '#f87171', fontSize: 13, fontWeight: '700' },
  wrongBanner: {
    marginHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
  },
  wrongBannerIcon: { color: '#f87171', fontSize: 14, fontWeight: '700' },
  wrongBannerText: { color: '#f87171', fontSize: 13, flex: 1, lineHeight: 18 },
  backToClues: {
    color: 'rgba(255,255,255,0.28)', fontSize: 14,
    paddingHorizontal: 22, paddingVertical: 4,
  },

  // Result sheet (slides up)
  resultSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 24,
  },
  resultSheetInner: {
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingBottom: 48,
    paddingTop: 16,
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 10,
  },
  handle: {
    width: 44, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 16,
  },
  resultEmoji: { fontSize: 60, marginBottom: 4 },
  resultCorrectLabel: {
    color: '#34D399', fontSize: 13, fontWeight: '800',
    letterSpacing: 2.5,
  },
  resultRevealLabel: {
    color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '800',
    letterSpacing: 2,
  },
  resultCountry: {
    color: '#fff', fontSize: 36, fontWeight: '900',
    letterSpacing: -1, textAlign: 'center', marginBottom: 4,
  },
  pointsRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, marginBottom: 8,
  },
  pointsBadge: {
    borderRadius: 22, paddingHorizontal: 20, paddingVertical: 10,
  },
  pointsBadgeText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  streakResultBadge: {
    backgroundColor: 'rgba(249,115,22,0.15)',
    borderWidth: 1, borderColor: 'rgba(249,115,22,0.3)',
    borderRadius: 22, paddingHorizontal: 14, paddingVertical: 10,
  },
  streakResultText: { color: '#fb923c', fontWeight: '700', fontSize: 14 },
  nextBtnWrap: { width: '100%', marginTop: 4 },
  nextBtn: {
    borderRadius: 20, paddingVertical: 18,
    alignItems: 'center',
  },
  nextBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
