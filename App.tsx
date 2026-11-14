import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { enableScreens } from 'react-native-screens';

import { ThemeProvider, useAppTheme } from './src/theme/ThemeContext';
import { RootNavigator } from './src/navigation/RootNavigator';

enableScreens(true);

const AppContent: React.FC = () => {
  const { isHighContrast } = useAppTheme();

  return (
    <>
      <StatusBar style={isHighContrast ? 'light' : 'dark'} />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
