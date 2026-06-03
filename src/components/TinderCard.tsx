import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  PanResponder,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Hint } from '../data/types';
import { hapticLight, hapticMedium } from '../utils/haptics';
import { playSound } from '../utils/sounds';

// ─── Typewriter text ─────────────────────────────────────────────────────────

interface TypewriterProps {
  text: string;
  style?: object;
  speed?: number;        // ms per character
  startDelay?: number;   // ms before first character
}

function TypewriterText({ text, style, speed = 22, startDelay = 180 }: TypewriterProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const cursorOpacity = useRef(new Animated.Value(1)).current;
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setVisibleCount(0);
    cursorOpacity.setValue(1);

    if (speed <= 0) {
      setVisibleCount(text.length);
      cursorOpacity.setValue(0);
      return undefined;
    }

    // Blinking cursor loop
    const cursorAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(cursorOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ])
    );
    cursorAnim.start();

    timeoutRef.current = setTimeout(() => {
      let i = 0;
      intervalRef.current = setInterval(() => {
        i++;
        setVisibleCount(i);
        if (i >= text.length) {
          clearInterval(intervalRef.current!);
          // Stop cursor blink after typing finishes
          finishTimeoutRef.current = setTimeout(() => {
            cursorAnim.stop();
            cursorOpacity.setValue(0);
          }, 800);
        }
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(timeoutRef.current!);
      clearTimeout(finishTimeoutRef.current!);
      clearInterval(intervalRef.current!);
      cursorAnim.stop();
    };
  }, [cursorOpacity, speed, startDelay, text]);

  const shown  = text.slice(0, visibleCount);
  const hidden = text.slice(visibleCount);

  return (
    <Text style={style}>
      {shown}
      <Animated.Text style={{ opacity: cursorOpacity, color: '#6366f1' }}>|</Animated.Text>
      {/* Invisible placeholder keeps layout stable during typing */}
      <Text style={{ opacity: 0 }}>{hidden}</Text>
    </Text>
  );
}

// ─── Animated image reveal ────────────────────────────────────────────────────

function AnimatedImage({ uri, caption, height }: { uri: string; caption?: string; height: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(1.05)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, delay: 200, useNativeDriver: true }),
      Animated.spring(scale,   { toValue: 1, delay: 200, tension: 60, friction: 12, useNativeDriver: true }),
    ]).start();
  }, [uri]);

  return (
    <View style={[styles.imageWrap, { height }]}>
      <Animated.View style={{ flex: 1, opacity, transform: [{ scale }] }}>
        <Image source={{ uri }} style={styles.image} resizeMode="cover" />
      </Animated.View>
      {caption && (
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.72)']}
          style={styles.captionOverlay}
        >
          <Text style={styles.caption}>{caption}</Text>
        </LinearGradient>
      )}
    </View>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

