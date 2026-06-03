import React, { useState } from 'react';
import { View } from 'react-native';
import { useFonts, Kalam_700Bold } from '@expo-google-fonts/kalam';
import { LandingScreen } from './src/screens/LandingScreen';
import { GameScreen } from './src/screens/GameScreen';
import { AuroraBackground } from './src/components/AuroraBackground';

type Screen = { name: 'landing' } | { name: 'game'; category: string };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'landing' });
  const [fontsLoaded] = useFonts({ Kalam_700Bold });
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: '#020c18' }} />;

  return (
    <View style={{ flex: 1, backgroundColor: '#020c18' }}>
      {/* Persistent app-wide background — shared across all screens */}
      <AuroraBackground />

      {screen.name === 'game' ? (
        <GameScreen
          category={screen.category}
          onBack={() => setScreen({ name: 'landing' })}
        />
      ) : (
        <LandingScreen
          onSelect={(id) => setScreen({ name: 'game', category: id })}
        />
      )}
    </View>
  );
}
