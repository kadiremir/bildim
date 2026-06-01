import React, { useState } from 'react';
import { LandingScreen } from './src/screens/LandingScreen';
import { GameScreen } from './src/screens/GameScreen';

type Screen = { name: 'landing' } | { name: 'game'; category: string };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'landing' });

  if (screen.name === 'game') {
    return (
      <GameScreen
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
