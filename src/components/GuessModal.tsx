import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  KeyboardAvoidingView,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { hapticLight, hapticMedium } from '../utils/haptics';

// ─── BlankCell ────────────────────────────────────────────────────────────────

function BlankCell({ char, revealed, isFirst }: {
  char: string;
  revealed: boolean;
  isFirst: boolean;
}) {
  const anim       = useRef(new Animated.Value(revealed ? 1 : 0)).current;
  const wasReveal  = useRef(revealed);

  useEffect(() => {
    if (revealed && !wasReveal.current) {
      wasReveal.current = true;
      Animated.spring(anim, {
        toValue: 1, tension: 240, friction: 7, useNativeDriver: true,
      }).start();
    }
  }, [revealed, anim]);

  const color  = isFirst ? '#f59e0b' : '#a855f7';
  const glowBg = isFirst ? 'rgba(245,158,11,0.3)' : 'rgba(168,85,247,0.3)';

  const underscoreOpacity = anim.interpolate({ inputRange: [0, 0.45, 1], outputRange: [1, 0, 0] });
  const letterOpacity     = anim.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 1, 1] });
  const letterScale       = anim.interpolate({ inputRange: [0, 0.55, 0.8, 1], outputRange: [0.15, 1.4, 0.92, 1] });
  const letterY           = anim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] });

  return (
    <View style={bc.cell}>
      <Animated.View
        pointerEvents="none"
        style={[bc.cellGlow, { backgroundColor: glowBg, opacity: anim }]}
      />
      <Animated.Text style={[bc.underscore, { opacity: underscoreOpacity }]}>_</Animated.Text>
      <Animated.Text
        style={[
          bc.letter,
          {
            color,
            opacity: letterOpacity,
            transform: [{ scale: letterScale }, { translateY: letterY }],
          },
        ]}
      >
        {char.toLocaleUpperCase('tr-TR')}
      </Animated.Text>
    </View>
  );
}

const bc = StyleSheet.create({
  cell: {
    width: 26, height: 36,
    alignItems: 'center', justifyContent: 'flex-end',
    position: 'relative',
  },
  cellGlow: {
    position: 'absolute',
    width: 26, height: 26, borderRadius: 13, top: 2,
  },
  underscore: {
    color: 'rgba(255,255,255,0.32)',
    fontSize: 20, fontWeight: '800',
    position: 'absolute', bottom: 0, lineHeight: 22,
  },
  letter: {
    fontSize: 15, fontWeight: '900',
    position: 'absolute', bottom: 4, letterSpacing: -0.3,
  },
});

// ─── LetterBlanks ─────────────────────────────────────────────────────────────

function LetterBlanks({ answer, revealedPositions }: {
  answer: string;
  revealedPositions: number[];
}) {
  const slideAnim   = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim,   { toValue: 1, tension: 90, friction: 11, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, []);

  const translateY = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] });
  const chars      = answer.split('');
  const nonSpaceCount = chars.filter((c) => c !== ' ').length;

  return (
    <Animated.View style={[lb.wrap, { opacity: opacityAnim, transform: [{ translateY }] }]}>
      <LinearGradient
        colors={['rgba(99,102,241,0.12)', 'rgba(168,85,247,0.07)', 'rgba(99,102,241,0.04)']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={lb.box}
      >
        <View style={lb.topRow}>
          <Text style={lb.label}>CEVAP</Text>
          <View style={lb.countPill}>
            <Text style={lb.countText}>{nonSpaceCount} harf</Text>
          </View>
        </View>
        <View style={lb.blanksRow}>
          {chars.map((char, i) =>
            char === ' ' ? (
              <View key={i} style={lb.spaceGap} />
            ) : (
              <BlankCell
                key={i}
                char={char}
                revealed={revealedPositions.includes(i)}
                isFirst={i === 0}
              />
            )
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const lb = StyleSheet.create({
  wrap: { marginHorizontal: 18, marginBottom: 10 },
  box: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.28)',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  topRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  label: {
    color: 'rgba(165,180,252,0.5)',
    fontSize: 9, fontWeight: '800', letterSpacing: 2.2,
  },
  countPill: {
    backgroundColor: 'rgba(99,102,241,0.2)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2,
  },
  countText: { color: '#a5b4fc', fontSize: 10, fontWeight: '700' },
  blanksRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
  },
  spaceGap: { width: 10 },
});

// ─── HintButton ───────────────────────────────────────────────────────────────

interface HintButtonProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  cost?: string;
  color: string;
  used: boolean;
  locked?: boolean;
  lockNote?: string;
  onPress: () => void;
}

