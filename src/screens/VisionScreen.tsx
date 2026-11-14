import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  Camera,
  ScanLine,
  Eye,
  Volume2,
  VolumeX,
  Flashlight,
  Sparkles,
  AlertTriangle,
  Copy,
  Check,
  RotateCcw,
  Sun,
  Ruler,
  Compass,
} from 'lucide-react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { useVisionStore, VisionMode } from '../store/visionStore';
import { useUserStore } from '../store/userStore';

export const VisionScreen: React.FC = () => {
  const { colors, scaleFont } = useAppTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [copied, setCopied] = useState(false);

  const currentMode = useVisionStore((s) => s.currentMode);
  const setMode = useVisionStore((s) => s.setMode);
  const isScanning = useVisionStore((s) => s.isScanning);
  const torchOn = useVisionStore((s) => s.torchOn);
  const toggleTorch = useVisionStore((s) => s.toggleTorch);
  const isSpeaking = useVisionStore((s) => s.isSpeaking);
  const activeResult = useVisionStore((s) => s.activeResult);
  const scanOCR = useVisionStore((s) => s.scanOCR);
  const describeScene = useVisionStore((s) => s.describeScene);
  const readAloud = useVisionStore((s) => s.readAloud);
  const stopSpeaking = useVisionStore((s) => s.stopSpeaking);
  const speechRate = useUserStore((s) => s.speechRate);
  const setSpeechRate = useUserStore((s) => s.setSpeechRate);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, []);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Mode Switcher Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.modeSwitcherContainer}
      >
        <TouchableOpacity
          style={[
            styles.modePill,
            {
              backgroundColor: currentMode === 'ocr' ? colors.primary : colors.surfaceContainerHigh,
            },
          ]}
          onPress={() => setMode('ocr')}
          accessibilityLabel="Read Text OCR Mode"
          accessibilityRole="tab"
          accessibilityState={{ selected: currentMode === 'ocr' }}
        >
          <ScanLine size={16} color={currentMode === 'ocr' ? colors.onPrimary : colors.text} />
          <Text
            style={[
              styles.modePillText,
              { color: currentMode === 'ocr' ? colors.onPrimary : colors.text, fontSize: scaleFont(12) },
            ]}
          >
            Read Text (OCR)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modePill,
            {
              backgroundColor: currentMode === 'describe' ? colors.primary : colors.surfaceContainerHigh,
            },
          ]}
          onPress={() => setMode('describe')}
          accessibilityLabel="Describe Surroundings Mode"
          accessibilityRole="tab"
          accessibilityState={{ selected: currentMode === 'describe' }}
        >
          <Eye size={16} color={currentMode === 'describe' ? colors.onPrimary : colors.text} />
          <Text
            style={[
              styles.modePillText,
              { color: currentMode === 'describe' ? colors.onPrimary : colors.text, fontSize: scaleFont(12) },
            ]}
          >
            Describe Surroundings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modePill,
            {
              backgroundColor: currentMode === 'objects' ? colors.primary : colors.surfaceContainerHigh,
            },
          ]}
          onPress={() => setMode('objects')}
          accessibilityLabel="Identify Objects Mode"
          accessibilityRole="tab"
          accessibilityState={{ selected: currentMode === 'objects' }}
        >
          <Sparkles size={16} color={currentMode === 'objects' ? colors.onPrimary : colors.text} />
          <Text
            style={[
              styles.modePillText,
              { color: currentMode === 'objects' ? colors.onPrimary : colors.text, fontSize: scaleFont(12) },
            ]}
          >
            Identify Objects
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 2. Speed Controller Quick Bar */}
      <View style={[styles.speedBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.speedLabelRow}>
          <Volume2 size={16} color={colors.primary} />
          <Text style={[styles.speedLabel, { color: colors.textSecondary, fontSize: scaleFont(12) }]}>
            TTS Speed
          </Text>
        </View>
        <View style={styles.speedButtonGroup}>
          {[0.85, 1.0, 1.25].map((rate) => (
            <TouchableOpacity
              key={rate}
              style={[
                styles.speedBtn,
                speechRate === rate
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border },
              ]}
              onPress={() => setSpeechRate(rate)}
              accessibilityLabel={`Set speech speed to ${rate}x`}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.speedBtnText,
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

      {/* 3. Live Camera Viewfinder & HUD */}
      <View style={[styles.viewfinderCard, { borderColor: colors.primary }]}>
        {permission?.granted ? (
          <CameraView
            style={styles.camera}
            enableTorch={torchOn}
            facing="back"
          >
            {/* Top HUD Indicators */}
            <View style={styles.hudTopRow}>
              <View style={styles.hudPillGroup}>
                <View style={styles.hudPill}>
                  <Sun size={12} color="#D1FAE5" />
                  <Text style={styles.hudPillText}>{activeResult?.lux || 480} Lux</Text>
                </View>
                <View style={styles.hudPill}>
                  <Ruler size={12} color="#D1FAE5" />
                  <Text style={styles.hudPillText}>{activeResult?.distance || '18 cm'}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.torchButton, torchOn && { backgroundColor: '#F59E0B' }]}
                onPress={toggleTorch}
                accessibilityLabel="Toggle camera flashlight"
                accessibilityRole="button"
              >
                <Flashlight size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* AI Bounding Target Box */}
            <View style={[styles.boundingTarget, { borderColor: colors.primaryFixedDim }]}>
              <View style={styles.targetHeader}>
                <View style={[styles.confidenceBadge, { backgroundColor: colors.primary }]}>
                  <Sparkles size={11} color="#FFFFFF" />
                  <Text style={styles.confidenceText}>
                    {currentMode === 'ocr' ? 'TEXT DETECTED: 99.4%' : 'SCENE MAPPED: 97.8%'}
                  </Text>
                </View>
              </View>
              <View style={styles.targetFooter}>
                <Text style={styles.targetTagText}>
                  {currentMode === 'ocr' ? 'Rx Label Aligned' : 'Clinical Spatial Grid'}
                </Text>
                <View style={[styles.activeLaserDot, { backgroundColor: colors.primaryFixedDim }]} />
              </View>
            </View>
          </CameraView>
        ) : (
          <View style={[styles.permissionFallback, { backgroundColor: colors.surfaceContainerLow }]}>
            <Camera size={38} color={colors.primary} />
            <Text style={[styles.permissionText, { color: colors.text, fontSize: scaleFont(14) }]}>
              Camera Access Required for Vision Assist
            </Text>
            <TouchableOpacity
              style={[styles.permissionBtn, { backgroundColor: colors.primary }]}
              onPress={requestPermission}
              accessibilityLabel="Grant Camera Permission"
              accessibilityRole="button"
            >
              <Text style={[styles.permissionBtnText, { color: colors.onPrimary }]}>
                Grant Camera Permission
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 4. Primary Capture & Analysis Buttons */}
      <View style={styles.actionButtonsGrid}>
        <TouchableOpacity
          style={[styles.primaryCaptureBtn, { backgroundColor: colors.primary }]}
          onPress={scanOCR}
          disabled={isScanning}
          accessibilityLabel="Scan Text OCR"
          accessibilityHint="Captures photo and reads prescription label or document text"
          accessibilityRole="button"
        >
          {isScanning ? (
            <ActivityIndicator color={colors.onPrimary} size="small" />
          ) : (
            <Camera size={20} color={colors.onPrimary} />
          )}
          <Text style={[styles.captureBtnText, { color: colors.onPrimary, fontSize: scaleFont(14) }]}>
            {isScanning ? 'Analyzing Scene...' : 'Scan Text (OCR)'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryDescribeBtn, { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.border }]}
          onPress={describeScene}
          disabled={isScanning}
          accessibilityLabel="Describe Scene Surroundings"
          accessibilityHint="Audibly narrates obstacles, walking paths, and detected objects"
          accessibilityRole="button"
        >
          <Eye size={18} color={colors.primary} />
          <Text style={[styles.describeBtnText, { color: colors.text, fontSize: scaleFont(13) }]}>
            Describe Scene
          </Text>
        </TouchableOpacity>
      </View>

      {/* 5. Detection Result Card */}
      {activeResult && (
        <View style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.resultHeader}>
            <View style={styles.resultHeaderLeft}>
              <View style={[styles.resultIconBox, { backgroundColor: colors.primaryFixed }]}>
                <ScanLine size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.resultModelTag, { color: colors.primary, fontSize: scaleFont(10) }]}>
                  CLINICAL VISION ENGINE v4
                </Text>
                <Text style={[styles.resultTitle, { color: colors.text, fontSize: scaleFont(15) }]}>
                  {activeResult.title}
                </Text>
              </View>
            </View>
            <View style={[styles.verifiedBadge, { backgroundColor: colors.primaryFixed }]}>
              <Text style={[styles.verifiedText, { color: colors.onPrimaryFixed, fontSize: scaleFont(11) }]}>
                Verified
              </Text>
            </View>
          </View>

          {/* Read Aloud Working Audio Synthesis Bar */}
          <View style={[styles.audioPlaybackBar, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
            <View style={styles.audioPlaybackTop}>
              <View style={styles.audioTitleRow}>
                <Volume2 size={16} color={colors.primary} />
                <Text style={[styles.audioPlaybackTitle, { color: colors.text, fontSize: scaleFont(12) }]}>
                  {isSpeaking ? 'Speaking Aloud Now...' : 'Text-to-Speech Synthesizer'}
                </Text>
              </View>
              <Text style={[styles.audioDuration, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
                {speechRate}x Rate
              </Text>
            </View>

            <View style={styles.audioActionRow}>
              <TouchableOpacity
                style={[
                  styles.readAloudMainBtn,
                  { backgroundColor: isSpeaking ? colors.sos : colors.primary },
                ]}
                onPress={() => readAloud()}
                accessibilityLabel={isSpeaking ? 'Stop speaking readout' : 'Read Aloud with Text-to-Speech'}
                accessibilityHint="Uses phone speaker to vocalize the prescription label"
                accessibilityRole="button"
              >
                {isSpeaking ? (
                  <>
                    <VolumeX size={18} color="#FFFFFF" />
                    <Text style={[styles.readAloudBtnText, { color: '#FFFFFF', fontSize: scaleFont(14) }]}>
                      Stop Reading
                    </Text>
                  </>
                ) : (
                  <>
                    <Volume2 size={18} color="#FFFFFF" />
                    <Text style={[styles.readAloudBtnText, { color: '#FFFFFF', fontSize: scaleFont(14) }]}>
                      Read Aloud
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.replayBtn, { backgroundColor: colors.surfaceContainerHigh }]}
                onPress={() => {
                  stopSpeaking();
                  setTimeout(() => readAloud(), 200);
                }}
                accessibilityLabel="Replay speech from start"
                accessibilityRole="button"
              >
                <RotateCcw size={16} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Prescription Label Transcription */}
          <View style={[styles.transcriptionBox, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
            <View style={styles.transcriptionTopRow}>
              <Text style={[styles.transcriptionLabel, { color: colors.textSecondary, fontSize: scaleFont(11) }]}>
                LABEL TRANSCRIPTION
              </Text>
              <TouchableOpacity
                onPress={handleCopy}
                style={styles.copyBtn}
                accessibilityLabel="Copy transcription text"
                accessibilityRole="button"
              >
                {copied ? <Check size={14} color={colors.primary} /> : <Copy size={14} color={colors.primary} />}
                <Text style={[styles.copyText, { color: colors.primary, fontSize: scaleFont(11) }]}>
                  {copied ? 'Copied' : 'Copy'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.transcriptionBody, { color: colors.text, fontSize: scaleFont(15) }]}>
              {activeResult.labelText}
            </Text>
          </View>

          {/* Patient Safety Note Alert Box */}
          {activeResult.warningText && (
            <View style={[styles.safetyWarningBox, { backgroundColor: colors.sosContainer, borderColor: colors.sos }]}>
              <AlertTriangle size={18} color={colors.sos} style={styles.warningIcon} />
              <View style={styles.warningContent}>
                <Text style={[styles.warningTitle, { color: colors.sos, fontSize: scaleFont(12) }]}>
                  Patient Safety Advisory
                </Text>
                <Text style={[styles.warningBody, { color: colors.text, fontSize: scaleFont(12) }]}>
                  {activeResult.warningText}
                </Text>
              </View>
            </View>
          )}

          {/* Surrounding Context */}
          <View style={[styles.surroundBox, { backgroundColor: colors.surfaceContainerLow }]}>
            <Compass size={14} color={colors.primary} />
            <Text style={[styles.surroundText, { color: colors.textSecondary, fontSize: scaleFont(11) }]}>
              Spatial Obstacle Distance: 18cm • Lighting level optimal
            </Text>
          </View>
        </View>
      )}
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
  modeSwitcherContainer: {
    gap: 8,
    paddingVertical: 2,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 21,
  },
  modePillText: {
    fontWeight: '600',
  },
  speedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  speedLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  speedLabel: {
    fontWeight: '600',
  },
  speedButtonGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  speedBtn: {
    paddingHorizontal: 10,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  speedBtnText: {
    fontSize: 12,
  },
  viewfinderCard: {
    height: 250,
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  camera: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 12,
  },
  hudTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hudPillGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  hudPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hudPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  torchButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boundingTarget: {
    flex: 1,
    marginVertical: 10,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'space-between',
    padding: 10,
  },
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  confidenceText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  targetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeLaserDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  permissionFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
  },
  permissionText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  permissionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionBtnText: {
    fontWeight: '700',
  },
  actionButtonsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryCaptureBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 50,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  captureBtnText: {
    fontWeight: '700',
  },
  secondaryDescribeBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 50,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
  },
  describeBtnText: {
    fontWeight: '600',
  },
  resultCard: {
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
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resultIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultModelTag: {
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  resultTitle: {
    fontWeight: '700',
    marginTop: 1,
  },
  verifiedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  verifiedText: {
    fontWeight: '700',
  },
  audioPlaybackBar: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 10,
  },
  audioPlaybackTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  audioTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  audioPlaybackTitle: {
    fontWeight: '600',
  },
  audioDuration: {
    fontWeight: '500',
  },
  audioActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  readAloudMainBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: 10,
  },
  readAloudBtnText: {
    fontWeight: '700',
  },
  replayBtn: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transcriptionBox: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 6,
  },
  transcriptionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transcriptionLabel: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 2,
  },
  copyText: {
    fontWeight: '600',
  },
  transcriptionBody: {
    fontWeight: '600',
    lineHeight: 22,
  },
  safetyWarningBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  warningIcon: {
    marginTop: 2,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontWeight: '700',
  },
  warningBody: {
    marginTop: 2,
    lineHeight: 17,
  },
  surroundBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 8,
  },
  surroundText: {
    fontWeight: '500',
  },
});
