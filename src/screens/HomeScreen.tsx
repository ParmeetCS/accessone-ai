import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ShieldCheck,
  Eye,
  Ear,
  MessageSquare,
  ShieldAlert,
  Sliders,
  Cpu,
  BatteryCharging,
  Bluetooth,
  History,
  FileText,
  AlertTriangle,
  ArrowRight,
  SunMedium,
  CheckCircle2,
  ChevronRight,
  Activity,
} from 'lucide-react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { useUserStore } from '../store/userStore';
import { WaveformBar } from '../components/WaveformBar';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, fontScale, scaleFont, isHighContrast, toggleHighContrast, cycleFontScale } = useAppTheme();
  const patientName = useUserStore((s) => s.patientName);
  const careRingOnline = useUserStore((s) => s.careRingOnline);
  const sensoryProfile = useUserStore((s) => s.sensoryProfile);
  const speechRate = useUserStore((s) => s.speechRate);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Operational Telemetry Banner */}
      <View
        style={[
          styles.telemetryBanner,
          { backgroundColor: colors.surfaceContainer, borderColor: colors.border },
        ]}
        accessible={true}
        accessibilityRole="summary"
        accessibilityLabel="Clinically Certified AI v4.2. All systems active. Microphone and Camera ready."
      >
        <View style={styles.telemetryLeft}>
          <View style={styles.pulseContainer}>
            <View style={[styles.pingCircle, { backgroundColor: colors.primary }]} />
            <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
          </View>
          <View style={styles.telemetryTextContainer}>
            <Text style={[styles.telemetryTitle, { color: colors.primary, fontSize: scaleFont(11) }]}>
              CLINICALLY CERTIFIED AI v4.2
            </Text>
            <Text style={[styles.telemetrySub, { color: colors.textSecondary, fontSize: scaleFont(12) }]}>
              All systems active • Mic & Cam Ready
            </Text>
          </View>
        </View>
        <ShieldCheck size={20} color={colors.primary} />
      </View>

      {/* 2. Personalized Greeting & Accessibility Quick Bar */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.greetingRow}>
          <View>
            <Text style={[styles.portalTag, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
              Patient Portal Active
            </Text>
            <Text style={[styles.greetingHeading, { color: colors.text, fontSize: scaleFont(22) }]}>
              Welcome back, {patientName.split(' ')[0]}
            </Text>
          </View>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primaryContainer }]}>
            <Text style={styles.avatarText}>SJ</Text>
          </View>
        </View>

        {/* Micro-adjustment accessibility bar */}
        <View style={styles.microAdjustRow}>
          <View
            style={[styles.fontStepperGroup, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}
            accessible={true}
            accessibilityRole="toolbar"
            accessibilityLabel="Quick text size resize"
          >
            <TouchableOpacity
              style={[styles.stepperBtn, fontScale === 'sm' && { backgroundColor: colors.primary }]}
              onPress={() => cycleFontScale('down')}
              accessibilityLabel="Decrease font size"
              accessibilityHint="Makes text slightly smaller"
              accessibilityRole="button"
            >
              <Text style={[styles.stepperText, { color: fontScale === 'sm' ? colors.onPrimary : colors.text }]}>
                A-
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.stepperBtn, fontScale === 'std' && { backgroundColor: colors.primary }]}
              onPress={() => cycleFontScale('std')}
              accessibilityLabel="Standard font size"
              accessibilityHint="Resets text size to standard"
              accessibilityRole="button"
            >
              <Text style={[styles.stepperText, { color: fontScale === 'std' ? colors.onPrimary : colors.text, fontWeight: '700' }]}>
                Std
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.stepperBtn, (fontScale === 'lg' || fontScale === 'xl') && { backgroundColor: colors.primary }]}
              onPress={() => cycleFontScale('up')}
              accessibilityLabel="Increase font size"
              accessibilityHint="Makes text larger"
              accessibilityRole="button"
            >
              <Text style={[styles.stepperText, { color: fontScale === 'lg' || fontScale === 'xl' ? colors.onPrimary : colors.text }]}>
                A+
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.contrastToggleBtn,
              {
                backgroundColor: isHighContrast ? colors.primary : colors.surfaceContainerLow,
                borderColor: colors.border,
              },
            ]}
            onPress={toggleHighContrast}
            accessibilityLabel={`High contrast mode toggle. Currently ${isHighContrast ? 'on' : 'off'}`}
            accessibilityHint="Toggles between high-contrast black and clinical light themes"
            accessibilityRole="switch"
            accessibilityState={{ checked: isHighContrast }}
          >
            <SunMedium size={16} color={isHighContrast ? colors.onPrimary : colors.text} />
            <Text
              style={[
                styles.contrastBtnText,
                { color: isHighContrast ? colors.onPrimary : colors.text, fontSize: scaleFont(12) },
              ]}
            >
              High Contrast
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Care Ring Online Priority Alert Capsule */}
      <View
        style={[
          styles.careRingCapsule,
          {
            backgroundColor: careRingOnline ? colors.surfaceContainer : colors.sosContainer,
            borderColor: careRingOnline ? colors.primaryFixedDim : colors.sos,
          },
        ]}
      >
        <View style={styles.careRingLeft}>
          <View
            style={[
              styles.careRingIconBox,
              { backgroundColor: careRingOnline ? colors.primary : colors.sos },
            ]}
          >
            <Activity size={18} color="#FFFFFF" strokeWidth={2.5} />
          </View>
          <View style={styles.careRingTextCol}>
            <Text style={[styles.careRingTitle, { color: colors.text, fontSize: scaleFont(13) }]}>
              {careRingOnline ? 'Care Ring Online' : 'Care Ring Alert'}
            </Text>
            <Text style={[styles.careRingDesc, { color: colors.textSecondary, fontSize: scaleFont(12) }]}>
              Dr. Evans + St. Jude Response Station linked
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.sosHubBtn, { backgroundColor: colors.sos }]}
          onPress={() => navigation.navigate('Safety')}
          accessibilityLabel="SOS Hub quick launch"
          accessibilityHint="Navigates to emergency response center"
          accessibilityRole="button"
        >
          <Text style={[styles.sosHubText, { color: colors.onSos }]}>SOS Hub</Text>
        </TouchableOpacity>
      </View>

      {/* 4. Four Large Module Launch Cards */}
      <View style={styles.cardsStack}>
        {/* Module 1: Vision Assist */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.moduleIconBox, { backgroundColor: colors.primaryContainer }]}>
                <Eye size={22} color={colors.onPrimary} />
              </View>
              <View>
                <Text style={[styles.cardTitle, { color: colors.text, fontSize: scaleFont(17) }]}>
                  Vision Assist
                </Text>
                <Text style={[styles.cardSubtitle, { color: colors.textMuted, fontSize: scaleFont(12) }]}>
                  Optical Telemetry & OCR
                </Text>
              </View>
            </View>
            <View style={[styles.readyPill, { backgroundColor: colors.primaryFixed }]}>
              <View style={[styles.readyDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.readyText, { color: colors.onPrimaryFixed, fontSize: scaleFont(11) }]}>
                Camera Ready
              </Text>
            </View>
          </View>

          {/* Visual Scene Banner */}
          <View style={[styles.previewPlaceholder, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
            <View style={styles.hudOverlay}>
              <View style={styles.hudBadge}>
                <CheckCircle2 size={13} color={colors.primary} />
                <Text style={[styles.hudText, { color: colors.text, fontSize: scaleFont(11) }]}>
                  Live Scene • Rx Pill Dispenser at 18cm
                </Text>
              </View>
            </View>
          </View>

          <Text style={[styles.cardDesc, { color: colors.textSecondary, fontSize: scaleFont(13) }]}>
            High-precision neural reading for prescriptions, spatial obstacles, and room orientation with real-time audio guidance.
          </Text>

          <TouchableOpacity
            style={[styles.launchBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('Vision')}
            accessibilityLabel="Launch Vision Assist module"
            accessibilityHint="Opens live camera for optical OCR and scene narration"
            accessibilityRole="button"
          >
            <Eye size={18} color={colors.onPrimary} />
            <Text style={[styles.launchBtnText, { color: colors.onPrimary, fontSize: scaleFont(14) }]}>
              Launch Vision Assist
            </Text>
            <ArrowRight size={16} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>

        {/* Module 2: Hearing Assist */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.moduleIconBox, { backgroundColor: colors.secondary }]}>
                <Ear size={22} color={colors.surface} />
              </View>
              <View>
                <Text style={[styles.cardTitle, { color: colors.text, fontSize: scaleFont(17) }]}>
                  Hearing Assist
                </Text>
                <Text style={[styles.cardSubtitle, { color: colors.textMuted, fontSize: scaleFont(12) }]}>
                  Acoustic Spectrum & Captions
                </Text>
              </View>
            </View>
            <View style={[styles.readyPill, { backgroundColor: colors.secondaryContainer }]}>
              <View style={[styles.readyDot, { backgroundColor: colors.secondary }]} />
              <Text style={[styles.readyText, { color: colors.onSecondaryContainer, fontSize: scaleFont(11) }]}>
                Mic Ready
              </Text>
            </View>
          </View>

          {/* Sound Waveform Simulation */}
          <View style={[styles.spectrumContainer, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
            <View style={styles.spectrumTop}>
              <Text style={[styles.spectrumStatus, { color: colors.textSecondary, fontSize: scaleFont(11) }]}>
                Acoustic Isolation: 38 dB Ambient
              </Text>
              <Text style={[styles.spectrumMode, { color: colors.primary, fontSize: scaleFont(11) }]}>
                Clear Speech
              </Text>
            </View>
            <WaveformBar isActive={true} color={colors.primary} barCount={18} height={28} />
          </View>

          <Text style={[styles.cardDesc, { color: colors.textSecondary, fontSize: scaleFont(13) }]}>
            Live speaker transcription, non-speech alert flashers (fire alarms, doorbells, IV chimes), and sensory haptics.
          </Text>

          <TouchableOpacity
            style={[styles.launchBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('Hearing')}
            accessibilityLabel="Start listening in Hearing Assist"
            accessibilityHint="Opens live speech caption stream and acoustic radar"
            accessibilityRole="button"
          >
            <Ear size={18} color={colors.onPrimary} />
            <Text style={[styles.launchBtnText, { color: colors.onPrimary, fontSize: scaleFont(14) }]}>
              Start Listening
            </Text>
            <ArrowRight size={16} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>

        {/* Module 3: Bridge Comm */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.moduleIconBox, { backgroundColor: colors.primary }]}>
                <MessageSquare size={22} color={colors.onPrimary} />
              </View>
              <View>
                <Text style={[styles.cardTitle, { color: colors.text, fontSize: scaleFont(17) }]}>
                  Bridge Comm
                </Text>
                <Text style={[styles.cardSubtitle, { color: colors.textMuted, fontSize: scaleFont(12) }]}>
                  Dual-Channel Dialogue
                </Text>
              </View>
            </View>
            <View style={[styles.readyPill, { backgroundColor: colors.primaryFixed }]}>
              <View style={[styles.readyDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.readyText, { color: colors.onPrimaryFixed, fontSize: scaleFont(11) }]}>
                Dialogue Ready
              </Text>
            </View>
          </View>

          <View style={[styles.dialogueSnippet, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
            <Text style={[styles.snippetText, { color: colors.text, fontSize: scaleFont(13) }]}>
              <Text style={{ fontWeight: '700', color: colors.primary }}>Dr. Patel: </Text>
              "The blood pressure is stable. Let's review the new prescription."
            </Text>
            <View style={styles.aslBadgeRow}>
              <View style={[styles.aslMiniBadge, { backgroundColor: colors.surfaceContainer }]}>
                <Text style={[styles.aslMiniText, { color: colors.textSecondary, fontSize: scaleFont(10) }]}>
                  ASL & Rapid TTS Active
                </Text>
              </View>
            </View>
          </View>

          <Text style={[styles.cardDesc, { color: colors.textSecondary, fontSize: scaleFont(13) }]}>
            Fosters natural two-way conversation between Deaf/hard-of-hearing patients and healthcare providers with sub-second synthesis.
          </Text>

          <TouchableOpacity
            style={[styles.launchBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('Bridge')}
            accessibilityLabel="Open Bridge Dialogue module"
            accessibilityHint="Opens dual-channel chat, voice synthesis and ASL visual translation"
            accessibilityRole="button"
          >
            <MessageSquare size={18} color={colors.onPrimary} />
            <Text style={[styles.launchBtnText, { color: colors.onPrimary, fontSize: scaleFont(14) }]}>
              Open Bridge Dialogue
            </Text>
            <ArrowRight size={16} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>

        {/* Module 4: Safety Assist */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.moduleIconBox, { backgroundColor: colors.sos }]}>
                <ShieldAlert size={22} color={colors.onSos} />
              </View>
              <View>
                <Text style={[styles.cardTitle, { color: colors.text, fontSize: scaleFont(17) }]}>
                  Safety Assist
                </Text>
                <Text style={[styles.cardSubtitle, { color: colors.textMuted, fontSize: scaleFont(12) }]}>
                  Emergency & Care Circle
                </Text>
              </View>
            </View>
            <View style={[styles.readyPill, { backgroundColor: colors.sosContainer }]}>
              <View style={[styles.readyDot, { backgroundColor: colors.sos }]} />
              <Text style={[styles.readyText, { color: colors.sos, fontSize: scaleFont(11) }]}>
                GPS Monitored
              </Text>
            </View>
          </View>

          <Text style={[styles.cardDesc, { color: colors.textSecondary, fontSize: scaleFont(13) }]}>
            Autonomous fall verification, geo-fenced safety boundaries, direct 911 clinical payload transmission, and caregiver check-ins.
          </Text>

          <View style={styles.safetyInfoGrid}>
            <View style={[styles.safetyInfoPill, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
              <Text style={[styles.safetyPillText, { color: colors.text, fontSize: scaleFont(11) }]}>
                📍 Room 304, West Wing
              </Text>
            </View>
            <View style={[styles.safetyInfoPill, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
              <Text style={[styles.safetyPillText, { color: colors.text, fontSize: scaleFont(11) }]}>
                👥 3 Contacts Alerted
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.launchBtn, { backgroundColor: colors.surfaceContainerHigh }]}
            onPress={() => navigation.navigate('Safety')}
            accessibilityLabel="Open Safety Hub"
            accessibilityHint="Opens emergency SOS hold trigger and trusted circle"
            accessibilityRole="button"
          >
            <ShieldAlert size={18} color={colors.sos} />
            <Text style={[styles.launchBtnText, { color: colors.text, fontSize: scaleFont(14) }]}>
              Open Safety Hub
            </Text>
            <ArrowRight size={16} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 5. Active Clinical Profile Summary */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Sliders size={20} color={colors.primary} />
            <View>
              <Text style={[styles.cardTitle, { color: colors.text, fontSize: scaleFont(16) }]}>
                Active Profile
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
                Prescribed Adaptation Matrix
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={[styles.adjustBtn, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}
            accessibilityLabel="Adjust profile in settings"
            accessibilityRole="button"
          >
            <Text style={[styles.adjustBtnText, { color: colors.text, fontSize: scaleFont(11) }]}>
              Adjust
            </Text>
            <ChevronRight size={14} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={[styles.tierCapsule, { backgroundColor: colors.surfaceContainer }]}>
          <Text style={[styles.tierTitle, { color: colors.primary, fontSize: scaleFont(13) }]}>
            {sensoryProfile.toUpperCase()} DUAL-SENSORY
          </Text>
          <Text style={[styles.tierBadge, { color: colors.textSecondary, fontSize: scaleFont(11) }]}>
            Tier AAA
          </Text>
        </View>

        <View style={styles.telemetryGrid}>
          <View style={[styles.telemetryItem, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
            <Text style={[styles.telemetryItemLabel, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
              Haptics
            </Text>
            <Text style={[styles.telemetryItemVal, { color: colors.text, fontSize: scaleFont(16) }]}>
              Max
            </Text>
          </View>
          <View style={[styles.telemetryItem, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
            <Text style={[styles.telemetryItemLabel, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
              Speech Rate
            </Text>
            <Text style={[styles.telemetryItemVal, { color: colors.text, fontSize: scaleFont(16) }]}>
              {speechRate}x
            </Text>
          </View>
          <View style={[styles.telemetryItem, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
            <Text style={[styles.telemetryItemLabel, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
              Contrast
            </Text>
            <Text style={[styles.telemetryItemVal, { color: colors.text, fontSize: scaleFont(16) }]}>
              {isHighContrast ? 'Max (Black)' : 'Standard'}
            </Text>
          </View>
        </View>
      </View>

      {/* 6. Device & Telemetry */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Cpu size={20} color={colors.secondary} />
            <Text style={[styles.cardTitle, { color: colors.text, fontSize: scaleFont(16) }]}>
              Device & Telemetry
            </Text>
          </View>
          <View style={styles.syncRow}>
            <View style={[styles.syncDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.syncText, { color: colors.primary, fontSize: scaleFont(11) }]}>
              Synchronized
            </Text>
          </View>
        </View>

        <View style={styles.deviceList}>
          <View style={[styles.deviceRow, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
            <View style={styles.deviceRowLeft}>
              <BatteryCharging size={18} color={colors.primary} />
              <Text style={[styles.deviceName, { color: colors.text, fontSize: scaleFont(13) }]}>
                Battery Level
              </Text>
            </View>
            <Text style={[styles.deviceVal, { color: colors.text, fontSize: scaleFont(13) }]}>
              92% • Fast Charging
            </Text>
          </View>

          <View style={[styles.deviceRow, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
            <View style={styles.deviceRowLeft}>
              <Cpu size={18} color={colors.primary} />
              <Text style={[styles.deviceName, { color: colors.text, fontSize: scaleFont(13) }]}>
                Neural Engine
              </Text>
            </View>
            <Text style={[styles.deviceVal, { color: colors.primary, fontSize: scaleFont(13) }]}>
              On-Device (0ms Latency)
            </Text>
          </View>

          <View style={[styles.deviceRow, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
            <View style={styles.deviceRowLeft}>
              <Bluetooth size={18} color={colors.primary} />
              <Text style={[styles.deviceName, { color: colors.text, fontSize: scaleFont(13) }]}>
                Lapel Mic AI-8
              </Text>
            </View>
            <Text style={[styles.deviceVal, { color: colors.text, fontSize: scaleFont(13) }]}>
              Connected (BLE 5.3)
            </Text>
          </View>
        </View>
      </View>

      {/* 7. Recent Assistive Activity */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 24 }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <History size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text, fontSize: scaleFont(16) }]}>
              Recent Activity
            </Text>
          </View>
          <Text style={[styles.todayTag, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
            Today
          </Text>
        </View>

        <View style={styles.activityList}>
          {/* Item 1 */}
          <View style={[styles.activityItem, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
            <View style={[styles.activityIconBox, { backgroundColor: colors.primaryFixed }]}>
              <FileText size={16} color={colors.primary} />
            </View>
            <View style={styles.activityContent}>
              <View style={styles.activityTop}>
                <Text style={[styles.activityTitle, { color: colors.text, fontSize: scaleFont(13) }]}>
                  Prescription OCR Scan
                </Text>
                <Text style={[styles.activityTime, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
                  10:14 AM
                </Text>
              </View>
              <Text style={[styles.activityDesc, { color: colors.textSecondary, fontSize: scaleFont(12) }]}>
                Amoxicillin 500mg - dosage schedule saved to notes.
              </Text>
            </View>
          </View>

          {/* Item 2 */}
          <View style={[styles.activityItem, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
            <View style={[styles.activityIconBox, { backgroundColor: colors.secondaryContainer }]}>
              <MessageSquare size={16} color={colors.secondary} />
            </View>
            <View style={styles.activityContent}>
              <View style={styles.activityTop}>
                <Text style={[styles.activityTitle, { color: colors.text, fontSize: scaleFont(13) }]}>
                  Clinical Consultation
                </Text>
                <Text style={[styles.activityTime, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
                  8:30 AM
                </Text>
              </View>
              <Text style={[styles.activityDesc, { color: colors.textSecondary, fontSize: scaleFont(12) }]}>
                18-minute session with Dr. Evans transcribed & highlighted.
              </Text>
            </View>
          </View>

          {/* Item 3 */}
          <View style={[styles.activityItem, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
            <View style={[styles.activityIconBox, { backgroundColor: colors.sosContainer }]}>
              <AlertTriangle size={16} color={colors.sos} />
            </View>
            <View style={styles.activityContent}>
              <View style={styles.activityTop}>
                <Text style={[styles.activityTitle, { color: colors.text, fontSize: scaleFont(13) }]}>
                  Environmental Warning
                </Text>
                <Text style={[styles.activityTime, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
                  Yesterday
                </Text>
              </View>
              <Text style={[styles.activityDesc, { color: colors.textSecondary, fontSize: scaleFont(12) }]}>
                Siren detected (84 dB). Haptic pulse dispatched to wrist.
              </Text>
            </View>
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
  telemetryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  telemetryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  pulseContainer: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pingCircle: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    opacity: 0.25,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  telemetryTextContainer: {
    flex: 1,
  },
  telemetryTitle: {
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  telemetrySub: {
    fontWeight: '500',
    marginTop: 1,
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
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  portalTag: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  greetingHeading: {
    fontWeight: '700',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  microAdjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 4,
  },
  fontStepperGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 3,
    height: 42,
  },
  stepperBtn: {
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },
  stepperText: {
    fontSize: 13,
    fontWeight: '600',
  },
  contrastToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  contrastBtnText: {
    fontWeight: '600',
  },
  careRingCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  careRingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  careRingIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  careRingTextCol: {
    flex: 1,
  },
  careRingTitle: {
    fontWeight: '700',
  },
  careRingDesc: {
    marginTop: 1,
  },
  sosHubBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosHubText: {
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  cardsStack: {
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  moduleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontWeight: '700',
  },
  cardSubtitle: {
    fontWeight: '500',
    marginTop: 1,
  },
  readyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  readyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  readyText: {
    fontWeight: '700',
  },
  previewPlaceholder: {
    height: 80,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 8,
  },
  hudOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hudBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  hudText: {
    fontWeight: '600',
  },
  cardDesc: {
    lineHeight: 19,
  },
  launchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: 10,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  launchBtnText: {
    fontWeight: '700',
  },
  spectrumContainer: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    gap: 6,
  },
  spectrumTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spectrumStatus: {
    fontWeight: '500',
  },
  spectrumMode: {
    fontWeight: '700',
  },
  dialogueSnippet: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 8,
  },
  snippetText: {
    lineHeight: 18,
  },
  aslBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  aslMiniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  aslMiniText: {
    fontWeight: '600',
  },
  safetyInfoGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  safetyInfoPill: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  safetyPillText: {
    fontWeight: '600',
  },
  adjustBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  adjustBtnText: {
    fontWeight: '600',
  },
  tierCapsule: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tierTitle: {
    fontWeight: '700',
  },
  tierBadge: {
    fontWeight: '700',
  },
  telemetryGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  telemetryItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  telemetryItemLabel: {
    fontWeight: '500',
  },
  telemetryItemVal: {
    fontWeight: '700',
    marginTop: 2,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  syncText: {
    fontWeight: '600',
  },
  deviceList: {
    gap: 6,
  },
  deviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  deviceRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deviceName: {
    fontWeight: '500',
  },
  deviceVal: {
    fontWeight: '700',
  },
  todayTag: {
    fontWeight: '600',
  },
  activityList: {
    gap: 8,
  },
  activityItem: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  activityIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  activityContent: {
    flex: 1,
  },
  activityTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityTitle: {
    fontWeight: '600',
  },
  activityTime: {
    fontWeight: '500',
  },
  activityDesc: {
    marginTop: 2,
    lineHeight: 16,
  },
});
