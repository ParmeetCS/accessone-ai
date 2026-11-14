import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  LayoutGrid,
  Eye,
  Ear,
  MessageSquare,
  ShieldAlert,
  Settings,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeScreen } from '../screens/HomeScreen';
import { VisionScreen } from '../screens/VisionScreen';
import { HearingScreen } from '../screens/HearingScreen';
import { BridgeScreen } from '../screens/BridgeScreen';
import { SafetyScreen } from '../screens/SafetyScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

import { PersistentHeader } from '../components/PersistentHeader';
import { useAppTheme } from '../theme/ThemeContext';

export type RootTabParamList = {
  Dashboard: undefined;
  Vision: undefined;
  Hearing: undefined;
  Bridge: undefined;
  Safety: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export const RootNavigator: React.FC = () => {
  const { colors, scaleFont } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.rootContainer, { backgroundColor: colors.background }]}>
      {/* Top Persistent Header across all screens */}
      <PersistentHeader />

      {/* 6-Tab Bottom Navigation Bar */}
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.secondary,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: StyleSheet.hairlineWidth,
            height: Platform.OS === 'ios' ? 84 : 68 + insets.bottom,
            paddingBottom: Math.max(insets.bottom, 8),
            paddingTop: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.04,
            shadowRadius: 6,
            elevation: 8,
          },
          tabBarLabelStyle: {
            fontSize: scaleFont(10),
            fontWeight: '600',
            marginTop: 2,
          },
          tabBarItemStyle: {
            minHeight: 48,
          },
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={HomeScreen}
          options={{
            tabBarLabel: 'Dashboard',
            tabBarAccessibilityLabel: 'Dashboard tab, navigate to main home screen',
            tabBarIcon: ({ color, focused }) => (
              <LayoutGrid size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            ),
          }}
        />

        <Tab.Screen
          name="Vision"
          component={VisionScreen}
          options={{
            tabBarLabel: 'Vision',
            tabBarAccessibilityLabel: 'Vision Assist tab, navigate to optical OCR and camera',
            tabBarIcon: ({ color, focused }) => (
              <Eye size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            ),
          }}
        />

        <Tab.Screen
          name="Hearing"
          component={HearingScreen}
          options={{
            tabBarLabel: 'Hearing',
            tabBarAccessibilityLabel: 'Hearing Assist tab, navigate to live audio transcription and sound radar',
            tabBarIcon: ({ color, focused }) => (
              <Ear size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            ),
          }}
        />

        <Tab.Screen
          name="Bridge"
          component={BridgeScreen}
          options={{
            tabBarLabel: 'Bridge',
            tabBarAccessibilityLabel: 'Bridge Communication tab, navigate to dual channel conversation and ASL',
            tabBarIcon: ({ color, focused }) => (
              <MessageSquare size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            ),
          }}
        />

        <Tab.Screen
          name="Safety"
          component={SafetyScreen}
          options={{
            tabBarLabel: 'Safety',
            tabBarAccessibilityLabel: 'Safety Assist tab, navigate to emergency SOS and care circle',
            tabBarIcon: ({ color, focused }) => (
              <ShieldAlert size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            ),
          }}
        />

        <Tab.Screen
          name="Settings"
          component={ProfileScreen}
          options={{
            tabBarLabel: 'Settings',
            tabBarAccessibilityLabel: 'Settings tab, navigate to accessibility preferences and calibration',
            tabBarIcon: ({ color, focused }) => (
              <Settings size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            ),
          }}
        />
      </Tab.Navigator>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
});
