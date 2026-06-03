import React, { useState } from 'react';
import { View } from 'react-native';
import { useFonts, Kalam_700Bold } from '@expo-google-fonts/kalam';
import { LandingScreen } from './src/screens/LandingScreen';
import { GameScreen } from './src/screens/GameScreen';

type Screen = { name: 'landing' } | { name: 'game'; category: string };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'landing' });
  const [fontsLoaded] = useFonts({ Kalam_700Bold });
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: '#09071A' }} />;

  if (screen.name === 'game') {
    return (
      <GameScreen
        category={screen.category}
        onBack={() => setScreen({ name: 'landing' })}
      />
    );
  }

  return (
    <LandingScreen
      onSelect={(id) => setScreen({ name: 'game', category: id })}
    />
  );
}
