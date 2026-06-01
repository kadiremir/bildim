import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';

interface Props {
  value: number;
  style?: object;
}

export function AnimatedCounter({ value, style }: Props) {
  const [displayed, setDisplayed] = useState(value);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prev = useRef(value);

  useEffect(() => {
    if (value === prev.current) return;
    const diff = value - prev.current;
    const steps = Math.min(Math.abs(diff), 30);
    const stepSize = diff / steps;
    let current = prev.current;
    prev.current = value;

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.35, duration: 120, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    let step = 0;
    const interval = setInterval(() => {
      step++;
      current += stepSize;
      setDisplayed(Math.round(current));
      if (step >= steps) {
        clearInterval(interval);
        setDisplayed(value);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [value]);

  return (
    <Animated.Text style={[style, { transform: [{ scale: scaleAnim }] }]}>
      {displayed}
    </Animated.Text>
  );
}
