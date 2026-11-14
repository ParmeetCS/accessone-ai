import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
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
  Check,
  X,
  MicOff,
  Camera,
  SwitchCamera,
  Video,
  AlertTriangle,
  BookOpen,
  MessageSquare,
  Play,
  Pause,
} from 'lucide-react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { useBridgeStore, BridgeMode } from '../store/bridgeStore';
import { useUserStore } from '../store/userStore';
import { WaveformBar } from '../components/WaveformBar';
import { EchoSignAvatar } from '../components/EchoSignAvatar';

export const BridgeScreen: React.FC = () => {
  const { colors, scaleFont } = useAppTheme();
  const userLang = useUserStore((s) => s.language) || 'en-US';

  // Mode Selection
  const bridgeMode = useBridgeStore((s) => s.bridgeMode);
  const setBridgeMode = useBridgeStore((s) => s.setBridgeMode);

  // Two-Way Chat & Review State
  const messages = useBridgeStore((s) => s.messages);
  const quickPhrases = useBridgeStore((s) => s.quickPhrases);
  const isPartnerListening = useBridgeStore((s) => s.isPartnerListening);
  const isCounterFlipped = useBridgeStore((s) => s.isCounterFlipped);
  const showAslDrawer = useBridgeStore((s) => s.showAslDrawer);
  const typedVoiceText = useBridgeStore((s) => s.typedVoiceText);
  const bridgeSpeed = useBridgeStore((s) => s.bridgeSpeed);
  const isUserVoiceRecording = useBridgeStore((s) => s.isUserVoiceRecording);
  const pendingTranscript = useBridgeStore((s) => s.pendingTranscript);
  const pendingConfidence = useBridgeStore((s) => s.pendingConfidence);
  const pendingSender = useBridgeStore((s) => s.pendingSender);
  const isReviewingTranscript = useBridgeStore((s) => s.isReviewingTranscript);

  // EchoSign Animation State
  const signAnimations = useBridgeStore((s) => s.signAnimations);
  const glossSequence = useBridgeStore((s) => s.glossSequence);
  const originalSentence = useBridgeStore((s) => s.originalSentence);
  const missingVocabulary = useBridgeStore((s) => s.missingVocabulary);
  const isTranslatingSign = useBridgeStore((s) => s.isTranslatingSign);
  const signTranslationError = useBridgeStore((s) => s.signTranslationError);
  const signAvatarSpeed = useBridgeStore((s) => s.signAvatarSpeed);

  // EchoSign Camera & Sign Recognition State
  const isSignCameraActive = useBridgeStore((s) => s.isSignCameraActive);
  const signCameraFacing = useBridgeStore((s) => s.signCameraFacing);
  const isSignRecognizing = useBridgeStore((s) => s.isSignRecognizing);
  const recognizedSignText = useBridgeStore((s) => s.recognizedSignText);
  const signConfidence = useBridgeStore((s) => s.signConfidence);
  const signModelStatus = useBridgeStore((s) => s.signModelStatus);
  const signErrorMessage = useBridgeStore((s) => s.signErrorMessage);
  const signGestureSequence = useBridgeStore((s) => s.signGestureSequence);
  const lastLandmarkCount = useBridgeStore((s) => s.lastLandmarkCount);

  // Actions
  const setBridgeSpeed = useBridgeStore((s) => s.setBridgeSpeed);
  const setSignAvatarSpeed = useBridgeStore((s) => s.setSignAvatarSpeed);
  const togglePartnerListening = useBridgeStore((s) => s.togglePartnerListening);
  const startUserVoiceInput = useBridgeStore((s) => s.startUserVoiceInput);
  const stopUserVoiceInput = useBridgeStore((s) => s.stopUserVoiceInput);
  const setPendingTranscript = useBridgeStore((s) => s.setPendingTranscript);
  const approvePendingTranscript = useBridgeStore((s) => s.approvePendingTranscript);
  const discardPendingTranscript = useBridgeStore((s) => s.discardPendingTranscript);
  const toggleCounterFlipped = useBridgeStore((s) => s.toggleCounterFlipped);
  const toggleAslDrawer = useBridgeStore((s) => s.toggleAslDrawer);
  const setTypedVoiceText = useBridgeStore((s) => s.setTypedVoiceText);
  const speakAloudText = useBridgeStore((s) => s.speakAloudText);
  const quickSpeakPill = useBridgeStore((s) => s.quickSpeakPill);
  const replayMessageAudio = useBridgeStore((s) => s.replayMessageAudio);

  // EchoSign Actions
  const translateTextToSign = useBridgeStore((s) => s.translateTextToSign);
  const startVoiceToSignRecording = useBridgeStore((s) => s.startVoiceToSignRecording);
  const stopVoiceToSignRecording = useBridgeStore((s) => s.stopVoiceToSignRecording);
  const recognizeSignFromFrame = useBridgeStore((s) => s.recognizeSignFromFrame);
  const speakRecognizedSign = useBridgeStore((s) => s.speakRecognizedSign);
  const toggleSignCameraFacing = useBridgeStore((s) => s.toggleSignCameraFacing);
  const toggleSignCameraActive = useBridgeStore((s) => s.toggleSignCameraActive);
  const clearSignAnimation = useBridgeStore((s) => s.clearSignAnimation);
  const fetchSignCapabilities = useBridgeStore((s) => s.fetchSignCapabilities);

  // Camera permissions
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  // Local state for Text to Sign typing
  const [customSignText, setCustomSignText] = useState('');

  // Fetch capabilities on mount
  useEffect(() => {
    fetchSignCapabilities();
  }, []);

  // Mode tabs definition
  const MODE_TABS: Array<{ id: BridgeMode; title: string; subtitle: string }> = [
    { id: 'voice-to-sign', title: 'Voice → Sign', subtitle: 'Speech to ISL Avatar' },
    { id: 'sign-to-voice', title: 'Sign → Voice', subtitle: 'Camera to Speech' },
    { id: 'text-to-sign', title: 'Text → Sign', subtitle: 'Type to 3D Signer' },
    { id: 'two-way-chat', title: 'Two-Way Chat', subtitle: 'Clinical Dialogue' },
  ];

  // Handler for capturing frame from camera
  const handleCaptureFrameForRecognition = async () => {
    if (isSignRecognizing || !cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.6,
        skipProcessing: true,
      });
      if (photo?.base64) {
        recognizeSignFromFrame(photo.base64);
      }
    } catch (e: any) {
      console.warn('[BridgeScreen] Frame capture failed:', e.message);
    }
  };

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
        {/* 1. Mode Switcher Ribbon */}
        <View style={[styles.modeRibbonContainer, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.modeTabsScroll}
          >
            {MODE_TABS.map((tab) => {
              const isActive = bridgeMode === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.modeTabBtn,
                    {
                      backgroundColor: isActive ? colors.primary : colors.surface,
                      borderColor: isActive ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setBridgeMode(tab.id)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`${tab.title}: ${tab.subtitle}`}
                >
                  <Text
                    style={[
                      styles.modeTabTitle,
                      {
                        color: isActive ? colors.onPrimary : colors.text,
                        fontSize: scaleFont(12),
                      },
                    ]}
                  >
                    {tab.title}
                  </Text>
                  <Text
                    style={[
                      styles.modeTabSubtitle,
                      {
                        color: isActive ? colors.primaryFixedDim : colors.textMuted,
                        fontSize: scaleFont(9),
                      },
                    ]}
                  >
                    {tab.subtitle}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 2. MODE: Voice to Sign (Feature A) */}
        {bridgeMode === 'voice-to-sign' && (
          <View style={styles.sectionWrap}>
            {/* Header info */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardTitleLeft}>
                  <View style={[styles.modeBadge, { backgroundColor: colors.primaryContainer }]}>
                    <Mic size={16} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={[styles.cardTitle, { color: colors.text, fontSize: scaleFont(14) }]}>
                      Voice to Sign Translation
                    </Text>
                    <Text style={[styles.cardSubtitle, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
                      Speech → Whisper → ISL Gloss → 3D Avatar
                    </Text>
                  </View>
                </View>

                <View style={[styles.statusPill, { backgroundColor: colors.primaryFixed }]}>
                  <Text style={[styles.statusPillText, { color: colors.onPrimaryFixed, fontSize: scaleFont(10) }]}>
                    {userLang}
                  </Text>
                </View>
              </View>

              {/* Speech Capture Control */}
              <View style={[styles.voiceCaptureCard, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={[
                    styles.bigMicBtn,
                    { backgroundColor: isUserVoiceRecording ? colors.sos : colors.primary },
                  ]}
                  onPress={isUserVoiceRecording ? stopVoiceToSignRecording : startVoiceToSignRecording}
                  accessibilityLabel={isUserVoiceRecording ? 'Stop voice recording' : 'Start speaking'}
                  accessibilityRole="button"
                >
                  <Mic size={32} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={styles.voiceCaptureInfo}>
                  <Text style={[styles.voiceStateTitle, { color: colors.text, fontSize: scaleFont(14) }]}>
                    {isUserVoiceRecording ? 'Listening to your speech...' : 'Tap Mic & Speak Sentence'}
                  </Text>
                  <Text style={[styles.voiceStateDesc, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
                    {isUserVoiceRecording
                      ? 'Say words like "Hello, how are you", "Take medicine with food"'
                      : 'Audio is converted to ISL grammar and visualized on avatar'}
                  </Text>

                  {/* Waveform indicator */}
                  <View style={styles.waveformRow}>
                    <WaveformBar isActive={isUserVoiceRecording} color={colors.primary} barCount={16} height={22} />
                  </View>
                </View>
              </View>

              {/* Translation in progress indicator */}
              {isTranslatingSign && (
                <View style={[styles.translatingRow, { backgroundColor: colors.surfaceContainer }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.translatingText, { color: colors.primary, fontSize: scaleFont(12) }]}>
                    Translating into Indian Sign Language Gloss...
                  </Text>
                </View>
              )}

              {/* Translation error message if any */}
              {signTranslationError && (
                <View style={[styles.errorRow, { backgroundColor: colors.sosContainer }]}>
                  <AlertTriangle size={15} color={colors.sos} />
                  <Text style={[styles.errorText, { color: colors.sos, fontSize: scaleFont(11) }]}>
                    {signTranslationError}
                  </Text>
                </View>
              )}
            </View>

            {/* 3D Animated Avatar Viewer */}
            <EchoSignAvatar
              animationList={signAnimations}
              glossSequence={glossSequence}
              originalText={originalSentence}
              missingVocabulary={missingVocabulary}
              isLoading={isTranslatingSign}
            />

            {/* Quick vocalization sample pills to test easily */}
            <View style={styles.samplePhrasesSection}>
              <Text style={[styles.sectionHeading, { color: colors.textSecondary, fontSize: scaleFont(11) }]}>
                OR TAP A CLINICAL PHRASE TO ANIMATE SIGN LANGUAGE:
              </Text>
              <View style={styles.pillsWrap}>
                {[
                  'Hello, how are you?',
                  'Please take one tablet with water',
                  'Do you have fever or pain?',
                  'Doctor please help emergency',
                  'Thank you good morning',
                ].map((sample, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.samplePill, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => translateTextToSign(sample, 'english')}
                    accessibilityLabel={`Animate sign: ${sample}`}
                    accessibilityRole="button"
                  >
                    <Sparkles size={12} color={colors.primary} />
                    <Text style={[styles.samplePillText, { color: colors.text, fontSize: scaleFont(11) }]}>
                      {sample}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* 3. MODE: Sign to Voice (Feature B) */}
        {bridgeMode === 'sign-to-voice' && (
          <View style={styles.sectionWrap}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardTitleLeft}>
                  <View style={[styles.modeBadge, { backgroundColor: colors.secondaryContainer }]}>
                    <Camera size={16} color={colors.onSecondaryContainer} />
                  </View>
                  <View>
                    <Text style={[styles.cardTitle, { color: colors.text, fontSize: scaleFont(14) }]}>
                      Sign Language to Voice
                    </Text>
                    <Text style={[styles.cardSubtitle, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
                      Camera → MediaPipe (198 Keypoints) → LSTM → Speech
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.cameraSwitchBtn, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}
                  onPress={toggleSignCameraFacing}
                  accessibilityLabel="Switch front and rear camera"
                  accessibilityRole="button"
                >
                  <SwitchCamera size={15} color={colors.primary} />
                  <Text style={[styles.cameraSwitchText, { color: colors.primary, fontSize: scaleFont(10) }]}>
                    {signCameraFacing.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Camera Permission Verification */}
              {!cameraPermission?.granted ? (
                <View style={[styles.permissionBox, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
                  <AlertTriangle size={24} color={colors.primary} />
                  <Text style={[styles.permTitle, { color: colors.text, fontSize: scaleFont(13) }]}>
                    Camera Permission Required
                  </Text>
                  <Text style={[styles.permDesc, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
                    AccessOne AI requires front camera access to track hand signs and gestures for real-time translation.
                  </Text>
                  <TouchableOpacity
                    style={[styles.permBtn, { backgroundColor: colors.primary }]}
                    onPress={requestCameraPermission}
                    accessibilityLabel="Grant camera access"
                    accessibilityRole="button"
                  >
                    <Text style={[styles.permBtnText, { color: colors.onPrimary, fontSize: scaleFont(12) }]}>
                      Grant Camera Permission
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.cameraBoxContainer}>
                  {/* Live Camera View */}
                  <View style={styles.cameraPreviewWrapper}>
                    <CameraView
                      ref={cameraRef}
                      style={StyleSheet.absoluteFill}
                      facing={signCameraFacing}
                    />

                    {/* Live HUD Overlay as Sibling Overlay */}
                    <View style={styles.cameraOverlay} pointerEvents="box-none">
                      <View style={styles.cameraHudTop}>
                        <View style={styles.hudBadge}>
                          <View style={styles.recordingDot} />
                          <Text style={styles.hudBadgeText}>
                            198 KEYPOINTS TRACKER
                          </Text>
                        </View>
                        <View style={styles.hudBadge}>
                          <Text style={styles.hudBadgeText}>
                            {signCameraFacing === 'front' ? 'FRONT CAM' : 'BACK CAM'}
                          </Text>
                        </View>
                      </View>

                      {/* Center framing crosshair */}
                      <View style={styles.framingCrosshair}>
                        <View style={[styles.framingCorner, styles.cornerTL]} />
                        <View style={[styles.framingCorner, styles.cornerTR]} />
                        <View style={[styles.framingCorner, styles.cornerBL]} />
                        <View style={[styles.framingCorner, styles.cornerBR]} />
                        <Text style={styles.crosshairText}>
                          Place Hands & Upper Torso In Frame
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Recognition Trigger Controls */}
                  <View style={styles.cameraActionRow}>
                    <TouchableOpacity
                      style={[
                        styles.captureSignBtn,
                        { backgroundColor: isSignRecognizing ? colors.surfaceContainerHigh : colors.primary },
                      ]}
                      onPress={handleCaptureFrameForRecognition}
                      disabled={isSignRecognizing}
                      accessibilityLabel="Capture sign gesture"
                      accessibilityRole="button"
                    >
                      {isSignRecognizing ? (
                        <ActivityIndicator size="small" color={colors.onPrimary} />
                      ) : (
                        <Camera size={18} color={colors.onPrimary} />
                      )}
                      <Text style={[styles.captureSignBtnText, { color: colors.onPrimary, fontSize: scaleFont(13) }]}>
                        {isSignRecognizing ? 'Extracting Landmarks...' : 'Recognize Sign Gesture'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Model Weights Status Banner (Transparent Reporting) */}
              <View style={[styles.modelAuditCard, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
                <View style={styles.modelAuditHeader}>
                  <AlertTriangle size={15} color="#D97706" />
                  <Text style={[styles.modelAuditTitle, { color: colors.text, fontSize: scaleFont(12) }]}>
                    EchoSign Neural Classifier Audit
                  </Text>
                </View>
                <Text style={[styles.modelAuditBody, { color: colors.textSecondary, fontSize: scaleFont(11) }]}>
                  {signModelStatus?.message ||
                    'EchoSign LSTM gesture recognition weights (model.h5) are not packaged in this repo. Camera landmark extraction (198 features: 126 hand + 72 pose) is fully operational. Train model with ISL-CSLTR dataset to enable automated sign predictions.'}
                </Text>
                {signModelStatus?.setup_requirements && (
                  <View style={[styles.setupCodeBox, { backgroundColor: '#0B1C30' }]}>
                    <Text style={styles.setupCodeText}>
                      $ {signModelStatus.setup_requirements.training_command}
                    </Text>
                  </View>
                )}
              </View>

              {/* Recognition Result Display */}
              {recognizedSignText ? (
                <View style={[styles.resultCard, { backgroundColor: colors.primaryContainer }]}>
                  <View style={styles.resultHeader}>
                    <Text style={[styles.resultLabel, { color: colors.onPrimary, fontSize: scaleFont(11) }]}>
                      RECOGNIZED SIGN TRANSLATION
                    </Text>
                    {signConfidence && (
                      <Text style={[styles.resultConf, { color: colors.onPrimary, fontSize: scaleFont(10) }]}>
                        {Math.round(signConfidence * 100)}% Confidence
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.resultText, { color: '#FFFFFF', fontSize: scaleFont(18) }]}>
                    "{recognizedSignText}"
                  </Text>

                  {/* Vocalize to room button */}
                  <TouchableOpacity
                    style={[styles.vocalizeBtn, { backgroundColor: colors.primary }]}
                    onPress={() => speakRecognizedSign(recognizedSignText)}
                    accessibilityLabel="Speak translated sign aloud to room"
                    accessibilityRole="button"
                  >
                    <Volume2 size={16} color={colors.onPrimary} />
                    <Text style={[styles.vocalizeBtnText, { color: colors.onPrimary, fontSize: scaleFont(12) }]}>
                      Speak Aloud to Room
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          </View>
        )}

        {/* 4. MODE: Text to Sign (Feature C) */}
        {bridgeMode === 'text-to-sign' && (
          <View style={styles.sectionWrap}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardTitleLeft}>
                  <View style={[styles.modeBadge, { backgroundColor: colors.secondaryContainer }]}>
                    <BookOpen size={16} color={colors.onSecondaryContainer} />
                  </View>
                  <View>
                    <Text style={[styles.cardTitle, { color: colors.text, fontSize: scaleFont(14) }]}>
                      Text to Indian Sign Language
                    </Text>
                    <Text style={[styles.cardSubtitle, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
                      Text Input → ISL Grammar Reordering → 3D Avatar
                    </Text>
                  </View>
                </View>

                <View style={[styles.statusPill, { backgroundColor: colors.primaryFixed }]}>
                  <Text style={[styles.statusPillText, { color: colors.onPrimaryFixed, fontSize: scaleFont(10) }]}>
                    ISL Grammar
                  </Text>
                </View>
              </View>

              {/* Text Input Box */}
              <View style={styles.textInputBox}>
                <TextInput
                  style={[
                    styles.signTextInput,
                    {
                      backgroundColor: colors.surfaceContainerLow,
                      color: colors.text,
                      borderColor: colors.border,
                      fontSize: scaleFont(14),
                    },
                  ]}
                  placeholder="Type sentence in English, Hindi, or Tamil (e.g., 'Take medicine twice daily')..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                  value={customSignText}
                  onChangeText={setCustomSignText}
                  accessibilityLabel="Text input for sign language translation"
                />

                <View style={styles.textActionRow}>
                  <TouchableOpacity
                    style={[styles.textClearBtn, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}
                    onPress={() => setCustomSignText('')}
                    accessibilityLabel="Clear text"
                    accessibilityRole="button"
                  >
                    <Text style={[styles.textClearBtnText, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
                      Clear
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.translateSignBtn,
                      {
                        backgroundColor: customSignText.trim() ? colors.primary : colors.surfaceContainerHigh,
                      },
                    ]}
                    onPress={() => translateTextToSign(customSignText, 'english')}
                    disabled={!customSignText.trim() || isTranslatingSign}
                    accessibilityLabel="Translate text to sign animation"
                    accessibilityRole="button"
                  >
                    {isTranslatingSign ? (
                      <ActivityIndicator size="small" color={colors.onPrimary} />
                    ) : (
                      <Sparkles size={16} color={customSignText.trim() ? colors.onPrimary : colors.textMuted} />
                    )}
                    <Text
                      style={[
                        styles.translateSignBtnText,
                        {
                          color: customSignText.trim() ? colors.onPrimary : colors.textMuted,
                          fontSize: scaleFont(12),
                        },
                      ]}
                    >
                      {isTranslatingSign ? 'Generating...' : 'Translate to Sign'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sample Quick Phrases */}
              <View style={styles.quickMedicalChipsRow}>
                <Text style={[styles.sectionHeading, { color: colors.textSecondary, fontSize: scaleFont(10) }]}>
                  PRESET MEDICAL QUERIES:
                </Text>
                <View style={styles.pillsWrap}>
                  {[
                    'Take one tablet with food',
                    'Do you have any allergy?',
                    'Emergency hospital doctor',
                    'Please drink water and rest',
                  ].map((phrase, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.samplePill, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}
                      onPress={() => {
                        setCustomSignText(phrase);
                        translateTextToSign(phrase, 'english');
                      }}
                      accessibilityLabel={`Translate preset: ${phrase}`}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.samplePillText, { color: colors.text, fontSize: scaleFont(11) }]}>
                        {phrase}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* 3D Animated Avatar Viewer */}
            <EchoSignAvatar
              animationList={signAnimations}
              glossSequence={glossSequence}
              originalText={originalSentence}
              missingVocabulary={missingVocabulary}
              isLoading={isTranslatingSign}
            />
          </View>
        )}

        {/* 5. MODE: Two-Way Chat (Clinical Consultation Dialogue) */}
        {bridgeMode === 'two-way-chat' && (
          <View style={styles.sectionWrap}>
            {/* Top Utility Context Bar & Controls */}
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

            {/* ASL Visual Assist Interactive Badge & Drawer */}
            <View style={[styles.aslCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.aslHeaderRow}>
                <View style={styles.aslLeft}>
                  <View style={[styles.avatarIconPlaceholder, { backgroundColor: colors.primaryContainer }]}>
                    <Sparkles size={18} color="#FFFFFF" />
                  </View>
                  <View>
                    <View style={styles.aslTitleRow}>
                      <Text style={[styles.aslTitle, { color: colors.text, fontSize: scaleFont(13) }]}>
                        EchoSign ISL Avatar Assist
                      </Text>
                      <View style={[styles.readyTag, { backgroundColor: colors.primaryFixed }]}>
                        <Text style={[styles.readyTagText, { color: colors.onPrimaryFixed, fontSize: scaleFont(9) }]}>
                          ACTIVE (60 FPS)
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.aslSubtitle, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
                      Articulated 198-keypoint signer for clinical speech
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

              {/* Collapsible Live Avatar Drawer */}
              {showAslDrawer && (
                <View style={[styles.aslExpandedPane, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
                  <EchoSignAvatar
                    animationList={signAnimations}
                    glossSequence={glossSequence}
                    originalText={originalSentence || 'Take one tablet twice daily with food'}
                    missingVocabulary={missingVocabulary}
                  />
                </View>
              )}
            </View>

            {/* Conversation Feed */}
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

                          <TouchableOpacity
                            style={[styles.bubbleBtn, { backgroundColor: colors.surfaceContainerLow }]}
                            onPress={() => translateTextToSign(item.text, 'english')}
                            accessibilityLabel="Translate doctor message to ISL sign"
                            accessibilityRole="button"
                          >
                            <Sparkles size={14} color={colors.primary} />
                            <Text style={[styles.bubbleBtnText, { color: colors.primary, fontSize: scaleFont(11) }]}>
                              Sign with Avatar
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

            {/* Instant Vocalization Pills */}
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

            {/* Live Transcription Review Banner */}
            {isReviewingTranscript && (
              <View style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewHeaderLeft}>
                    <Sparkles size={16} color={colors.primary} />
                    <Text style={[styles.reviewTitle, { color: colors.text, fontSize: scaleFont(13) }]}>
                      {pendingSender === 'user' ? 'Review Your Spoken Message' : 'Review Provider Transcript'}
                    </Text>
                  </View>
                  {pendingConfidence && (
                    <View style={[styles.confPill, { backgroundColor: colors.primaryFixed }]}>
                      <Text style={[styles.confPillText, { color: colors.onPrimaryFixed, fontSize: scaleFont(10) }]}>
                        {Math.round(pendingConfidence)}% Conf
                      </Text>
                    </View>
                  )}
                </View>

                <TextInput
                  style={[
                    styles.reviewInput,
                    {
                      backgroundColor: colors.surfaceContainerLow,
                      borderColor: colors.border,
                      color: colors.text,
                      fontSize: scaleFont(14),
                    },
                  ]}
                  value={pendingTranscript || ''}
                  onChangeText={setPendingTranscript}
                  multiline
                  numberOfLines={3}
                  placeholder="Edit transcript before sending..."
                  placeholderTextColor={colors.textMuted}
                />

                <View style={styles.reviewActions}>
                  <TouchableOpacity
                    style={[styles.discardBtn, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}
                    onPress={discardPendingTranscript}
                    accessibilityLabel="Discard transcription"
                    accessibilityRole="button"
                  >
                    <X size={15} color={colors.textMuted} />
                    <Text style={[styles.discardBtnText, { color: colors.textMuted, fontSize: scaleFont(12) }]}>
                      Discard
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.approveBtn, { backgroundColor: colors.primary }]}
                    onPress={approvePendingTranscript}
                    accessibilityLabel="Approve and send message"
                    accessibilityRole="button"
                  >
                    <Check size={16} color={colors.onPrimary} />
                    <Text style={[styles.approveBtnText, { color: colors.onPrimary, fontSize: scaleFont(12) }]}>
                      Approve & Send
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Input Console (Partner Mic & Typed Voice) */}
            <View style={[styles.inputConsoleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* Partner Mic */}
              <View style={[styles.partnerMicRow, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={[
                    styles.partnerMicBtn,
                    { backgroundColor: isPartnerListening ? colors.sos : colors.primary },
                  ]}
                  onPress={togglePartnerListening}
                  accessibilityLabel={isPartnerListening ? 'Stop listening to partner' : 'Tap to hear Partner Mic'}
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
                      styles.clearBtn,
                      {
                        backgroundColor: isUserVoiceRecording ? colors.sos : colors.surfaceContainerLow,
                        borderColor: isUserVoiceRecording ? colors.sos : colors.border,
                      },
                    ]}
                    onPress={isUserVoiceRecording ? stopUserVoiceInput : startUserVoiceInput}
                    accessibilityLabel={isUserVoiceRecording ? 'Stop voice recording' : 'Record voice with microphone'}
                    accessibilityRole="button"
                  >
                    <Mic size={14} color={isUserVoiceRecording ? '#FFFFFF' : colors.primary} />
                    <Text
                      style={[
                        styles.clearBtnText,
                        {
                          color: isUserVoiceRecording ? '#FFFFFF' : colors.primary,
                          fontSize: scaleFont(12),
                          fontWeight: '600',
                        },
                      ]}
                    >
                      {isUserVoiceRecording ? 'Finish' : 'Voice'}
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
          </View>
        )}
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
    paddingBottom: 32,
  },
  modeRibbonContainer: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 6,
  },
  modeTabsScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  modeTabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 96,
  },
  modeTabTitle: {
    fontWeight: '700',
  },
  modeTabSubtitle: {
    marginTop: 2,
    fontWeight: '500',
  },
  sectionWrap: {
    gap: 12,
  },
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  modeBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontWeight: '700',
  },
  cardSubtitle: {
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    fontWeight: '700',
  },
  voiceCaptureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bigMicBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  voiceCaptureInfo: {
    flex: 1,
    gap: 4,
  },
  voiceStateTitle: {
    fontWeight: '700',
  },
  voiceStateDesc: {
    lineHeight: 16,
  },
  waveformRow: {
    height: 22,
    justifyContent: 'center',
    marginTop: 4,
  },
  translatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
  },
  translatingText: {
    fontWeight: '600',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 8,
  },
  errorText: {
    fontWeight: '600',
    flex: 1,
  },
  samplePhrasesSection: {
    gap: 6,
    marginTop: 4,
  },
  sectionHeading: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  samplePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  samplePillText: {
    fontWeight: '600',
  },
  cameraSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cameraSwitchText: {
    fontWeight: '700',
  },
  permissionBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  permTitle: {
    fontWeight: '700',
    marginTop: 4,
  },
  permDesc: {
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 6,
  },
  permBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  permBtnText: {
    fontWeight: '700',
  },
  cameraBoxContainer: {
    gap: 10,
  },
  cameraPreviewWrapper: {
    height: 260,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#000000',
    position: 'relative',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
    padding: 12,
  },
  cameraHudTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hudBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  hudBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  framingCrosshair: {
    width: 180,
    height: 180,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  framingCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#77D8BE',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  crosshairText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cameraActionRow: {
    marginTop: 4,
  },
  captureSignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  captureSignBtnText: {
    fontWeight: '700',
  },
  modelAuditCard: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 6,
  },
  modelAuditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modelAuditTitle: {
    fontWeight: '700',
  },
  modelAuditBody: {
    lineHeight: 16,
  },
  setupCodeBox: {
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
  },
  setupCodeText: {
    color: '#77D8BE',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  resultCard: {
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultLabel: {
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  resultConf: {
    fontWeight: '700',
  },
  resultText: {
    fontWeight: '700',
    fontStyle: 'italic',
  },
  vocalizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  vocalizeBtnText: {
    fontWeight: '700',
  },
  textInputBox: {
    gap: 8,
  },
  signTextInput: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    minHeight: 74,
    textAlignVertical: 'top',
  },
  textActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  textClearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textClearBtnText: {
    fontWeight: '600',
  },
  translateSignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  translateSignBtnText: {
    fontWeight: '700',
  },
  quickMedicalChipsRow: {
    gap: 6,
    marginTop: 4,
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
    padding: 8,
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
    flexWrap: 'wrap',
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
  reviewCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewTitle: {
    fontWeight: '700',
  },
  confPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  confPillText: {
    fontWeight: '700',
  },
  reviewInput: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    minHeight: 64,
    textAlignVertical: 'top',
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  discardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  discardBtnText: {
    fontWeight: '600',
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 8,
  },
  approveBtnText: {
    fontWeight: '700',
  },
});
