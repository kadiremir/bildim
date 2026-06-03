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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { hapticLight } from '../utils/haptics';
import { playSound } from '../utils/sounds';

interface Props {
  visible: boolean;
  category: string;
  hintIndex: number;
  totalHints: number;
  wrongCount: number;
  shakeSignal: number;
  isLastHint: boolean;
  onSubmit: (guess: string) => void;
  onBackToClues: () => void;
}

export function GuessModal({
  visible,
  category,
  hintIndex,
  totalHints,
  wrongCount,
  shakeSignal,
  isLastHint,
  onSubmit,
  onBackToClues,
}: Props) {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  // entrance / exit
  const scaleAnim   = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // shake
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // wrong flash
  const flashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setText('');
      Animated.parallel([
        Animated.spring(scaleAnim,   { toValue: 1,   tension: 80, friction: 10, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1,   duration: 220, useNativeDriver: true }),
        Animated.timing(backdropAnim,{ toValue: 1,   duration: 280, useNativeDriver: true }),
      ]).start(() => inputRef.current?.focus());
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim,   { toValue: 0.88, duration: 160, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0,    duration: 160, useNativeDriver: true }),
        Animated.timing(backdropAnim,{ toValue: 0,    duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim, backdropAnim]);

  // shake + flash on wrong
  useEffect(() => {
    if (shakeSignal === 0) return;
    // red flash
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
    // shake
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

  const hintLabel = `${hintIndex + 1}. ipucundasın`;
  const questionLabel = category === 'cities' ? 'Hangi şehir?' : category === 'animals' ? 'Hangi hayvan?' : 'Hangi ülke?';
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
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Red wrong flash overlay */}
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              styles.flashOverlay,
              { opacity: flashAnim },
            ]}
          />

          {/* Card gradient background */}
          <LinearGradient
            colors={['#0f1128', '#141830', '#0a0d1e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardBg}
          />

          {/* Top accent line */}
          <LinearGradient
            colors={['#6366f1', '#a855f7', '#ec4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
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

          {/* Input */}
          <Animated.View style={[styles.inputWrap, { transform: [{ translateX: shakeAnim }] }]}>
            <LinearGradient
              colors={['rgba(99,102,241,0.15)', 'rgba(168,85,247,0.08)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
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

          {/* Submit button */}
          <TouchableOpacity onPress={handleSubmit} activeOpacity={0.85} style={styles.submitWrap}>
            <LinearGradient
              colors={['#6366f1', '#8b5cf6', '#a855f7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitBtn}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0)']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.88)',
  },
  cardWrap: {
    width: '70%',
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.25)',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 24,
  },
  cardBg: {
    ...StyleSheet.absoluteFillObject,
  },
  topAccent: {
    height: 3,
    marginHorizontal: 0,
  },
  flashOverlay: {
    borderRadius: 32,
    backgroundColor: 'rgba(239,68,68,0.12)',
    zIndex: 10,
  },

  // header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 4,
    gap: 10,
  },
  hintPill: {
    backgroundColor: 'rgba(99,102,241,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.35)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  hintPillText: {
    color: '#a5b4fc',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  wrongBadge: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  wrongBadgeText: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: '700',
  },

  // question
  questionBlock: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 4,
  },
  questionLabel: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  questionSub: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    fontWeight: '500',
  },

  // input
  inputWrap: {
    marginHorizontal: 18,
    marginBottom: 12,
  },
  inputGradientBorder: {
    borderRadius: 18,
    padding: 1.5,
  },
  inputInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10,12,30,0.95)',
    borderRadius: 17,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 4,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    color: '#fff',
    fontSize: 17,
    paddingVertical: 13,
    fontWeight: '500',
  },

  // wrong feedback
  wrongRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  wrongText: {
    color: '#f87171',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  // submit
  submitWrap: {
    marginHorizontal: 18,
    marginBottom: 16,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 18,
  },
  submitLabel: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // divider
  divider: {
    height: 1,
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: 14,
  },

  // back
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 20,
    paddingTop: 2,
  },
  backLabel: {
    color: 'rgba(165,180,252,0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
});
