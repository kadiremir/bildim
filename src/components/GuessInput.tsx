import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { hapticLight } from '../utils/haptics';
import { playSound } from '../utils/sounds';

interface Props {
  onSubmit: (guess: string) => void;
  shakeSignal: number;
}

export function GuessInput({ onSubmit, shakeSignal }: Props) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const prevShake = useRef(shakeSignal);

  if (shakeSignal !== prevShake.current) {
    prevShake.current = shakeSignal;
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 14, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -14, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }

  const handleSubmit = () => {
    if (!text.trim()) return;
    hapticLight();
    playSound('tap');
    onSubmit(text.trim());
    setText('');
  };

  return (
    <Animated.View style={[styles.wrap, { transform: [{ translateX: shakeAnim }] }]}>
      <View style={[styles.box, focused && styles.boxFocused]}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Ülkenin adını yaz…"
          placeholderTextColor="rgba(255,255,255,0.22)"
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
          autoCorrect={false}
          autoCapitalize="words"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <TouchableOpacity onPress={handleSubmit} activeOpacity={0.85}>
          <LinearGradient
            colors={['#4F46E5', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btn}
          >
            <Text style={styles.btnText}>→</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 20 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingLeft: 20,
    paddingRight: 6,
    paddingVertical: 6,
  },
  boxFocused: {
    borderColor: 'rgba(99,102,241,0.7)',
    backgroundColor: 'rgba(99,102,241,0.08)',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 17,
    paddingVertical: 11,
    fontWeight: '500',
  },
  btn: {
    borderRadius: 14,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
});
