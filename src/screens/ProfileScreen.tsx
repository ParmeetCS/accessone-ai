import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import {
  Sliders,
  Eye,
  Ear,
  Brain,
  Layers,
  Contrast,
  Volume2,
  Vibrate,
  ShieldAlert,
  CheckCircle2,
  RotateCcw,
  Sparkles,
} from 'lucide-react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { useUserStore, SensoryProfileType } from '../store/userStore';

export const ProfileScreen: React.FC = () => {
  const { colors, fontScale, scaleFont, isHighContrast, toggleHighContrast, setFontScale } = useAppTheme();

  const sensoryProfile = useUserStore((s) => s.sensoryProfile);
  const setSensoryProfile = useUserStore((s) => s.setSensoryProfile);
  const speechRate = useUserStore((s) => s.speechRate);
  const setSpeechRate = useUserStore((s) => s.setSpeechRate);
  const hapticIntensity = useUserStore((s) => s.hapticIntensity);
  const setHapticIntensity = useUserStore((s) => s.setHapticIntensity);
  const sosCountdownSeconds = useUserStore((s) => s.sosCountdownSeconds);
  const setSosCountdownSeconds = useUserStore((s) => s.setSosCountdownSeconds);

  const sensoryOptions: Array<{
    id: SensoryProfileType;
    title: string;
    desc: string;
    icon: any;
  }> = [
    {
      id: 'vision',
      title: 'Vision Assist Focus',
      desc: 'High-magnification HUD, max contrast, automatic OCR readouts.',
      icon: Eye,
    },
    {
      id: 'hearing',
      title: 'Hearing & Deaf Assist',
      desc: 'Real-time phonetic stream, haptic vibrotactile alerts, ambient radar.',
      icon: Ear,
    },
    {
      id: 'dual',
      title: 'Combined Dual-Sensory (Recommended)',
      desc: 'Synchronous acoustic haptics, multi-modal alerts & real-time sign overlay.',
      icon: Layers,
    },
    {
      id: 'cognitive',
      title: 'Cognitive & High Legibility',
      desc: 'Linearized plain language clinical notes, de-cluttered UI, high dwell targets.',
      icon: Brain,
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header context */}
      <View style={styles.headerBlock}>
        <View style={styles.headerTopBadge}>
          <View style={[styles.pulseDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.profileTag, { color: colors.primary, fontSize: scaleFont(11) }]}>
            PROFILE CALIBRATION
          </Text>
          <View style={[styles.complianceBadge, { backgroundColor: colors.primaryFixed }]}>
            <Text style={[styles.complianceText, { color: colors.onPrimaryFixed, fontSize: scaleFont(10) }]}>
              WCAG 2.2 AAA
            </Text>
          </View>
        </View>
        <Text style={[styles.screenHeading, { color: colors.text, fontSize: scaleFont(22) }]}>
          Accessibility & Settings
        </Text>
        <Text style={[styles.screenSubtitle, { color: colors.textSecondary, fontSize: scaleFont(13) }]}>
          Calibrate optical, acoustic, and cognitive neural interfaces for your clinical workflow.
        </Text>
      </View>

      {/* 2. Sensory Mode Selector (Bento Cards) */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleGroup}>
            <Sliders size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: scaleFont(16) }]}>
              Sensory Mode Profiles
            </Text>
          </View>
          <Text style={[styles.activeTag, { color: colors.primary, fontSize: scaleFont(11) }]}>
            1 Active
          </Text>
        </View>

        <View style={styles.profilesStack}>
          {sensoryOptions.map((opt) => {
            const isSelected = sensoryProfile === opt.id;
            const Icon = opt.icon;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.profileCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderWidth: isSelected ? 2 : StyleSheet.hairlineWidth,
                  },
                ]}
                onPress={() => setSensoryProfile(opt.id)}
                accessibilityLabel={`${opt.title}. ${opt.desc}. ${isSelected ? 'Selected' : 'Not selected'}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
              >
                <View style={styles.profileLeft}>
                  <View
                    style={[
                      styles.profileIconBox,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surfaceContainerLow,
                      },
                    ]}
                  >
                    <Icon size={20} color={isSelected ? colors.onPrimary : colors.textSecondary} />
                  </View>
                  <View style={styles.profileTextBox}>
                    <Text style={[styles.profileTitle, { color: colors.text, fontSize: scaleFont(14) }]}>
                      {opt.title}
                    </Text>
                    <Text style={[styles.profileDesc, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
                      {opt.desc}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.radioIndicator,
                    {
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected ? colors.primary : 'transparent',
                    },
                  ]}
                >
                  {isSelected && <CheckCircle2 size={14} color={colors.onPrimary} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 3. Display & Typography Preferences */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeaderRow}>
          <Text style={[styles.cardHeading, { color: colors.text, fontSize: scaleFont(15) }]}>
            Display & Typography
          </Text>
        </View>

        {/* Font Scale Selection */}
        <View style={styles.settingItem}>
          <View style={styles.settingItemLabelRow}>
            <Text style={[styles.settingLabel, { color: colors.text, fontSize: scaleFont(13) }]}>
              Base Typography Scale
            </Text>
            <View style={[styles.scalePill, { backgroundColor: colors.primaryFixed }]}>
              <Text style={[styles.scalePillText, { color: colors.onPrimaryFixed, fontSize: scaleFont(11) }]}>
                {fontScale.toUpperCase()} ({fontScale === 'sm' ? '0.9x' : fontScale === 'std' ? '1.0x' : fontScale === 'lg' ? '1.15x' : '1.3x'})
              </Text>
            </View>
          </View>

          <View style={styles.scaleButtonsRow}>
            {(['sm', 'std', 'lg', 'xl'] as const).map((scale) => (
              <TouchableOpacity
                key={scale}
                style={[
                  styles.scaleBtn,
                  fontScale === scale
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border },
                ]}
                onPress={() => setFontScale(scale)}
                accessibilityLabel={`Set font size to ${scale}`}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.scaleBtnText,
                    {
                      color: fontScale === scale ? colors.onPrimary : colors.text,
                      fontWeight: fontScale === scale ? '700' : '500',
                    },
                  ]}
                >
                  {scale === 'sm' ? 'Small' : scale === 'std' ? 'Standard' : scale === 'lg' ? 'Large' : 'XL'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* High Contrast Mode Switch */}
        <View style={[styles.contrastSwitchRow, { borderTopColor: colors.border }]}>
          <View style={styles.switchLabelCol}>
            <View style={styles.switchTitleRow}>
              <Contrast size={16} color={colors.primary} />
              <Text style={[styles.settingLabel, { color: colors.text, fontSize: scaleFont(13) }]}>
                High-Contrast Black Mode
              </Text>
            </View>
            <Text style={[styles.switchSub, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
              True #000000 black background with #FFFFFF text and #1ABC9C teal accents
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.switchPill,
              {
                backgroundColor: isHighContrast ? colors.primary : colors.surfaceContainerHigh,
              },
            ]}
            onPress={toggleHighContrast}
            accessibilityLabel={`Toggle high contrast mode. Currently ${isHighContrast ? 'enabled' : 'disabled'}`}
            accessibilityRole="switch"
            accessibilityState={{ checked: isHighContrast }}
          >
            <Text
              style={[
                styles.switchPillText,
                { color: isHighContrast ? colors.onPrimary : colors.text, fontSize: scaleFont(12) },
              ]}
            >
              {isHighContrast ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. Text-to-Speech (TTS) Voice Engine */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.settingIconGroup}>
            <Volume2 size={18} color={colors.primary} />
            <Text style={[styles.cardHeading, { color: colors.text, fontSize: scaleFont(15) }]}>
              Speech Rate & Audio Voice Engine
            </Text>
          </View>
          <Text style={[styles.speedRateTag, { color: colors.primary, fontSize: scaleFont(12) }]}>
            {speechRate}x
          </Text>
        </View>

        <Text style={[styles.settingDesc, { color: colors.textSecondary, fontSize: scaleFont(12) }]}>
          Configures the vocal speed for Vision OCR readouts, Bridge communication, and medical alerts.
        </Text>

        <View style={styles.speedButtonsRow}>
          {[0.85, 1.0, 1.25, 1.5].map((rate) => (
            <TouchableOpacity
              key={rate}
              style={[
                styles.speedSelectBtn,
                speechRate === rate
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border },
              ]}
              onPress={() => setSpeechRate(rate)}
              accessibilityLabel={`Set speech rate to ${rate}x`}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.speedSelectBtnText,
                  {
                    color: speechRate === rate ? colors.onPrimary : colors.text,
                    fontWeight: speechRate === rate ? '700' : '500',
                  },
                ]}
              >
                {rate}x
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 5. Sensory Haptics & SOS Trigger Settings */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 24 }]}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.settingIconGroup}>
            <ShieldAlert size={18} color={colors.sos} />
            <Text style={[styles.cardHeading, { color: colors.text, fontSize: scaleFont(15) }]}>
              Safety Assist SOS Hold Duration
            </Text>
          </View>
        </View>

        <Text style={[styles.settingDesc, { color: colors.textSecondary, fontSize: scaleFont(12) }]}>
          Number of seconds the emergency button must be held before dispatching payload to 911 CAD.
        </Text>

        <View style={styles.speedButtonsRow}>
          {[2, 3, 5].map((sec) => (
            <TouchableOpacity
              key={sec}
              style={[
                styles.speedSelectBtn,
                sosCountdownSeconds === sec
                  ? { backgroundColor: colors.sos }
                  : { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border },
              ]}
              onPress={() => setSosCountdownSeconds(sec)}
              accessibilityLabel={`Set SOS hold trigger time to ${sec} seconds`}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.speedSelectBtnText,
                  {
                    color: sosCountdownSeconds === sec ? '#FFFFFF' : colors.text,
                    fontWeight: sosCountdownSeconds === sec ? '700' : '500',
                  },
                ]}
              >
                {sec} Seconds
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Haptic Intensity */}
        <View style={[styles.contrastSwitchRow, { borderTopColor: colors.border, marginTop: 8 }]}>
          <View style={styles.switchLabelCol}>
            <View style={styles.switchTitleRow}>
              <Vibrate size={16} color={colors.primary} />
              <Text style={[styles.settingLabel, { color: colors.text, fontSize: scaleFont(13) }]}>
                Haptic Vibration Feedback
              </Text>
            </View>
            <Text style={[styles.switchSub, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
              Vibrotactile pulses for incoming door knocks, sirens, and button presses
            </Text>
          </View>

          <View style={styles.hapticButtonGroup}>
            {(['light', 'medium', 'heavy'] as const).map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.hapticBtn,
                  hapticIntensity === level
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border },
                ]}
                onPress={() => setHapticIntensity(level)}
                accessibilityLabel={`Set haptic intensity to ${level}`}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.hapticBtnText,
                    {
                      color: hapticIntensity === level ? colors.onPrimary : colors.text,
                      fontWeight: hapticIntensity === level ? '700' : '500',
                    },
                  ]}
                >
                  {level[0].toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  headerBlock: {
    gap: 4,
  },
  headerTopBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  profileTag: {
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  complianceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  complianceText: {
    fontWeight: '700',
  },
  screenHeading: {
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    lineHeight: 18,
  },
  sectionBlock: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  activeTag: {
    fontWeight: '600',
  },
  profilesStack: {
    gap: 8,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    minHeight: 64,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  profileIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileTextBox: {
    flex: 1,
  },
  profileTitle: {
    fontWeight: '700',
  },
  profileDesc: {
    marginTop: 2,
    lineHeight: 15,
  },
  radioIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingIconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardHeading: {
    fontWeight: '700',
  },
  speedRateTag: {
    fontWeight: '700',
  },
  settingDesc: {
    lineHeight: 18,
  },
  settingItem: {
    gap: 8,
  },
  settingItemLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontWeight: '700',
  },
  scalePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  scalePillText: {
    fontWeight: '700',
  },
  scaleButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  scaleBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleBtnText: {
    fontSize: 12,
  },
  contrastSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  switchLabelCol: {
    flex: 1,
    paddingRight: 10,
    gap: 2,
  },
  switchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  switchSub: {
    marginTop: 2,
    lineHeight: 15,
  },
  switchPill: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchPillText: {
    fontWeight: '700',
  },
  speedButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  speedSelectBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedSelectBtnText: {
    fontSize: 13,
  },
  hapticButtonGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  hapticBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hapticBtnText: {
    fontSize: 12,
  },
});