interface Props {
  hint: Hint;
  hintIndex: number;
  totalHints: number;
  stackIndex: number;
  isTop: boolean;
  cardWidth: number;
  cardHeight: number;
  screenWidth: number;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

export function TinderCard({
  hint,
  hintIndex,
  totalHints,
  stackIndex,
  isTop,
  cardWidth,
  cardHeight,
  screenWidth,
  onSwipeLeft,
  onSwipeRight,
}: Props) {
  const pan       = useRef(new Animated.ValueXY()).current;
  const entryAnim = useRef(new Animated.Value(stackIndex === 0 ? 0 : 1)).current;

  // Spring-in when this card becomes the top
  useEffect(() => {
    if (stackIndex === 0) {
      Animated.spring(entryAnim, {
        toValue: 1,
        tension: 55,
        friction: 9,
        useNativeDriver: true,
      }).start();
    }
  }, [stackIndex]);

  const swipeThreshold = cardWidth * 0.28;
  const offscreenX = screenWidth * 1.6;

  const rotate = pan.x.interpolate({
    inputRange: [-screenWidth, 0, screenWidth],
    outputRange: ['-18deg', '0deg', '18deg'],
    extrapolate: 'clamp',
  });

  const leftLabelOpacity  = pan.x.interpolate({ inputRange: [-swipeThreshold, -swipeThreshold * 0.3], outputRange: [1, 0], extrapolate: 'clamp' });
  const rightLabelOpacity = pan.x.interpolate({ inputRange: [swipeThreshold * 0.3, swipeThreshold],   outputRange: [0, 1], extrapolate: 'clamp' });
  const leftBorderOpacity = pan.x.interpolate({ inputRange: [-swipeThreshold, 0], outputRange: [1, 0], extrapolate: 'clamp' });
  const rightBorderOpacity= pan.x.interpolate({ inputRange: [0, swipeThreshold], outputRange: [0, 1], extrapolate: 'clamp' });

  const panResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => isTop,
      onMoveShouldSetPanResponder:  (_, g) => isTop && Math.abs(g.dx) > 6,
      onPanResponderGrant:  () => hapticLight(),
      onPanResponderMove:   Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        if (g.dx < -swipeThreshold) {
          hapticMedium(); playSound('swipe');
          Animated.timing(pan, { toValue: { x: -offscreenX, y: g.dy + 30 }, duration: 250, useNativeDriver: false })
            .start(() => { pan.setValue({ x: 0, y: 0 }); onSwipeLeft(); });
        } else if (g.dx > swipeThreshold) {
          hapticMedium(); playSound('tap');
          Animated.timing(pan, { toValue: { x: offscreenX, y: g.dy + 30 }, duration: 250, useNativeDriver: false })
            .start(() => { pan.setValue({ x: 0, y: 0 }); onSwipeRight(); });
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 5, tension: 60, useNativeDriver: false }).start();
        }
      },
    }),
    [isTop, offscreenX, onSwipeLeft, onSwipeRight, pan, swipeThreshold]
  );

  const stackScale = 1 - stackIndex * 0.05;
  const stackY     = -stackIndex * 12;

  const cardStyle = isTop
    ? {
        transform: [
          { translateX: pan.x },
          { translateY: pan.y },
          { rotate },
          { scale: entryAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
        ],
        opacity: entryAnim,
      }
    : {
        transform: [{ scale: stackScale }, { translateY: stackY }],
        opacity: 0.85 - stackIndex * 0.15,
      };

  return (
    <Animated.View
      style={[styles.card, { width: cardWidth, height: cardHeight }, cardStyle, { zIndex: 20 - stackIndex }]}
      accessibilityElementsHidden={!isTop}
      importantForAccessibility={isTop ? 'auto' : 'no-hide-descendants'}
      pointerEvents={isTop ? 'auto' : 'none'}
      {...(isTop ? panResponder.panHandlers : {})}
    >
      <LinearGradient
        colors={['#1a1e45', '#222860', '#1a1e45']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardInner}
      >
        {/* Swipe tints */}
        <Animated.View style={[styles.tintLeft,  { opacity: leftBorderOpacity  }]} pointerEvents="none" />
        <Animated.View style={[styles.tintRight, { opacity: rightBorderOpacity }]} pointerEvents="none" />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.clueChip}>
            <Text style={styles.clueChipText}>İPUCU {hintIndex + 1}</Text>
          </View>
          <View style={styles.dotsWrap}>
            {Array.from({ length: totalHints }).map((_, i) => (
              <View key={i} style={[styles.dot, i <= hintIndex ? styles.dotActive : styles.dotInactive]} />
            ))}
          </View>
        </View>

        {/* Hint content */}
        <View style={styles.content}>
          {!isTop ? (
            <View style={styles.lockedHint}>
              <View style={styles.lockedLineWide} />
              <View style={styles.lockedLine} />
              <Text style={styles.lockedHintText}>Kilitli ipucu</Text>
            </View>
          ) : hint.type === 'text' ? (
            <TypewriterText
              text={hint.content}
              style={styles.hintText}
              speed={20}
              startDelay={140}
            />
          ) : (
            <AnimatedImage uri={hint.uri} caption={hint.caption} height={cardHeight * 0.55} />
          )}
        </View>

        {/* Swipe labels */}
        {isTop && (
          <>
            <Animated.View style={[styles.swipeTag, styles.swipeTagLeft,  { opacity: leftLabelOpacity  }]}>
              <Text style={styles.swipeTagTextLeft}>SONRAKI</Text>
            </Animated.View>
            <Animated.View style={[styles.swipeTag, styles.swipeTagRight, { opacity: rightLabelOpacity }]}>
              <Text style={styles.swipeTagTextRight}>BİLDİM!</Text>
            </Animated.View>
          </>
        )}

        {/* Footer */}
        {isTop && stackIndex === 0 && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>← sonraki ipucu · bildim! →</Text>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 16,
  },
  cardInner: {
    flex: 1,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
    padding: 24,
  },
  tintLeft: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(59,130,246,0.5)',
  },
  tintRight: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(16,185,129,0.5)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  clueChip: {
    backgroundColor: 'rgba(99,102,241,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.45)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clueChipText: {
    color: '#a5b4fc',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  dotsWrap: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  dot:         { width: 7, height: 7, borderRadius: 3.5 },
  dotActive:   { backgroundColor: '#6366f1' },
  dotInactive: { backgroundColor: 'rgba(255,255,255,0.1)' },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  hintText: {
    color: '#F1F5F9',
    fontSize: 22,
    lineHeight: 35,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  lockedHint: {
    gap: 14,
    opacity: 0.55,
  },
  lockedLineWide: {
    width: '72%',
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  lockedLine: {
    width: '52%',
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  lockedHintText: {
    color: 'rgba(255,255,255,0.22)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  imageWrap: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
  },
  caption: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  swipeTag: {
    position: 'absolute',
    top: 28,
    borderWidth: 3,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  swipeTagLeft:  { right: 24, borderColor: '#3b82f6', transform: [{ rotate: '8deg'  }] },
  swipeTagRight: { left: 24,  borderColor: '#10b981', transform: [{ rotate: '-8deg' }] },
  swipeTagTextLeft:  { color: '#3b82f6', fontWeight: '900', fontSize: 15, letterSpacing: 1 },
  swipeTagTextRight: { color: '#10b981', fontWeight: '900', fontSize: 15, letterSpacing: 1 },
  footer: {
    alignItems: 'center',
    paddingTop: 14,
  },
  footerText: {
    color: 'rgba(255,255,255,0.18)',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