function HintButton({ icon, label, cost, color, used, locked, lockNote, onPress }: HintButtonProps) {
  const pressAnim = useRef(new Animated.Value(1)).current;

  const onPressIn  = () => { if (!used && !locked) Animated.spring(pressAnim, { toValue: 0.88, tension: 300, friction: 10, useNativeDriver: true }).start(); };
  const onPressOut = () => Animated.spring(pressAnim, { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }).start();

  const dimmed      = used || locked;
  const borderColor = dimmed ? 'rgba(255,255,255,0.07)' : color + '55';
  const bgColor     = dimmed ? 'rgba(255,255,255,0.03)' : color + '18';
  const iconColor   = dimmed ? 'rgba(255,255,255,0.18)' : color;
  const labelColor  = dimmed ? 'rgba(255,255,255,0.22)' : '#e2e8f0';

  const displayIcon  = locked ? 'lock-closed-outline' : icon;
  const displayLabel = label;
  const subText      = used ? '✓ kullanıldı' : locked ? lockNote : cost;
  const subColor     = used ? 'rgba(255,255,255,0.18)' : locked ? 'rgba(255,255,255,0.15)' : color;

  return (
    <TouchableOpacity
      onPress={() => { if (!used && !locked) onPress(); }}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
      style={hb.outer}
    >
      <Animated.View style={[
        hb.btn,
        { borderColor, backgroundColor: bgColor, transform: [{ scale: pressAnim }] },
      ]}>
        <Ionicons name={displayIcon} size={18} color={iconColor} />
        <Text style={[hb.label, { color: labelColor }]}>{displayLabel}</Text>
        {!!subText && (
          <Text style={[hb.sub, { color: subColor }]}>{subText}</Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const hb = StyleSheet.create({
  outer: { flex: 1 },
  btn: {
    borderWidth: 1, borderRadius: 14,
    paddingVertical: 10, paddingHorizontal: 8,
    alignItems: 'center', gap: 4,
  },
  label: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  sub:   { fontSize: 9,  fontWeight: '600', textAlign: 'center', letterSpacing: 0.2 },
});

// ─── HintSection ─────────────────────────────────────────────────────────────

function HintSection({ answer, revealedPositions, wrongCount, letterCountShown, onRevealFirstLetter, onRevealRandomLetter, onShowLetterCount }: {
  answer: string;
  revealedPositions: number[];
  wrongCount: number;
  letterCountShown: boolean;
  onRevealFirstLetter: () => void;
  onRevealRandomLetter: () => void;
  onShowLetterCount: () => void;
}) {
  const h7Anim  = useRef(new Animated.Value(0)).current;
  const h7Glow  = useRef(new Animated.Value(0)).current;
  const h7Unlocked = wrongCount >= 3;

  useEffect(() => {
    if (h7Unlocked) {
      Animated.sequence([
        Animated.spring(h7Anim, { toValue: 1.28, tension: 200, friction: 5, useNativeDriver: true }),
        Animated.spring(h7Anim, { toValue: 1,    tension: 200, friction: 8, useNativeDriver: true }),
      ]).start();
      Animated.sequence([
        Animated.timing(h7Glow, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(h7Glow, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]).start();
    }
  }, [h7Unlocked]);

  const firstLetterRevealed = revealedPositions.includes(0);
  const nonSpaceIndices     = answer.split('').map((c, i) => ({ c, i })).filter(x => x.c !== ' ').map(x => x.i);
  const allRevealed         = nonSpaceIndices.length > 0 && nonSpaceIndices.every(i => revealedPositions.includes(i));

  return (
    <View style={hs.wrap}>
      {/* Section label */}
      <View style={hs.labelRow}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.12)', 'transparent']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={hs.labelLine}
        />
        <Text style={hs.labelText}>YARDIM AL</Text>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.12)', 'transparent']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={hs.labelLine}
        />
      </View>

      {/* Buttons row */}
      <View style={hs.buttonsRow}>

        {/* H3 — Kaç harf? (free, show blanks) */}
        <HintButton
          icon="apps-outline"
          label="Kaç harf?"
          cost="ÜCRETSİZ"
          color="#2dd4bf"
          used={letterCountShown || revealedPositions.length > 0}
          onPress={onShowLetterCount}
        />

        {/* H1 — İlk harf (-1 pt) */}
        <HintButton
          icon="star-outline"
          label="İlk harf"
          cost="-1 puan"
          color="#f59e0b"
          used={firstLetterRevealed}
          onPress={() => { hapticMedium(); onRevealFirstLetter(); }}
        />

        {/* H7 — Harf ver (-1 pt, unlocks after 3 wrong) */}
        <View style={hs.h7Wrap}>
          {/* glow flash on unlock */}
          <Animated.View
            pointerEvents="none"
            style={[hs.h7GlowRing, { opacity: h7Glow }]}
          />
          <Animated.View style={{ flex: 1, transform: [{ scale: h7Unlocked ? h7Anim : new Animated.Value(1) }] }}>
            <HintButton
              icon="key-outline"
              label="Harf ver"
              cost="-1 puan"
              color="#a855f7"
              used={allRevealed}
              locked={!h7Unlocked}
              lockNote="3 hata sonra"
              onPress={() => { hapticMedium(); onRevealRandomLetter(); }}
            />
          </Animated.View>
        </View>

      </View>
    </View>
  );
}

const hs = StyleSheet.create({
  wrap: { marginHorizontal: 18, marginBottom: 14 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  labelLine: { flex: 1, height: 1 },
  labelText: {
    color: 'rgba(255,255,255,0.22)',
    fontSize: 9, fontWeight: '800', letterSpacing: 2.5, flexShrink: 0,
  },
  buttonsRow: { flexDirection: 'row', gap: 8 },
  h7Wrap: { flex: 1, position: 'relative' },
  h7GlowRing: {
    position: 'absolute',
    top: -4, left: -4, right: -4, bottom: -4,
    borderRadius: 18,
    backgroundColor: 'rgba(168,85,247,0.4)',
    zIndex: -1,
  },
});

// ─── GuessModal ───────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  category: string;
  answer: string;
  hintIndex: number;
  wrongCount: number;
  shakeSignal: number;
  isLastHint: boolean;
  revealedPositions: number[];
  onSubmit: (guess: string) => void;
  onBackToClues: () => void;
  onRevealFirstLetter: () => void;
  onRevealRandomLetter: () => void;
}

export function GuessModal({
  visible,
  category,
  answer,
  hintIndex,
  wrongCount,
  shakeSignal,
  isLastHint,
  revealedPositions,
  onSubmit,
  onBackToClues,
  onRevealFirstLetter,
  onRevealRandomLetter,
}: Props) {
  const { width } = useWindowDimensions();
  const modalWidth = Math.min(width * 0.9, 420);

  const [text, setText] = useState('');
  const [letterCountShown, setLetterCountShown] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Reset letter-count visibility when question changes
  useEffect(() => {
    setLetterCountShown(false);
  }, [answer]);

  // entrance / exit
  const scaleAnim    = useRef(new Animated.Value(0.88)).current;
  const opacityAnim  = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // shake + flash
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setText('');
      Animated.parallel([
        Animated.spring(scaleAnim,    { toValue: 1,   tension: 80, friction: 10, useNativeDriver: true }),
        Animated.timing(opacityAnim,  { toValue: 1,   duration: 220, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1,   duration: 280, useNativeDriver: true }),
      ]).start(() => inputRef.current?.focus());
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim,    { toValue: 0.88, duration: 160, useNativeDriver: true }),
        Animated.timing(opacityAnim,  { toValue: 0,    duration: 160, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0,    duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim, backdropAnim]);

  useEffect(() => {
    if (shakeSignal === 0) return;
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 60,  useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 14,  duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -14, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10,  duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 5,   duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 45, useNativeDriver: true }),
    ]).start();
  }, [shakeSignal, shakeAnim, flashAnim]);

  const handleSubmit = () => {
    if (!text.trim()) return;
    hapticLight();
    onSubmit(text.trim());
    setText('');
  };

  const handleBack = () => {
    hapticLight();
    onBackToClues();
  };

  // Show blanks when letter-count requested OR at least one letter revealed
  const blanksVisible = letterCountShown || revealedPositions.length > 0;

  const hintLabel       = `${hintIndex + 1}. ipucundasın`;
  const questionLabel   = category === 'cities' ? 'Hangi şehir?' : category === 'animals' ? 'Hangi hayvan?' : 'Hangi ülke?';
  const placeholderText = category === 'cities' ? 'Şehrin adını yaz…' : category === 'animals' ? 'Hayvanın adını yaz…' : 'Ülkenin adını yaz…';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleBack}
    >
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleBack} />
        </Animated.View>

        {/* Card */}
        <Animated.View
          style={[
            styles.cardWrap,
            { width: modalWidth, opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Red wrong flash overlay */}
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, styles.flashOverlay, { opacity: flashAnim }]}
          />

          {/* Card gradient background */}
          <LinearGradient
            colors={['#0f1128', '#141830', '#0a0d1e']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.cardBg}
          />

          {/* Top accent line */}
          <LinearGradient
            colors={['#6366f1', '#a855f7', '#ec4899']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.topAccent}
          />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.hintPill}>
              <Text style={styles.hintPillText}>{hintLabel}</Text>
            </View>
            {wrongCount > 0 && (
              <View style={styles.wrongBadge}>
                <Text style={styles.wrongBadgeText}>{wrongCount} ✗</Text>
              </View>
            )}
          </View>

          {/* Question */}
          <View style={styles.questionBlock}>
            <Text style={styles.questionLabel}>{questionLabel}</Text>
            <Text style={styles.questionSub}>Cevabını biliyorsan yaz!</Text>
          </View>

          {/* Letter blanks — slides in when shown */}
          {blanksVisible && (
            <LetterBlanks
              answer={answer}
              revealedPositions={revealedPositions}
            />
          )}

          {/* Input */}
          <Animated.View style={[styles.inputWrap, { transform: [{ translateX: shakeAnim }] }]}>
            <LinearGradient
              colors={['rgba(99,102,241,0.15)', 'rgba(168,85,247,0.08)']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.inputGradientBorder}
            >
              <View style={styles.inputInner}>
                <Ionicons name="search-outline" size={20} color="rgba(165,180,252,0.6)" style={styles.inputIcon} />
                <TextInput
                  ref={inputRef}
                  style={styles.textInput}
                  value={text}
                  onChangeText={setText}
                  placeholder={placeholderText}
                  placeholderTextColor="rgba(255,255,255,0.22)"
                  onSubmitEditing={handleSubmit}
                  returnKeyType="done"
                  autoCorrect={false}
                  autoCapitalize="none"
                  selectionColor="#a855f7"
                />
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Wrong feedback */}
          {wrongCount > 0 && (
            <View style={styles.wrongRow}>
              <Ionicons name="close-circle" size={16} color="#f87171" />
              <Text style={styles.wrongText}>
                {isLastHint ? 'Yanlış! Son ipucuna ulaştın.' : 'Yanlış! Yeni ipucu açıldı.'}
              </Text>
            </View>
          )}

          {/* Hint buttons — H3, H1, H7 */}
          <HintSection
            answer={answer}
            revealedPositions={revealedPositions}
            wrongCount={wrongCount}
            letterCountShown={letterCountShown}
            onShowLetterCount={() => { hapticLight(); setLetterCountShown(true); }}
            onRevealFirstLetter={onRevealFirstLetter}
            onRevealRandomLetter={onRevealRandomLetter}
          />

          {/* Submit button */}
          <TouchableOpacity onPress={handleSubmit} activeOpacity={0.85} style={styles.submitWrap}>
            <LinearGradient
              colors={['#6366f1', '#8b5cf6', '#a855f7']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.submitBtn}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0)']}
                start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
              <Text style={styles.submitLabel}>Cevapla</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Back to clues */}
          <TouchableOpacity onPress={handleBack} activeOpacity={0.75} style={styles.backBtn}>
            <Ionicons name="arrow-back-outline" size={18} color="rgba(165,180,252,0.7)" />
            <Text style={styles.backLabel}>İpuçlarına dön</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.88)',
  },
  cardWrap: {
    borderRadius: 32, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.25)',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5, shadowRadius: 32, elevation: 24,
  },
  cardBg:      { ...StyleSheet.absoluteFill },
  topAccent:   { height: 3 },
  flashOverlay: {
    borderRadius: 32,
    backgroundColor: 'rgba(239,68,68,0.12)',
    zIndex: 10,
  },

  // header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 22, paddingTop: 16, paddingBottom: 4, gap: 10,
  },
  hintPill: {
    backgroundColor: 'rgba(99,102,241,0.18)',
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.35)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  hintPillText: { color: '#a5b4fc', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  wrongBadge: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  wrongBadgeText: { color: '#f87171', fontSize: 11, fontWeight: '700' },

  // question
  questionBlock: {
    paddingHorizontal: 22, paddingTop: 14, paddingBottom: 16, gap: 4,
  },
  questionLabel: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  questionSub:   { color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: '500' },

  // input
  inputWrap: { marginHorizontal: 18, marginBottom: 10 },
  inputGradientBorder: { borderRadius: 18, padding: 1.5 },
  inputInner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(10,12,30,0.95)',
    borderRadius: 17, paddingLeft: 14, paddingRight: 8, paddingVertical: 4,
  },
  inputIcon:  { marginRight: 8 },
  textInput: {
    flex: 1, color: '#fff', fontSize: 17,
    paddingVertical: 13, fontWeight: '500',
  },

  // wrong feedback
  wrongRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 7, marginHorizontal: 20, marginBottom: 10,
  },
  wrongText: { color: '#f87171', fontSize: 13, fontWeight: '600', flex: 1 },

  // submit
  submitWrap: {
    marginHorizontal: 18, marginBottom: 14,
    borderRadius: 18, overflow: 'hidden',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 14, elevation: 10,
  },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 18,
  },
  submitLabel: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },

  // divider
  divider: {
    height: 1, marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 12,
  },

  // back
  backBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    paddingBottom: 18, paddingTop: 2,
  },
  backLabel: { color: 'rgba(165,180,252,0.7)', fontSize: 14, fontWeight: '600' },
});
