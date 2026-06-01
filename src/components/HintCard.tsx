import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';
import { Hint } from '../data/countries';

interface Props {
  hints: Hint[];
  revealedCount: number;
}

function HintRow({ hint, index, isNew }: { hint: Hint; index: number; isNew: boolean }) {
  const fadeAnim = useRef(new Animated.Value(isNew ? 0 : 1)).current;
  const slideAnim = useRef(new Animated.Value(isNew ? 16 : 0)).current;

  useEffect(() => {
    if (isNew) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, []);

  return (
    <Animated.View
      style={[
        styles.hintRow,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{index + 1}</Text>
      </View>
      <View style={styles.hintContent}>
        {hint.type === 'text' ? (
          <Text style={styles.hintText}>{hint.content}</Text>
        ) : (
          <View>
            <Image source={{ uri: hint.uri }} style={styles.image} resizeMode="cover" />
            {hint.caption ? <Text style={styles.caption}>{hint.caption}</Text> : null}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

export function HintCard({ hints, revealedCount }: Props) {
  const visible = hints.slice(0, revealedCount);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotMid]} />
        <View style={[styles.dot, styles.dotDim]} />
        <Text style={styles.cardLabel}>CLUES</Text>
      </View>

      {visible.map((hint, i) => (
        <HintRow key={i} hint={hint} index={i} isNew={i === revealedCount - 1} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4ade80',
  },
  dotMid: {
    backgroundColor: '#facc15',
  },
  dotDim: {
    backgroundColor: '#f87171',
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginLeft: 8,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 18,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(99,179,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99,179,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  badgeText: {
    color: '#63b3ff',
    fontSize: 12,
    fontWeight: '800',
  },
  hintContent: {
    flex: 1,
  },
  hintText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '400',
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  caption: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
