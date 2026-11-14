import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Mic,
  RotateCw,
  Volume2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Send,
  RefreshCw,
  ThumbsUp,
  Clock,
  Edit3,
  HelpCircle,
  Stethoscope,
  User,
  CheckCheck,
  Shield,
  Layers,
} from 'lucide-react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { useBridgeStore } from '../store/bridgeStore';
import { WaveformBar } from '../components/WaveformBar';

export const BridgeScreen: React.FC = () => {
  const { colors, scaleFont } = useAppTheme();

  const messages = useBridgeStore((s) => s.messages);
  const quickPhrases = useBridgeStore((s) => s.quickPhrases);
  const isPartnerListening = useBridgeStore((s) => s.isPartnerListening);
  const isCounterFlipped = useBridgeStore((s) => s.isCounterFlipped);
  const showAslDrawer = useBridgeStore((s) => s.showAslDrawer);
  const typedVoiceText = useBridgeStore((s) => s.typedVoiceText);
  const bridgeSpeed = useBridgeStore((s) => s.bridgeSpeed);

  const setBridgeSpeed = useBridgeStore((s) => s.setBridgeSpeed);
  const togglePartnerListening = useBridgeStore((s) => s.togglePartnerListening);
  const toggleCounterFlipped = useBridgeStore((s) => s.toggleCounterFlipped);
  const toggleAslDrawer = useBridgeStore((s) => s.toggleAslDrawer);
  const setTypedVoiceText = useBridgeStore((s) => s.setTypedVoiceText);
  const speakAloudText = useBridgeStore((s) => s.speakAloudText);
  const quickSpeakPill = useBridgeStore((s) => s.quickSpeakPill);
  const replayMessageAudio = useBridgeStore((s) => s.replayMessageAudio);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Top Utility Context Bar & Controls */}
        <View style={styles.topUtilityBar}>
          <View style={[styles.contextPill, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
            <Shield size={14} color={colors.primary} />
            <Text style={[styles.contextText, { color: colors.text, fontSize: scaleFont(11) }]}>
              Medical & Consultation
            </Text>
          </View>

          <View style={styles.topToolsRight}>
            {/* Speed selector */}
            <View style={[styles.speedSelector, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
              {[1.0, 1.25, 1.5].map((spd) => (
                <TouchableOpacity
                  key={spd}
                  style={[
                    styles.speedBtn,
                    bridgeSpeed === spd && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setBridgeSpeed(spd)}
                  accessibilityLabel={`Set speech speed ${spd}x`}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.speedText,
                      {
                        color: bridgeSpeed === spd ? colors.onPrimary : colors.text,
                        fontWeight: bridgeSpeed === spd ? '700' : '500',
                      },
                    ]}
                  >
                    {spd}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Counter Flip Button */}
            <TouchableOpacity
              style={[
                styles.flipBtn,
                {
                  backgroundColor: isCounterFlipped ? colors.primary : colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={toggleCounterFlipped}
              accessibilityLabel="Flip screen view for provider across counter"
              accessibilityRole="button"
            >
              <RotateCw size={15} color={isCounterFlipped ? colors.onPrimary : colors.primary} />
              <Text
                style={[
                  styles.flipBtnText,
                  { color: isCounterFlipped ? colors.onPrimary : colors.text, fontSize: scaleFont(11) },
                ]}
              >
                Flip
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. ASL Visual Assist Interactive Badge & Drawer */}
        <View
          style={[
            styles.aslCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.aslHeaderRow}>
            <View style={styles.aslLeft}>
              <View style={[styles.avatarIconPlaceholder, { backgroundColor: colors.primaryContainer }]}>
                <Sparkles size={18} color="#FFFFFF" />
              </View>
              <View>
                <View style={styles.aslTitleRow}>
                  <Text style={[styles.aslTitle, { color: colors.text, fontSize: scaleFont(13) }]}>
                    ASL Visual Assist
                  </Text>
                  <View style={[styles.readyTag, { backgroundColor: colors.primaryFixed }]}>
                    <Text style={[styles.readyTagText, { color: colors.onPrimaryFixed, fontSize: scaleFont(9) }]}>
                      READY
                    </Text>
                  </View>
                </View>
                <Text style={[styles.aslSubtitle, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
                  Live signer active for incoming speech
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.aslToggleBtn, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}
              onPress={toggleAslDrawer}
              accessibilityLabel={showAslDrawer ? 'Hide ASL Avatar preview' : 'View ASL Avatar preview'}
              accessibilityRole="button"
            >
              <Text style={[styles.aslToggleBtnText, { color: colors.primary, fontSize: scaleFont(11) }]}>
                {showAslDrawer ? 'Hide' : 'View'}
              </Text>
              {showAslDrawer ? (
                <ChevronUp size={14} color={colors.primary} />
              ) : (
                <ChevronDown size={14} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>

          {/* Collapsible Live ASL Preview Pane */}
          {showAslDrawer && (
            <View style={[styles.aslExpandedPane, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
              <View style={[styles.avatarVisualBox, { backgroundColor: '#0B1C30' }]}>
                <View style={styles.aslBadgeTop}>
                  <Sparkles size={12} color="#77D8BE" />
                  <Text style={styles.aslBadgeText}>Syncing TTS Stream (60 FPS)</Text>
                </View>
                <View style={styles.aslSubtitleOverlay}>
                  <Text style={styles.aslSubtitleText}>
                    "Take one tablet twice daily with food"
                  </Text>
                </View>
              </View>
              <View style={styles.aslPaneFooter}>
                <Text style={[styles.aslDialect, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
                  ASL Dialect: US Clinical Standard
                </Text>
                <Text style={[styles.aslFps, { color: colors.primary, fontSize: scaleFont(11) }]}>
                  GPU Accelerated
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* 3. Two-Way Conversation Dialogue Feed (Counter Flipped Support) */}
        <View
          style={[
            styles.feedContainer,
            isCounterFlipped && { transform: [{ rotate: '180deg' }] },
          ]}
        >
          {messages.map((item) => {
            const isDoctor = item.sender === 'doctor';
            return (
              <View
                key={item.id}
                style={[
                  styles.messageWrapper,
                  isDoctor ? styles.messageDoctorWrapper : styles.messageUserWrapper,
                ]}
              >
                {/* Sender Header */}
                <View style={[styles.senderHeader, isDoctor ? { alignSelf: 'flex-start' } : { alignSelf: 'flex-end' }]}>
                  {isDoctor && (
                    <View style={[styles.miniAvatar, { backgroundColor: colors.secondaryContainer }]}>
                      <Stethoscope size={11} color={colors.onSecondaryContainer} />
                    </View>
                  )}
                  <Text style={[styles.senderName, { color: colors.text, fontSize: scaleFont(12) }]}>
                    {item.senderName}
                  </Text>
                  <Text style={[styles.messageTimestamp, { color: colors.textMuted, fontSize: scaleFont(10) }]}>
                    {item.timestamp}
                  </Text>
                  {!isDoctor && (
                    <View style={[styles.miniAvatar, { backgroundColor: colors.primary }]}>
                      <User size={11} color={colors.onPrimary} />
                    </View>
                  )}
                </View>

                {/* Bubble Body */}
                <View
                  style={[
                    styles.messageBubble,
                    isDoctor
                      ? [
                          styles.doctorBubble,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                          },
                        ]
                      : [
                          styles.userBubble,
                          {
                            backgroundColor: colors.primary,
                          },
                        ],
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      {
                        color: isDoctor ? colors.text : colors.onPrimary,
                        fontSize: scaleFont(15),
                        lineHeight: scaleFont(22),
                      },
                    ]}
                  >
                    {item.text}
                  </Text>

                  {/* Bubble Actions */}
                  {isDoctor ? (
                    <View style={styles.bubbleActionRow}>
                      <TouchableOpacity
                        style={[styles.bubbleBtn, { backgroundColor: colors.surfaceContainerLow }]}
                        onPress={() => replayMessageAudio(item)}
                        accessibilityLabel="Replay audio aloud"
                        accessibilityRole="button"
                      >
                        <Volume2 size={14} color={colors.primary} />
                        <Text style={[styles.bubbleBtnText, { color: colors.primary, fontSize: scaleFont(11) }]}>
                          Replay Audio
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.spokenIndicatorRow}>
                      <View style={styles.spokenBadge}>
                        <Volume2 size={12} color={colors.primaryFixedDim} />
                        <Text style={[styles.spokenText, { color: colors.primaryFixedDim, fontSize: scaleFont(10) }]}>
                          Spoken to Room (100% Vol)
                        </Text>
                      </View>
                      <CheckCheck size={14} color={colors.primaryFixedDim} />
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* 4. One-Touch Instant Voice Quick Phrases Pills */}
        <View style={styles.quickPhrasesSection}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: scaleFont(11) }]}>
            INSTANT VOCALIZATION PILLS (TAP TO SPEAK)
          </Text>
          <View style={styles.pillsWrap}>
            {quickPhrases.map((phrase, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.phrasePill,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => quickSpeakPill(phrase)}
                accessibilityLabel={`Quick speak: ${phrase}`}
                accessibilityHint="Immediately synthesizes this phrase over the loudspeaker"
                accessibilityRole="button"
              >
                <Volume2 size={13} color={colors.primary} />
                <Text style={[styles.phraseText, { color: colors.text, fontSize: scaleFont(12) }]}>
                  {phrase}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 5. Dual Input Console (Partner Mic & Typed Voice) */}
        <View style={[styles.inputConsoleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Partner Mic Audio Capture */}
          <View style={[styles.partnerMicRow, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.partnerMicBtn,
                { backgroundColor: isPartnerListening ? colors.sos : colors.primary },
              ]}
              onPress={togglePartnerListening}
              accessibilityLabel={isPartnerListening ? 'Stop listening to partner' : 'Tap to hear Partner Mic'}
              accessibilityHint="Listens to healthcare provider speech and generates transcription"
              accessibilityRole="button"
            >
              <Mic size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.partnerMicInfo}>
              <View style={styles.partnerMicTitleRow}>
                <Text style={[styles.partnerMicTitle, { color: colors.text, fontSize: scaleFont(14) }]}>
                  Partner Mic
                </Text>
                <View
                  style={[
                    styles.micStatusTag,
                    {
                      backgroundColor: isPartnerListening ? colors.sosContainer : colors.surfaceContainer,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.micStatusText,
                      {
                        color: isPartnerListening ? colors.sos : colors.textSecondary,
                        fontSize: scaleFont(10),
                      },
                    ]}
                  >
                    {isPartnerListening ? 'CAPTURING...' : 'STANDBY'}
                  </Text>
                </View>
              </View>

              {/* Waveform Bar */}
              <View style={styles.partnerWaveformBox}>
                <WaveformBar isActive={isPartnerListening} color={colors.primary} barCount={12} height={20} />
              </View>
              <Text style={[styles.partnerPromptText, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
                {isPartnerListening ? 'Listening to Dr. Patel...' : 'Tap to hear Dr. Patel'}
              </Text>
            </View>
          </View>

          {/* Your Typed Voice Section */}
          <View style={styles.typedVoiceSection}>
            <View style={styles.typedVoiceHeader}>
              <Text style={[styles.typedVoiceTitle, { color: colors.text, fontSize: scaleFont(13) }]}>
                Your Typed Voice
              </Text>
              <Text style={[styles.charCount, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
                {typedVoiceText.length} / 280
              </Text>
            </View>

            <TextInput
              style={[
                styles.typedInput,
                {
                  backgroundColor: colors.surfaceContainerLow,
                  color: colors.text,
                  borderColor: colors.border,
                  fontSize: scaleFont(14),
                },
              ]}
              placeholder="Type here to synthesize clinical audio to room..."
              placeholderTextColor={colors.textMuted}
              multiline={true}
              numberOfLines={3}
              maxLength={280}
              value={typedVoiceText}
              onChangeText={setTypedVoiceText}
              accessibilityLabel="Typed voice input box"
              accessibilityHint="Type message to speak aloud using text to speech"
            />

            <View style={styles.typedActionRow}>
              <TouchableOpacity
                style={[styles.clearBtn, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}
                onPress={() => setTypedVoiceText('')}
                accessibilityLabel="Clear typed voice input"
                accessibilityRole="button"
              >
                <Text style={[styles.clearBtnText, { color: colors.textSecondary, fontSize: scaleFont(12) }]}>
                  Clear
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.speakAloudBtn,
                  {
                    backgroundColor: typedVoiceText.trim() ? colors.primary : colors.surfaceContainerHigh,
                  },
                ]}
                onPress={() => speakAloudText(typedVoiceText, true)}
                disabled={!typedVoiceText.trim()}
                accessibilityLabel="Speak Aloud to room"
                accessibilityHint="Synthesizes typed text through device speakers and posts to conversation feed"
                accessibilityRole="button"
              >
                <Volume2 size={18} color={typedVoiceText.trim() ? colors.onPrimary : colors.textMuted} />
                <Text
                  style={[
                    styles.speakAloudBtnText,
                    {
                      color: typedVoiceText.trim() ? colors.onPrimary : colors.textMuted,
                      fontSize: scaleFont(13),
                    },
                  ]}
                >
                  Speak Aloud
                </Text>
                <Send size={15} color={typedVoiceText.trim() ? colors.onPrimary : colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  topUtilityBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  contextText: {
    fontWeight: '600',
  },
  topToolsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  speedSelector: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 2,
  },
  speedBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  speedText: {
    fontSize: 11,
  },
  flipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  flipBtnText: {
    fontWeight: '600',
  },
  aslCard: {
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
  aslHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aslLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarIconPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aslTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aslTitle: {
    fontWeight: '700',
  },
  readyTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  readyTagText: {
    fontWeight: '700',
  },
  aslSubtitle: {
    marginTop: 1,
  },
  aslToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 34,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  aslToggleBtnText: {
    fontWeight: '700',
  },
  aslExpandedPane: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    gap: 8,
  },
  avatarVisualBox: {
    height: 110,
    borderRadius: 8,
    padding: 8,
    justifyContent: 'space-between',
  },
  aslBadgeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  aslBadgeText: {
    color: '#77D8BE',
    fontSize: 10,
    fontWeight: '600',
  },
  aslSubtitleOverlay: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  aslSubtitleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  aslPaneFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aslDialect: {
    fontWeight: '500',
  },
  aslFps: {
    fontWeight: '600',
  },
  feedContainer: {
    gap: 12,
    marginVertical: 4,
  },
  messageWrapper: {
    gap: 4,
    maxWidth: '92%',
  },
  messageDoctorWrapper: {
    alignSelf: 'flex-start',
  },
  messageUserWrapper: {
    alignSelf: 'flex-end',
  },
  senderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  miniAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  senderName: {
    fontWeight: '700',
  },
  messageTimestamp: {
    fontWeight: '500',
  },
  messageBubble: {
    borderRadius: 16,
    padding: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  doctorBubble: {
    borderTopLeftRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  userBubble: {
    borderTopRightRadius: 4,
  },
  messageText: {
    fontWeight: '500',
  },
  bubbleActionRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4,
  },
  bubbleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bubbleBtnText: {
    fontWeight: '600',
  },
  spokenIndicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  spokenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  spokenText: {
    fontWeight: '600',
  },
  quickPhrasesSection: {
    gap: 8,
    marginTop: 4,
  },
  sectionTitle: {
    fontWeight: '700',
    letterSpacing: 0.6,
    paddingHorizontal: 2,
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  phrasePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    minHeight: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  phraseText: {
    fontWeight: '600',
  },
  inputConsoleCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 14,
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  partnerMicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  partnerMicBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  partnerMicInfo: {
    flex: 1,
    gap: 4,
  },
  partnerMicTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partnerMicTitle: {
    fontWeight: '700',
  },
  micStatusTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  micStatusText: {
    fontWeight: '700',
  },
  partnerWaveformBox: {
    height: 20,
    justifyContent: 'center',
  },
  partnerPromptText: {
    fontWeight: '500',
  },
  typedVoiceSection: {
    gap: 8,
  },
  typedVoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typedVoiceTitle: {
    fontWeight: '700',
  },
  charCount: {
    fontWeight: '500',
  },
  typedInput: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    minHeight: 74,
    textAlignVertical: 'top',
  },
  typedActionRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  clearBtn: {
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontWeight: '600',
  },
  speakAloudBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  speakAloudBtnText: {
    fontWeight: '700',
  },
});
