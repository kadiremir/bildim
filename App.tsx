import React, { useState } from 'react';
import { View } from 'react-native';
import { useFonts, Kalam_700Bold } from '@expo-google-fonts/kalam';
import { LandingScreen } from './src/screens/LandingScreen';
import { GameScreen } from './src/screens/GameScreen';
import { ConstellationBackground } from './src/components/ConstellationBackground';
import { THEMES } from './src/theme/themes';

type Screen = { name: 'landing' } | { name: 'game'; category: string };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'landing' });
  const [darkMode, setDarkMode] = useState(true);
  const [fontsLoaded] = useFonts({ Kalam_700Bold });
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: '#020c18' }} />;

  const th = darkMode ? THEMES.neonNight : THEMES.brightPop;

  return (
    <View style={{ flex: 1, backgroundColor: th.isDark ? '#07070f' : '#faf7f2' }}>
      {/* Persistent animated background — shared across all screens */}
      <ConstellationBackground th={th} />

      {screen.name === 'game' ? (
        <GameScreen
          category={screen.category}
          onBack={() => setScreen({ name: 'landing' })}
        />
      ) : (
        <LandingScreen
          darkMode={darkMode}
          onToggleDark={() => setDarkMode((d) => !d)}
          onSelect={(id) => setScreen({ name: 'game', category: id })}
        />
      )}
    </View>
  );
}
