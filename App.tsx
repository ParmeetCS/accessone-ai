import React, { useEffect } from 'react';
import { Modal } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { enableScreens } from 'react-native-screens';

import { ThemeProvider, useAppTheme } from './src/theme/ThemeContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthScreen } from './src/screens/AuthScreen';
import { useUserStore } from './src/store/userStore';

enableScreens(true);

const AppContent: React.FC = () => {
  const { isHighContrast } = useAppTheme();
  const initializeAuth = useUserStore((s) => s.initializeAuth);
  const isAuthModalVisible = useUserStore((s) => s.isAuthModalVisible);
  const closeAuthModal = useUserStore((s) => s.closeAuthModal);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <>
      <StatusBar style={isHighContrast ? 'light' : 'dark'} />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>

      {/* Accessible Authentication Flow Modal */}
      <Modal
        visible={isAuthModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeAuthModal}
      >
        <AuthScreen onClose={closeAuthModal} />
      </Modal>
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
