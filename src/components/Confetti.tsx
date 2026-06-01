import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

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
  color: string;
  size: number;
  shape: 'rect' | 'circle';
}

function createParticle(originX: number, originY: number): Particle {
  const angle = Math.random() * Math.PI * 2;
  const speed = 180 + Math.random() * 260;
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed - 260; // upward bias

  return {
    x: new Animated.Value(originX),
    y: new Animated.Value(originY),
    rotate: new Animated.Value(0),
    opacity: new Animated.Value(1),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 6 + Math.random() * 8,
    shape: Math.random() > 0.4 ? 'rect' : 'circle',
  };
}

interface Props {
  trigger: number; // increment to fire
  originX?: number;
  originY?: number;
}

export function Confetti({ trigger, originX = width / 2, originY = height / 2 }: Props) {
  const particles = useRef<Particle[]>([]);
  const prevTrigger = useRef(-1);

  useEffect(() => {
    if (trigger === prevTrigger.current || trigger === 0) return;
    prevTrigger.current = trigger;

    particles.current = Array.from({ length: PARTICLE_COUNT }, () =>
      createParticle(originX, originY)
    );

    particles.current.forEach((p) => {
      const angle = Math.atan2(
        (p.y as any)._value - originY,
        (p.x as any)._value - originX,
      );
      const speed = 200 + Math.random() * 300;
      const targetX = originX + Math.cos(angle + Math.random() - 0.5) * speed;
      const targetY = originY + Math.sin(angle + Math.random() - 0.5) * speed - 180;

      Animated.parallel([
        Animated.timing(p.x, {
          toValue: targetX,
          duration: 900 + Math.random() * 400,
          useNativeDriver: false,
        }),
        Animated.sequence([
          Animated.timing(p.y, {
            toValue: targetY,
            duration: 500 + Math.random() * 200,
            useNativeDriver: false,
          }),
          Animated.timing(p.y, {
            toValue: originY + 600,
            duration: 600 + Math.random() * 300,
            useNativeDriver: false,
          }),
        ]),
        Animated.timing(p.rotate, {
          toValue: (Math.random() - 0.5) * 1440,
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
      ]).start();
    });
  }, [trigger]);

  if (!particles.current.length) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.current.map((p, i) => {
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
