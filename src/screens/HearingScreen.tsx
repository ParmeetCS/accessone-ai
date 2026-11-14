import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import {
  Mic,
  MicOff,
  StopCircle,
  Copy,
  Save,
  Trash2,
  Globe,
  Volume2,
  Bell,
  CheckCircle2,
  AlertCircle,
  Activity,
  Check,
} from 'lucide-react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { useHearingStore, CaptionMessage } from '../store/hearingStore';
import { SoundRadar } from '../components/SoundRadar';
import { WaveformBar } from '../components/WaveformBar';

const SUPPORTED_LANGUAGES = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'es-ES', label: 'Español' },
  { code: 'hi-IN', label: 'हिन्दी' },
  { code: 'ta-IN', label: 'தமிழ்' },
  { code: 'fr-FR', label: 'Français' },
];

export const HearingScreen: React.FC = () => {
  const { colors, scaleFont } = useAppTheme();

  const isListening = useHearingStore((s) => s.isListening);
  const isPaused = useHearingStore((s) => s.isPaused);
  const recordingStatus = useHearingStore((s) => s.recordingStatus);
  const ambientDb = useHearingStore((s) => s.ambientDb);
  const transcripts = useHearingStore((s) => s.transcripts);
  const soundEvents = useHearingStore((s) => s.soundEvents);
  const activeAlert = useHearingStore((s) => s.activeAlert);
  const selectedCaptionSize = useHearingStore((s) => s.selectedCaptionSize);
  const selectedLanguage = useHearingStore((s) => s.selectedLanguage);
  const errorMessage = useHearingStore((s) => s.errorMessage);

  const setCaptionSize = useHearingStore((s) => s.setCaptionSize);
  const setLanguage = useHearingStore((s) => s.setLanguage);
  const toggleListening = useHearingStore((s) => s.toggleListening);
  const startListening = useHearingStore((s) => s.startListening);
  const pauseListening = useHearingStore((s) => s.pauseListening);
  const resumeListening = useHearingStore((s) => s.resumeListening);
  const stopSession = useHearingStore((s) => s.stopSession);
  const clearTranscripts = useHearingStore((s) => s.clearTranscripts);
  const copyTranscript = useHearingStore((s) => s.copyTranscript);
  const saveTranscript = useHearingStore((s) => s.saveTranscript);
  const triggerMockSoundEvent = useHearingStore((s) => s.triggerMockSoundEvent);
  const dismissAlert = useHearingStore((s) => s.dismissAlert);
  const cleanup = useHearingStore((s) => s.cleanup);

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Proper cleanup on unmount: stops recording and releases hardware
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const showNotification = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3000);
  };

  const handleCopy = async () => {
    if (transcripts.length === 0) {
      showNotification('No transcripts to copy yet.');
      return;
    }
    const success = await copyTranscript();
    if (success) {
      showNotification('Transcript copied to clipboard.');
    }
  };

  const handleSave = async () => {
    if (transcripts.length === 0) {
      showNotification('No transcripts to save.');
      return;
    }
    const success = await saveTranscript();
    if (success) {
      showNotification('Transcript saved to activity records.');
    }
  };

  const handleClear = () => {
    clearTranscripts();
    showNotification('Caption stream cleared.');
  };

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

  const getStatusLabel = () => {
    if (recordingStatus === 'recording') {
      return `RECORDING LIVE • ${selectedLanguage.toUpperCase()} SPEECH`;
    }
    if (recordingStatus === 'paused') {
      return 'MICROPHONE PAUSED';
    }
    if (recordingStatus === 'transcribing') {
      return 'PROCESSING SPEECH...';
    }
    if (recordingStatus === 'error') {
      return 'MICROPHONE ERROR';
    }
    return 'STANDBY • READY TO LISTEN';
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Feedback Notification Toast */}
      {feedbackMessage && (
        <View style={[styles.feedbackBanner, { backgroundColor: colors.primaryContainer, borderColor: colors.primary }]}>
          <CheckCircle2 size={15} color={colors.onPrimary} />
          <Text style={[styles.feedbackText, { color: colors.onPrimary, fontSize: scaleFont(12) }]}>
            {feedbackMessage}
          </Text>
        </View>
      )}

      {/* Error / Permission Banner */}
      {errorMessage && (
        <View style={[styles.errorBanner, { backgroundColor: colors.sosContainer, borderColor: colors.sos }]}>
          <AlertCircle size={16} color={colors.sos} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.errorTitle, { color: colors.sos, fontSize: scaleFont(12) }]}>
              {errorMessage}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.sos }]}
            onPress={() => startListening()}
            accessibilityLabel="Retry microphone connection"
            accessibilityRole="button"
          >
            <Text style={[styles.retryText, { fontSize: scaleFont(10) }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

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
              <Text
                style={[
                  styles.statusTitle,
                  { color: isListening ? colors.primary : colors.textSecondary, fontSize: scaleFont(12) },
                ]}
              >
                {getStatusLabel()}
              </Text>
              <Text style={[styles.statusSub, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
                Acoustic Filter Active • No Background Rec
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
            accessibilityLabel={isListening ? 'Pause Listening' : 'Start Listening'}
            accessibilityHint="Toggles genuine microphone capture and acoustic speech recognition"
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
            ) : isPaused ? (
              <>
                <MicOff size={16} color={colors.text} />
                <Text style={[styles.micToggleText, { color: colors.text, fontSize: scaleFont(12) }]}>
                  Resume
                </Text>
              </>
            ) : (
              <>
                <Mic size={16} color={colors.text} />
                <Text style={[styles.micToggleText, { color: colors.text, fontSize: scaleFont(12) }]}>
                  Start
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Language Selection Ribbon */}
      <View style={[styles.langBarCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.langHeader}>
          <Globe size={14} color={colors.primary} />
          <Text style={[styles.langTitle, { color: colors.text, fontSize: scaleFont(11) }]}>
            Speech Language:
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.langScroll}>
          {SUPPORTED_LANGUAGES.map((l) => (
            <TouchableOpacity
              key={l.code}
              style={[
                styles.langPill,
                selectedLanguage === l.code
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border },
              ]}
              onPress={() => setLanguage(l.code)}
              accessibilityLabel={`Select speech language ${l.label}`}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.langPillText,
                  {
                    color: selectedLanguage === l.code ? colors.onPrimary : colors.text,
                    fontWeight: selectedLanguage === l.code ? '700' : '500',
                    fontSize: scaleFont(11),
                  },
                ]}
              >
                {l.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 3. Session Action Controls (Start, Pause, Stop, Save, Clear, Copy) */}
      <View style={[styles.actionControlsBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}
          onPress={stopSession}
          accessibilityLabel="Stop current listening session"
          accessibilityRole="button"
        >
          <StopCircle size={15} color={colors.sos} />
          <Text style={[styles.actionBtnText, { color: colors.sos, fontSize: scaleFont(11) }]}>
            Stop
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}
          onPress={handleSave}
          accessibilityLabel="Save session transcript"
          accessibilityRole="button"
        >
          <Save size={15} color={colors.primary} />
          <Text style={[styles.actionBtnText, { color: colors.primary, fontSize: scaleFont(11) }]}>
            Save
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}
          onPress={handleCopy}
          accessibilityLabel="Copy transcript to clipboard"
          accessibilityRole="button"
        >
          <Copy size={15} color={colors.text} />
          <Text style={[styles.actionBtnText, { color: colors.text, fontSize: scaleFont(11) }]}>
            Copy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}
          onPress={handleClear}
          accessibilityLabel="Clear caption stream"
          accessibilityRole="button"
        >
          <Trash2 size={15} color={colors.textMuted} />
          <Text style={[styles.actionBtnText, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
            Clear
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4. Visual Sound Map / 360 Spatial Radar & Frequency Spectrum Visualizer */}
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
            HVAC Damping: -22dB • FFT Peak Active
          </Text>
        </View>
      </View>

      {/* 5. Environmental Alert Badges (Physical Sound Detection Triggers) */}
      <View style={[styles.alertTriggerBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.alertHeaderRow}>
          <View style={styles.alertHeaderLeft}>
            <Bell size={16} color={colors.sos} />
            <Text style={[styles.alertBarTitle, { color: colors.text, fontSize: scaleFont(12) }]}>
              Environmental Sound Detection Alerts
            </Text>
          </View>
          <Text style={[styles.hapticHint, { color: colors.textMuted, fontSize: scaleFont(10) }]}>
            Physical Model
          </Text>
        </View>

        <View style={styles.alertButtonsRow}>
          <TouchableOpacity
            style={[styles.alertTestBtn, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}
            onPress={() => triggerMockSoundEvent('door')}
            accessibilityLabel="Test Door Knock acoustic alert"
            accessibilityRole="button"
          >
            <Text style={[styles.alertTestText, { color: colors.text, fontSize: scaleFont(11) }]}>
              🚪 Door Knock
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.alertTestBtn, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}
            onPress={() => triggerMockSoundEvent('alarm')}
            accessibilityLabel="Test Smoke / Fire Alarm acoustic alert"
            accessibilityRole="button"
          >
            <Text style={[styles.alertTestText, { color: colors.sos, fontSize: scaleFont(11) }]}>
              🔥 Fire Alarm 3.1k
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.alertTestBtn, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}
            onPress={() => triggerMockSoundEvent('siren')}
            accessibilityLabel="Test Emergency Siren acoustic alert"
            accessibilityRole="button"
          >
            <Text style={[styles.alertTestText, { color: colors.sos, fontSize: scaleFont(11) }]}>
              🚨 Siren 84dB
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 6. Live Real-Time Transcription Stream Container */}
      <View style={styles.transcriptHeaderRow}>
        <View style={styles.transcriptTitleGroup}>
          <Volume2 size={18} color={colors.primary} />
          <Text style={[styles.transcriptHeading, { color: colors.text, fontSize: scaleFont(16) }]}>
            Live Transcription Stream
          </Text>
        </View>
        <View style={styles.syncIndicator}>
          <View style={[styles.syncDot, { backgroundColor: isListening ? colors.primary : colors.textMuted }]} />
          <Text style={[styles.syncText, { color: colors.textSecondary, fontSize: scaleFont(11) }]}>
            {isListening ? 'Real-Time ASR Sync' : 'Stream Idle'}
          </Text>
        </View>
      </View>

      {/* Empty State when no speech transcripts */}
      {transcripts.length === 0 && (
        <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Mic size={28} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.text, fontSize: scaleFont(14) }]}>
            {isListening ? 'Listening for Speech...' : 'Microphone Ready'}
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.textMuted, fontSize: scaleFont(12) }]}>
            {isListening
              ? 'Speak clearly into the microphone. Genuine live captions and environmental sounds will appear here.'
              : 'Tap "Start" above to begin acoustic speech recognition and live captioning.'}
          </Text>
        </View>
      )}

      {/* Real Transcripts Feed */}
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
                    {item.role === 'doctor' ? 'Care Team' : item.role === 'nurse' ? 'Nurse' : 'Patient'}
                  </Text>
                </View>
              </View>

              <View style={styles.metaRight}>
                {item.confidence !== undefined && (
                  <View style={[styles.confBadge, { backgroundColor: colors.surfaceContainerLow }]}>
                    <Text style={[styles.confText, { color: colors.primary, fontSize: scaleFont(10) }]}>
                      {Math.round(item.confidence)}% Conf
                    </Text>
                  </View>
                )}
                <Text style={[styles.timestampText, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
                  {item.timestamp}
                </Text>
              </View>
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
    paddingBottom: 32,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  feedbackText: {
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  errorTitle: {
    fontWeight: '600',
  },
  retryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
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
  langBarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  langHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 4,
  },
  langTitle: {
    fontWeight: '600',
  },
  langScroll: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  langPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  langPillText: {
    fontWeight: '600',
  },
  actionControlsBar: {
    flexDirection: 'row',
    gap: 8,
    padding: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 36,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionBtnText: {
    fontWeight: '600',
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
  emptyContainer: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontWeight: '700',
    marginTop: 4,
  },
  emptyDesc: {
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
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
  metaRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  confBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  confText: {
    fontWeight: '700',
  },
  timestampText: {
    fontWeight: '500',
  },
  captionBody: {
    fontWeight: '500',
  },
});
