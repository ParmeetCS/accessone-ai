import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import {
  Mic,
  MicOff,
  Radio,
  Sliders,
  Volume2,
  Bell,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Activity,
  Plus,
} from 'lucide-react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { useHearingStore } from '../store/hearingStore';
import { SoundRadar } from '../components/SoundRadar';
import { WaveformBar } from '../components/WaveformBar';

export const HearingScreen: React.FC = () => {
  const { colors, scaleFont } = useAppTheme();

  const isListening = useHearingStore((s) => s.isListening);
  const toggleListening = useHearingStore((s) => s.toggleListening);
  const ambientDb = useHearingStore((s) => s.ambientDb);
  const transcripts = useHearingStore((s) => s.transcripts);
  const soundEvents = useHearingStore((s) => s.soundEvents);
  const activeAlert = useHearingStore((s) => s.activeAlert);
  const selectedCaptionSize = useHearingStore((s) => s.selectedCaptionSize);
  const setCaptionSize = useHearingStore((s) => s.setCaptionSize);
  const triggerMockSoundEvent = useHearingStore((s) => s.triggerMockSoundEvent);
  const addTranscript = useHearingStore((s) => s.addTranscript);

  // Dynamic simulated speaker incoming when listening is active
  useEffect(() => {
    if (!isListening) return;

    const interval = setInterval(() => {
      const mockQuotes = [
        {
          speaker: 'Dr. Evans',
          role: 'doctor' as const,
          avatarInitials: 'DE',
          text: 'The inflammatory markers are down significantly compared to Tuesday.',
        },
        {
          speaker: 'Nurse Chloe',
          role: 'nurse' as const,
          avatarInitials: 'NC',
          text: 'Vitals logged into EHR. I have scheduled the telemetry follow up.',
        },
      ];

      // Add one message randomly
      const randomQuote = mockQuotes[Math.floor(Math.random() * mockQuotes.length)];
      addTranscript({
        id: `t-${Date.now()}`,
        speaker: randomQuote.speaker,
        role: randomQuote.role,
        avatarInitials: randomQuote.avatarInitials,
        text: randomQuote.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }, 9000);

    return () => clearInterval(interval);
  }, [isListening]);

  const getCaptionFontSize = () => {
    switch (selectedCaptionSize) {
      case 'md':
        return scaleFont(14);
      case 'xl':
        return scaleFont(20);
      case 'lg':
      default:
        return scaleFont(16);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Status & Environmental Live Telemetry Bar */}
      <View
        style={[
          styles.telemetryCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.telemetryTopRow}>
          <View style={styles.telemetryStatusGroup}>
            <View style={styles.pulseBox}>
              <View
                style={[
                  styles.pingCircle,
                  { backgroundColor: isListening ? colors.primary : colors.textMuted },
                ]}
              />
              <View
                style={[
                  styles.activeDot,
                  { backgroundColor: isListening ? colors.primary : colors.textMuted },
                ]}
              />
            </View>
            <View>
              <Text style={[styles.statusTitle, { color: isListening ? colors.primary : colors.textSecondary, fontSize: scaleFont(12) }]}>
                {isListening ? 'LISTENING ACTIVE • 3 SPEAKERS DETECTED' : 'MICROPHONE PAUSED'}
              </Text>
              <Text style={[styles.statusSub, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
                Active Noise Cancellation: -22dB
              </Text>
            </View>
          </View>

          <View style={[styles.dbBadge, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
            <Activity size={14} color={colors.primary} />
            <Text style={[styles.dbText, { color: colors.text, fontSize: scaleFont(11) }]}>
              {ambientDb} dB
            </Text>
          </View>
        </View>

        {/* Quick Accessibility Ribbon: Caption Sizes & Start/Stop */}
        <View style={[styles.ribbonRow, { borderTopColor: colors.border }]}>
          <View style={styles.sizeGroup}>
            <Text style={[styles.sizeLabel, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
              Text Size:
            </Text>
            {(['md', 'lg', 'xl'] as const).map((sz) => (
              <TouchableOpacity
                key={sz}
                style={[
                  styles.sizePill,
                  selectedCaptionSize === sz
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border },
                ]}
                onPress={() => setCaptionSize(sz)}
                accessibilityLabel={`Set caption text size to ${sz.toUpperCase()}`}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.sizePillText,
                    {
                      color: selectedCaptionSize === sz ? colors.onPrimary : colors.text,
                      fontWeight: selectedCaptionSize === sz ? '700' : '500',
                    },
                  ]}
                >
                  {sz.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Start/Stop Listening Toggle Button */}
          <TouchableOpacity
            style={[
              styles.micToggleBtn,
              { backgroundColor: isListening ? colors.primary : colors.surfaceContainerHigh },
            ]}
            onPress={toggleListening}
            accessibilityLabel={isListening ? 'Stop Listening' : 'Start Listening'}
            accessibilityHint="Toggles microphone capture and live acoustic speech transcription"
            accessibilityRole="switch"
            accessibilityState={{ checked: isListening }}
          >
            {isListening ? (
              <>
                <Mic size={16} color={colors.onPrimary} />
                <Text style={[styles.micToggleText, { color: colors.onPrimary, fontSize: scaleFont(12) }]}>
                  Listening
                </Text>
              </>
            ) : (
              <>
                <MicOff size={16} color={colors.text} />
                <Text style={[styles.micToggleText, { color: colors.text, fontSize: scaleFont(12) }]}>
                  Resume
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Visual Sound Map / 360 Spatial Radar & Frequency Spectrum Visualizer */}
      <View style={styles.radarSpectrumGrid}>
        {/* Radar Widget */}
        <View style={{ flex: 1 }}>
          <SoundRadar events={soundEvents} activeAlert={activeAlert} />
        </View>

        {/* Neural Frequency Spectrum */}
        <View style={[styles.spectrumCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.spectrumCardHeader}>
            <Text style={[styles.spectrumTitle, { color: colors.textSecondary, fontSize: scaleFont(11) }]}>
              NEURAL FILTER
            </Text>
            <View style={[styles.ancBadge, { backgroundColor: colors.primaryFixed }]}>
              <CheckCircle2 size={11} color={colors.primary} />
              <Text style={[styles.ancText, { color: colors.onPrimaryFixed, fontSize: scaleFont(10) }]}>
                ANC ON
              </Text>
            </View>
          </View>

          <View style={[styles.waveformBox, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
            <WaveformBar isActive={isListening} color={colors.primary} barCount={12} height={42} />
            <View style={styles.freqLabels}>
              <Text style={[styles.freqText, { color: colors.textMuted }]}>125Hz</Text>
              <Text style={[styles.freqText, { color: colors.primary, fontWeight: '700' }]}>1-3kHz</Text>
              <Text style={[styles.freqText, { color: colors.textMuted }]}>8kHz</Text>
            </View>
          </View>

          <Text style={[styles.spectrumLatency, { color: colors.textSecondary, fontSize: scaleFont(10) }]}>
            HVAC Damping: -22dB • 12ms Latency
          </Text>
        </View>
      </View>

      {/* 3. Environmental Alert Badges (Simulate Haptic Alerts) */}
      <View style={[styles.alertTriggerBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.alertHeaderRow}>
          <View style={styles.alertHeaderLeft}>
            <Bell size={16} color={colors.sos} />
            <Text style={[styles.alertBarTitle, { color: colors.text, fontSize: scaleFont(12) }]}>
              Environmental Sound Alert Triggers
            </Text>
          </View>
          <Text style={[styles.hapticHint, { color: colors.textMuted, fontSize: scaleFont(10) }]}>
            Haptic Pulses
          </Text>
        </View>

        <View style={styles.alertButtonsRow}>
          <TouchableOpacity
            style={[styles.alertTestBtn, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}
            onPress={() => triggerMockSoundEvent('door')}
            accessibilityLabel="Simulate Door Knock sound alert"
            accessibilityRole="button"
          >
            <Text style={[styles.alertTestText, { color: colors.text, fontSize: scaleFont(11) }]}>
              🚪 Door Knock
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.alertTestBtn, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}
            onPress={() => triggerMockSoundEvent('siren')}
            accessibilityLabel="Simulate Emergency Siren sound alert"
            accessibilityRole="button"
          >
            <Text style={[styles.alertTestText, { color: colors.sos, fontSize: scaleFont(11) }]}>
              🚨 Siren 84dB
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.alertTestBtn, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}
            onPress={() => triggerMockSoundEvent('speech')}
            accessibilityLabel="Simulate Speech Detected event"
            accessibilityRole="button"
          >
            <Text style={[styles.alertTestText, { color: colors.primary, fontSize: scaleFont(11) }]}>
              🗣️ Doc Calling
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. Live Real-Time Transcription Stream Container */}
      <View style={styles.transcriptHeaderRow}>
        <View style={styles.transcriptTitleGroup}>
          <Volume2 size={18} color={colors.primary} />
          <Text style={[styles.transcriptHeading, { color: colors.text, fontSize: scaleFont(16) }]}>
            Live Transcription Stream
          </Text>
        </View>
        <View style={styles.syncIndicator}>
          <View style={[styles.syncDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.syncText, { color: colors.textSecondary, fontSize: scaleFont(11) }]}>
            Real-Time Sync
          </Text>
        </View>
      </View>

      <View style={styles.transcriptList}>
        {transcripts.map((item) => (
          <View
            key={item.id}
            style={[
              styles.speakerCard,
              {
                backgroundColor: colors.surface,
                borderColor: item.role === 'patient' ? colors.primaryFixedDim : colors.border,
              },
            ]}
          >
            <View style={styles.speakerCardHeader}>
              <View style={styles.speakerProfile}>
                <View
                  style={[
                    styles.avatarInitials,
                    {
                      backgroundColor:
                        item.role === 'doctor'
                          ? colors.primaryContainer
                          : item.role === 'nurse'
                          ? colors.secondaryContainer
                          : colors.primary,
                    },
                  ]}
                >
                  <Text style={styles.avatarInitialsText}>{item.avatarInitials}</Text>
                </View>
                <View>
                  <Text style={[styles.speakerName, { color: colors.text, fontSize: scaleFont(13) }]}>
                    {item.speaker}
                  </Text>
                  <Text style={[styles.speakerRole, { color: colors.textMuted, fontSize: scaleFont(10) }]}>
                    {item.role === 'doctor' ? 'Physician' : item.role === 'nurse' ? 'Care Team' : 'Patient'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.timestampText, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
                {item.timestamp}
              </Text>
            </View>

            <Text
              style={[
                styles.captionBody,
                {
                  color: colors.text,
                  fontSize: getCaptionFontSize(),
                  lineHeight: getCaptionFontSize() * 1.45,
                },
              ]}
            >
              {item.text}
            </Text>
          </View>
        ))}
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
    gap: 12,
    paddingBottom: 28,
  },
  telemetryCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  telemetryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  telemetryStatusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  pulseBox: {
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
    opacity: 0.3,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusTitle: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusSub: {
    fontWeight: '500',
    marginTop: 1,
  },
  dbBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dbText: {
    fontWeight: '700',
  },
  ribbonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sizeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sizeLabel: {
    fontWeight: '600',
  },
  sizePill: {
    paddingHorizontal: 8,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  sizePillText: {
    fontSize: 10,
  },
  micToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 8,
  },
  micToggleText: {
    fontWeight: '700',
  },
  radarSpectrumGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  spectrumCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  spectrumCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spectrumTitle: {
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  ancBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ancText: {
    fontWeight: '700',
  },
  waveformBox: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 8,
    marginVertical: 4,
    alignItems: 'center',
  },
  freqLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 4,
  },
  freqText: {
    fontSize: 8,
  },
  spectrumLatency: {
    fontWeight: '500',
    textAlign: 'center',
  },
  alertTriggerBar: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 8,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertBarTitle: {
    fontWeight: '700',
  },
  hapticHint: {
    fontWeight: '500',
  },
  alertButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  alertTestBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 44,
  },
  alertTestText: {
    fontWeight: '600',
  },
  transcriptHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 2,
  },
  transcriptTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transcriptHeading: {
    fontWeight: '700',
  },
  syncIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  syncText: {
    fontWeight: '600',
  },
  transcriptList: {
    gap: 10,
  },
  speakerCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  speakerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  speakerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarInitials: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  speakerName: {
    fontWeight: '700',
  },
  speakerRole: {
    fontWeight: '500',
  },
  timestampText: {
    fontWeight: '500',
  },
  captionBody: {
    fontWeight: '500',
  },
});
