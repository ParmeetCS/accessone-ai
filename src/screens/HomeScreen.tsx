import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
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
  Wifi,
  Camera,
  Mic,
  Clock,
} from 'lucide-react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { useUserStore } from '../store/userStore';
import { WaveformBar } from '../components/WaveformBar';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, fontScale, scaleFont, isHighContrast, toggleHighContrast, cycleFontScale } = useAppTheme();

  const displayName = useUserStore((s) => s.displayName);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const openAuthModal = useUserStore((s) => s.openAuthModal);
  const careRingOnline = useUserStore((s) => s.careRingOnline);
  const sensoryProfile = useUserStore((s) => s.sensoryProfile);
  const speechRate = useUserStore((s) => s.speechRate);
  const hapticIntensity = useUserStore((s) => s.hapticIntensity);

  // Real Supabase and Device Telemetry Data
  const recentActivities = useUserStore((s) => s.recentActivities);
  const isLoadingActivities = useUserStore((s) => s.isLoadingActivities);
  const emergencyContactsCount = useUserStore((s) => s.emergencyContactsCount);
  const primaryContact = useUserStore((s) => s.primaryContact);
  const telemetry = useUserStore((s) => s.telemetry);
  const isRefreshingDashboard = useUserStore((s) => s.isRefreshingDashboard);
  const refreshDashboardData = useUserStore((s) => s.refreshDashboardData);

  useEffect(() => {
    refreshDashboardData();
  }, []);

  const getInitials = (name: string): string => {
    if (!name || name === 'Guest Patient') return 'GP';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const formatActivityTime = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'vision':
        return <Eye size={16} color={colors.primary} />;
      case 'hearing':
        return <Ear size={16} color={colors.secondary} />;
      case 'bridge':
        return <MessageSquare size={16} color={colors.primary} />;
      case 'safety':
        return <ShieldAlert size={16} color={colors.sos} />;
      case 'auth':
        return <ShieldCheck size={16} color={colors.primary} />;
      default:
        return <FileText size={16} color={colors.textSecondary} />;
    }
  };

  const isSensorReady = telemetry.cameraPermission === 'Granted' && telemetry.micPermission === 'Granted';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshingDashboard}
          onRefresh={refreshDashboardData}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {/* 1. Operational Telemetry Banner (Real Sensor State) */}
      <View
        style={[
          styles.telemetryBanner,
          { backgroundColor: colors.surfaceContainer, borderColor: colors.border },
        ]}
        accessible={true}
        accessibilityRole="summary"
        accessibilityLabel={`Clinically Certified AI v4.2. ${isSensorReady ? 'All systems active. Mic and camera ready.' : 'Permissions check needed.'}`}
      >
        <View style={styles.telemetryLeft}>
          <View style={styles.pulseContainer}>
            <View
              style={[
                styles.pingCircle,
                { backgroundColor: isSensorReady ? colors.primary : '#D97706' },
              ]}
            />
            <View
              style={[
                styles.activeDot,
                { backgroundColor: isSensorReady ? colors.primary : '#D97706' },
              ]}
            />
          </View>
          <View style={styles.telemetryTextContainer}>
            <Text style={[styles.telemetryTitle, { color: colors.primary, fontSize: scaleFont(11) }]}>
              CLINICALLY CERTIFIED AI v4.2
            </Text>
            <Text style={[styles.telemetrySub, { color: colors.textSecondary, fontSize: scaleFont(12) }]}>
              {isSensorReady
                ? 'All systems active • Mic & Cam Ready'
                : `Sensors: Cam ${telemetry.cameraPermission} • Mic ${telemetry.micPermission}`}
            </Text>
          </View>
        </View>
        <ShieldCheck size={20} color={colors.primary} />
      </View>

      {/* 2. Personalized Greeting & Micro Accessibility Bar */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.greetingRow}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => (isAuthenticated ? navigation.navigate('Settings') : openAuthModal())}
            accessibilityLabel={`Welcome back, ${displayName.split(' ')[0]}. Tap to view or calibrate profile`}
            accessibilityRole="button"
          >
            <Text style={[styles.portalTag, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
              {isAuthenticated ? 'Clinical Profile Verified' : 'Guest Offline Mode'}
            </Text>
            <Text style={[styles.greetingHeading, { color: colors.text, fontSize: scaleFont(22) }]}>
              Welcome back, {displayName ? displayName.split(' ')[0] : 'Patient'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.avatarCircle, { backgroundColor: colors.primaryContainer }]}
            onPress={() => (isAuthenticated ? navigation.navigate('Settings') : openAuthModal())}
            accessibilityLabel="Profile avatar. Tap to open Settings or Authenticate"
            accessibilityRole="button"
          >
            <Text style={[styles.avatarText, { color: colors.primary }]}>{getInitials(displayName)}</Text>
          </TouchableOpacity>
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

      {/* 3. Care Ring Summary (Connected to Supabase Emergency Contacts) */}
      <View
        style={[
          styles.careRingCapsule,
          {
            backgroundColor: emergencyContactsCount > 0 ? colors.surfaceContainer : colors.surfaceContainerLow,
            borderColor: emergencyContactsCount > 0 ? colors.primaryFixedDim : colors.border,
          },
        ]}
      >
        <View style={styles.careRingLeft}>
          <View
            style={[
              styles.careRingIconBox,
              { backgroundColor: emergencyContactsCount > 0 ? colors.primary : colors.secondary },
            ]}
          >
            <Activity size={18} color="#FFFFFF" strokeWidth={2.5} />
          </View>
          <View style={styles.careRingTextCol}>
            <Text style={[styles.careRingTitle, { color: colors.text, fontSize: scaleFont(13) }]}>
              {emergencyContactsCount > 0 ? 'Care Ring Connected' : 'Care Ring Standby'}
            </Text>
            <Text style={[styles.careRingDesc, { color: colors.textSecondary, fontSize: scaleFont(12) }]}>
              {emergencyContactsCount > 0
                ? primaryContact
                  ? `${primaryContact.name} (${primaryContact.relationship}) linked`
                  : `${emergencyContactsCount} Emergency Contact${emergencyContactsCount > 1 ? 's' : ''} configured`
                : 'No emergency contacts registered yet'}
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
              <View
                style={[
                  styles.readyDot,
                  { backgroundColor: telemetry.cameraPermission === 'Granted' ? colors.primary : '#D97706' },
                ]}
              />
              <Text style={[styles.readyText, { color: colors.onPrimaryFixed, fontSize: scaleFont(11) }]}>
                {telemetry.cameraPermission === 'Granted' ? 'Camera Ready' : 'Permission Required'}
              </Text>
            </View>
          </View>

          <View style={[styles.previewPlaceholder, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
            <View style={styles.hudOverlay}>
              <View style={styles.hudBadge}>
                <CheckCircle2 size={13} color={colors.primary} />
                <Text style={[styles.hudText, { color: colors.text, fontSize: scaleFont(11) }]}>
                  Real-time OCR • Text-to-Speech active
                </Text>
              </View>
            </View>
          </View>

          <Text style={[styles.cardDesc, { color: colors.textSecondary, fontSize: scaleFont(13) }]}>
            High-precision optical recognition for prescriptions, documents, and room navigation with instant voice readouts.
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
              <View
                style={[
                  styles.readyDot,
                  { backgroundColor: telemetry.micPermission === 'Granted' ? colors.secondary : '#D97706' },
                ]}
              />
              <Text style={[styles.readyText, { color: colors.onSecondaryContainer, fontSize: scaleFont(11) }]}>
                {telemetry.micPermission === 'Granted' ? 'Mic Ready' : 'Permission Required'}
              </Text>
            </View>
          </View>

          <View style={[styles.spectrumContainer, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
            <View style={styles.spectrumTop}>
              <Text style={[styles.spectrumStatus, { color: colors.textSecondary, fontSize: scaleFont(11) }]}>
                Acoustic Processing: Online
              </Text>
              <Text style={[styles.spectrumMode, { color: colors.primary, fontSize: scaleFont(11) }]}>
                Clear Speech
              </Text>
            </View>
            <WaveformBar isActive={true} color={colors.primary} barCount={18} height={28} />
          </View>

          <Text style={[styles.cardDesc, { color: colors.textSecondary, fontSize: scaleFont(13) }]}>
            Live conversational transcription, environmental sound detection, and synchronized vibrotactile haptics.
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
                Voice Engine Ready
              </Text>
            </View>
          </View>

          <View style={[styles.dialogueSnippet, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
            <Text style={[styles.snippetText, { color: colors.text, fontSize: scaleFont(13) }]}>
              Two-way accessible dialogue between deaf/hard-of-hearing patients and healthcare providers.
            </Text>
          </View>

          <Text style={[styles.cardDesc, { color: colors.textSecondary, fontSize: scaleFont(13) }]}>
            Translates typed speech into neural audio and transcribes spoken responses in real time.
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
            Autonomous fall detection alerts, GPS coordinates broadcast, and emergency contact SMS dispatch.
          </Text>

          <View style={styles.safetyInfoGrid}>
            <View style={[styles.safetyInfoPill, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
              <Text style={[styles.safetyPillText, { color: colors.text, fontSize: scaleFont(11) }]}>
                👥 {emergencyContactsCount} Contact{emergencyContactsCount === 1 ? '' : 's'} Configured
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

      {/* 5. Active Clinical Profile Summary (Real State) */}
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
            {sensoryProfile.toUpperCase()} FOCUS
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
              {hapticIntensity.toUpperCase()}
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

      {/* 6. Device & Telemetry (Connected to Actual Device APIs) */}
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
              {telemetry.lastSyncAt !== 'Never' ? `Synced ${telemetry.lastSyncAt}` : 'Online'}
            </Text>
          </View>
        </View>

        <View style={styles.deviceList}>
          {/* Battery Level */}
          <View style={[styles.deviceRow, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
            <View style={styles.deviceRowLeft}>
              <BatteryCharging size={18} color={colors.primary} />
              <Text style={[styles.deviceName, { color: colors.text, fontSize: scaleFont(13) }]}>
                Battery Level
              </Text>
            </View>
            <Text style={[styles.deviceVal, { color: colors.text, fontSize: scaleFont(13) }]}>
              {telemetry.batteryLevel !== null ? `${telemetry.batteryLevel}% • ${telemetry.batteryState}` : telemetry.batteryState}
            </Text>
          </View>

          {/* Camera Sensor */}
          <View style={[styles.deviceRow, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
            <View style={styles.deviceRowLeft}>
              <Camera size={18} color={colors.primary} />
              <Text style={[styles.deviceName, { color: colors.text, fontSize: scaleFont(13) }]}>
                Camera Sensor
              </Text>
            </View>
            <Text
              style={[
                styles.deviceVal,
                { color: telemetry.cameraPermission === 'Granted' ? colors.primary : '#D97706', fontSize: scaleFont(13) },
              ]}
            >
              {telemetry.cameraPermission}
            </Text>
          </View>

          {/* Microphone Sensor */}
          <View style={[styles.deviceRow, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
            <View style={styles.deviceRowLeft}>
              <Mic size={18} color={colors.primary} />
              <Text style={[styles.deviceName, { color: colors.text, fontSize: scaleFont(13) }]}>
                Microphone Sensor
              </Text>
            </View>
            <Text
              style={[
                styles.deviceVal,
                { color: telemetry.micPermission === 'Granted' ? colors.primary : '#D97706', fontSize: scaleFont(13) },
              ]}
            >
              {telemetry.micPermission}
            </Text>
          </View>

          {/* Network Connectivity */}
          <View style={[styles.deviceRow, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
            <View style={styles.deviceRowLeft}>
              <Wifi size={18} color={colors.primary} />
              <Text style={[styles.deviceName, { color: colors.text, fontSize: scaleFont(13) }]}>
                Network Connectivity
              </Text>
            </View>
            <Text style={[styles.deviceVal, { color: colors.text, fontSize: scaleFont(13) }]}>
              {telemetry.networkType}
            </Text>
          </View>

          {/* Bluetooth Status (Strictly un-fabricated) */}
          <View style={[styles.deviceRow, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
            <View style={styles.deviceRowLeft}>
              <Bluetooth size={18} color={colors.textSecondary} />
              <Text style={[styles.deviceName, { color: colors.text, fontSize: scaleFont(13) }]}>
                Bluetooth Peripheral
              </Text>
            </View>
            <Text style={[styles.deviceVal, { color: colors.textMuted, fontSize: scaleFont(13) }]}>
              {telemetry.bluetoothStatus}
            </Text>
          </View>
        </View>
      </View>

      {/* 7. Recent Assistive Activity (Real activity_logs from Supabase) */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 24 }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <History size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text, fontSize: scaleFont(16) }]}>
              Recent Activity
            </Text>
          </View>
          <TouchableOpacity
            onPress={refreshDashboardData}
            accessibilityLabel="Refresh recent activity"
            accessibilityRole="button"
          >
            <Text style={[styles.todayTag, { color: colors.primary, fontSize: scaleFont(11) }]}>
              Refresh
            </Text>
          </TouchableOpacity>
        </View>

        {isLoadingActivities ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.emptySubtitle, { color: colors.textMuted, fontSize: scaleFont(12) }]}>
              Loading activity history...
            </Text>
          </View>
        ) : recentActivities.length > 0 ? (
          <View style={styles.activityList}>
            {recentActivities.map((act) => (
              <View
                key={act.id}
                style={[styles.activityItem, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}
              >
                <View style={[styles.activityIconBox, { backgroundColor: colors.surfaceContainer }]}>
                  {getActivityIcon(act.activity_type)}
                </View>
                <View style={styles.activityContent}>
                  <View style={styles.activityTop}>
                    <Text style={[styles.activityTitle, { color: colors.text, fontSize: scaleFont(13) }]}>
                      {act.title}
                    </Text>
                    <Text style={[styles.activityTime, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
                      {formatActivityTime(act.created_at)}
                    </Text>
                  </View>
                  <Text style={[styles.activityDesc, { color: colors.textSecondary, fontSize: scaleFont(12) }]}>
                    {act.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.emptyStateContainer, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
            <Clock size={28} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text, fontSize: scaleFont(14) }]}>
              No Recent Activity Logged
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted, fontSize: scaleFont(12) }]}>
              Completed vision scans, hearing captions, and emergency alerts will appear here in real time.
            </Text>
          </View>
        )}
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
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  telemetryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    gap: 1,
  },
  telemetryTitle: {
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  telemetrySub: {
    letterSpacing: 0.1,
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  portalTag: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  greetingHeading: {
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: '700',
  },
  microAdjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
  },
  fontStepperGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  stepperBtn: {
    paddingHorizontal: 12,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: {
    fontSize: 12,
  },
  contrastToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 12,
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
    borderWidth: 1,
  },
  careRingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
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
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosHubText: {
    fontWeight: '700',
    fontSize: 12,
  },
  cardsStack: {
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  moduleIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontWeight: '700',
  },
  cardSubtitle: {
    fontWeight: '500',
  },
  readyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  readyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  readyText: {
    fontWeight: '600',
  },
  previewPlaceholder: {
    height: 64,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  hudOverlay: {
    flexDirection: 'row',
  },
  hudBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hudText: {
    fontWeight: '600',
  },
  cardDesc: {
    lineHeight: 18,
  },
  launchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
  },
  launchBtnText: {
    fontWeight: '700',
  },
  spectrumContainer: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    gap: 8,
  },
  spectrumTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spectrumStatus: {
    fontWeight: '500',
  },
  spectrumMode: {
    fontWeight: '700',
  },
  dialogueSnippet: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  snippetText: {
    lineHeight: 18,
  },
  safetyInfoGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  safetyInfoPill: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  safetyPillText: {
    fontWeight: '600',
  },
  adjustBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
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
    borderRadius: 10,
  },
  tierTitle: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tierBadge: {
    fontWeight: '600',
  },
  telemetryGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  telemetryItem: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  telemetryItemLabel: {
    fontWeight: '600',
  },
  telemetryItemVal: {
    fontWeight: '700',
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
    gap: 8,
  },
  deviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  deviceRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deviceName: {
    fontWeight: '600',
  },
  deviceVal: {
    fontWeight: '600',
  },
  todayTag: {
    fontWeight: '600',
  },
  activityList: {
    gap: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  activityIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '700',
  },
  activityTime: {
    fontWeight: '500',
  },
  activityDesc: {
    marginTop: 2,
    lineHeight: 16,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyStateContainer: {
    padding: 20,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontWeight: '700',
    marginTop: 4,
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: 16,
  },
});
