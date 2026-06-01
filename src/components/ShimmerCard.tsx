import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface Props {
  children: React.ReactNode;
  style?: object;
  enabled?: boolean;
  shimmerColor?: string;
}

export function ShimmerCard({ children, style, enabled = true, shimmerColor = 'rgba(255,255,255,0.06)' }: Props) {
  const shimmerX = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    if (!enabled) return;
    Animated.loop(
      Animated.sequence([
        Animated.delay(2000 + Math.random() * 2000),
        Animated.timing(shimmerX, {
          toValue: 2,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerX, { toValue: -1, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, [enabled]);

  const translateX = shimmerX.interpolate({
    inputRange: [-1, 2],
    outputRange: [-300, 300],
  });

  return (
    <View style={[styles.wrap, style]}>
      {children}
      {enabled && (
        <Animated.View
          style={[styles.shimmer, { transform: [{ translateX }, { rotate: '20deg' }] }]}
          pointerEvents="none"
        >
          <View style={[styles.shimmerBar, { backgroundColor: shimmerColor }]} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
  shimmer: {
    position: 'absolute',
    top: -200,
    bottom: -200,
    width: 80,
  },
  shimmerBar: {
    flex: 1,
    width: '100%',
  },
});
