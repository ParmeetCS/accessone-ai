import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Accessibility, Contrast, ShieldAlert, Sparkles } from 'lucide-react-native';
import { useAppTheme } from '../theme/ThemeContext';

export const PersistentHeader: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, fontScale, scaleFont, isHighContrast, toggleHighContrast, cycleFontScale } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
          paddingTop: Math.max(insets.top, 12),
        },
      ]}
      accessible={true}
      accessibilityRole="header"
    >
      <View style={styles.contentRow}>
        {/* Brand / Logo */}
        <TouchableOpacity
          style={styles.logoGroup}
          onPress={() => navigation.navigate('Dashboard')}
          accessibilityLabel="AccessOne Clinical AI home"
          accessibilityHint="Navigates to main dashboard"
          accessibilityRole="button"
          activeOpacity={0.7}
        >
          <View style={[styles.logoIconBox, { backgroundColor: colors.primary }]}>
            <Accessibility size={20} color={colors.onPrimary} strokeWidth={2.5} />
          </View>
          <View style={styles.logoTextBox}>
            <View style={styles.brandTitleRow}>
              <Text style={[styles.brandTitle, { color: colors.text, fontSize: scaleFont(17) }]}>
                AccessOne
              </Text>
              <Sparkles size={12} color={colors.primary} style={styles.sparkleIcon} />
            </View>
            <Text
              style={[
                styles.brandSubtitle,
                { color: colors.textMuted, fontSize: scaleFont(10) },
              ]}
            >
              CLINICAL AI
            </Text>
          </View>
        </TouchableOpacity>

        {/* Right Action Tools: Font Scale, Contrast, SOS */}
        <View style={styles.rightActions}>
          {/* Font Scale Stepper */}
          <View
            style={[
              styles.fontControlGroup,
              { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border },
            ]}
            accessibilityRole="toolbar"
            accessibilityLabel="Text size controls"
          >
            <TouchableOpacity
              style={[
                styles.fontMiniBtn,
                fontScale === 'sm' && { backgroundColor: colors.primary },
              ]}
              onPress={() => cycleFontScale('down')}
              accessibilityLabel="Decrease text size"
              accessibilityHint="Scales font smaller across the app"
              accessibilityRole="button"
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <Text
                style={[
                  styles.fontBtnText,
                  { color: fontScale === 'sm' ? colors.onPrimary : colors.text },
                ]}
              >
                A-
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.fontMiniBtn,
                fontScale === 'std' && { backgroundColor: colors.primary },
              ]}
              onPress={() => cycleFontScale('std')}
              accessibilityLabel="Standard text size"
              accessibilityHint="Resets text size to standard"
              accessibilityRole="button"
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <Text
                style={[
                  styles.fontBtnText,
                  { color: fontScale === 'std' ? colors.onPrimary : colors.text, fontWeight: '700' },
                ]}
              >
                Std
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.fontMiniBtn,
                (fontScale === 'lg' || fontScale === 'xl') && { backgroundColor: colors.primary },
              ]}
              onPress={() => cycleFontScale('up')}
              accessibilityLabel="Increase text size"
              accessibilityHint="Scales font larger across the app"
              accessibilityRole="button"
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <Text
                style={[
                  styles.fontBtnText,
                  {
                    color: fontScale === 'lg' || fontScale === 'xl' ? colors.onPrimary : colors.text,
                  },
                ]}
              >
                A+
              </Text>
            </TouchableOpacity>
          </View>

          {/* Contrast Toggle */}
          <TouchableOpacity
            style={[
              styles.actionIconButton,
              {
                backgroundColor: isHighContrast ? colors.primary : colors.surfaceContainerLow,
                borderColor: colors.border,
              },
            ]}
            onPress={toggleHighContrast}
            accessibilityLabel={`Toggle High Contrast Mode. Currently ${isHighContrast ? 'enabled' : 'disabled'}`}
            accessibilityHint="Switches between clinical light and maximum contrast black themes"
            accessibilityRole="switch"
            accessibilityState={{ checked: isHighContrast }}
            activeOpacity={0.75}
          >
            <Contrast
              size={18}
              color={isHighContrast ? colors.onPrimary : colors.text}
              strokeWidth={2.2}
            />
          </TouchableOpacity>

          {/* Quick SOS Shortcut Button */}
          <TouchableOpacity
            style={[styles.sosShortcutBtn, { backgroundColor: colors.sos }]}
            onPress={() => navigation.navigate('Safety')}
            accessibilityLabel="Emergency SOS Assistance shortcut"
            accessibilityHint="Immediately opens the Safety Assist emergency dispatch hub"
            accessibilityRole="button"
            activeOpacity={0.85}
          >
            <ShieldAlert size={16} color={colors.onSos} strokeWidth={2.5} />
            <Text style={[styles.sosBtnText, { color: colors.onSos }]}>SOS</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 10,
    paddingHorizontal: 16,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  logoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingRight: 6,
  },
  logoIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logoTextBox: {
    justifyContent: 'center',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brandTitle: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sparkleIcon: {
    marginTop: -2,
  },
  brandSubtitle: {
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fontControlGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 2,
    height: 38,
  },
  fontMiniBtn: {
    paddingHorizontal: 7,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 28,
  },
  fontBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionIconButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  sosBtnText: {
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
