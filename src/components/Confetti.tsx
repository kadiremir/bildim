import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View, useWindowDimensions } from 'react-native';

const COLORS = [
  '#F59E0B', '#3B82F6', '#10B981', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#FBBF24',
];

const PARTICLE_COUNT = 60;

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.Value;
  opacity: Animated.Value;
  targetX: number;
  targetY: number;
  fallY: number;
  duration: number;
  spin: number;
  color: string;
  size: number;
  shape: 'rect' | 'circle';
}

function createParticle(originX: number, originY: number): Particle {
  const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.35;
  const speed = 180 + Math.random() * 320;

  return {
    x: new Animated.Value(originX),
    y: new Animated.Value(originY),
    rotate: new Animated.Value(0),
    opacity: new Animated.Value(1),
    targetX: originX + Math.cos(angle) * speed,
    targetY: originY + Math.sin(angle) * speed,
    fallY: originY + 600,
    duration: 900 + Math.random() * 400,
    spin: (Math.random() - 0.5) * 1440,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 6 + Math.random() * 8,
    shape: Math.random() > 0.4 ? 'rect' : 'circle',
  };
}

interface Props {
  trigger: number;
  originX?: number;
  originY?: number;
}

export function Confetti({ trigger, originX, originY }: Props) {
  const { width, height } = useWindowDimensions();
  const resolvedOriginX = originX ?? width / 2;
  const resolvedOriginY = originY ?? height / 2;
  const [particles, setParticles] = useState<Particle[]>([]);
  const animations = useRef<Animated.CompositeAnimation[]>([]);
  const prevTrigger = useRef(-1);

  useEffect(() => {
    if (trigger === prevTrigger.current || trigger === 0) return undefined;
    prevTrigger.current = trigger;
    animations.current.forEach((animation) => animation.stop());

    const nextParticles = Array.from({ length: PARTICLE_COUNT }, () =>
      createParticle(resolvedOriginX, resolvedOriginY)
    );
    setParticles(nextParticles);

    const frame = requestAnimationFrame(() => {
      animations.current = nextParticles.map((p) => Animated.parallel([
        Animated.timing(p.x, {
          toValue: p.targetX,
          duration: p.duration,
          useNativeDriver: false,
        }),
        Animated.sequence([
          Animated.timing(p.y, {
            toValue: p.targetY,
            duration: 500 + Math.random() * 200,
            useNativeDriver: false,
          }),
          Animated.timing(p.y, {
            toValue: p.fallY,
            duration: 600 + Math.random() * 300,
            useNativeDriver: false,
          }),
        ]),
        Animated.timing(p.rotate, {
          toValue: p.spin,
          duration: 1100 + Math.random() * 400,
          useNativeDriver: false,
        }),
        Animated.sequence([
          Animated.delay(400),
          Animated.timing(p.opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: false,
          }),
        ]),
      ]));
      animations.current.forEach((animation) => animation.start());
    });

    const clearTimer = setTimeout(() => {
      setParticles([]);
      animations.current = [];
    }, 1800);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(clearTimer);
      animations.current.forEach((animation) => animation.stop());
    };
  }, [resolvedOriginX, resolvedOriginY, trigger]);

  if (!particles.length) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => {
        const rotate = p.rotate.interpolate({
          inputRange: [-1440, 1440],
          outputRange: ['-1440deg', '1440deg'],
        });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.shape === 'rect' ? p.size * 0.5 : p.size,
              borderRadius: p.shape === 'circle' ? p.size / 2 : 2,
              backgroundColor: p.color,
              opacity: p.opacity,
              transform: [{ rotate }],
            }}
          />
        );
      })}
    </View>
  );
}
