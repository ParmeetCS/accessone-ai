import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
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
  Upload,
  Video,
  SwitchCamera,
  Contrast,
  Pause,
  Play,
} from 'lucide-react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { useVisionStore, VisionMode } from '../store/visionStore';
import { useUserStore } from '../store/userStore';

export const VisionScreen: React.FC = () => {
  const { colors, scaleFont } = useAppTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const isFocused = useIsFocused();
  const cameraRef = useRef<any>(null);
  const [copied, setCopied] = useState(false);

  // Vision Store State & Actions
  const currentMode = useVisionStore((s) => s.currentMode);
  const setMode = useVisionStore((s) => s.setMode);
  const isScanning = useVisionStore((s) => s.isScanning);
  const scanError = useVisionStore((s) => s.scanError);
  const clearError = useVisionStore((s) => s.clearError);
  const torchOn = useVisionStore((s) => s.torchOn);
  const toggleTorch = useVisionStore((s) => s.toggleTorch);
  const cameraFacing = useVisionStore((s) => s.cameraFacing);
  const toggleCameraFacing = useVisionStore((s) => s.toggleCameraFacing);
  const isLive = useVisionStore((s) => s.isLive);
  const toggleLive = useVisionStore((s) => s.toggleLive);
  const isSpeaking = useVisionStore((s) => s.isSpeaking);
  const isPaused = useVisionStore((s) => s.isPaused);
  const activeResult = useVisionStore((s) => s.activeResult);
  const analyzeImageBase64 = useVisionStore((s) => s.analyzeImageBase64);
  const readAloud = useVisionStore((s) => s.readAloud);
  const pauseSpeaking = useVisionStore((s) => s.pauseSpeaking);
  const resumeSpeaking = useVisionStore((s) => s.resumeSpeaking);
  const stopSpeaking = useVisionStore((s) => s.stopSpeaking);
  const replaySpeaking = useVisionStore((s) => s.replaySpeaking);

  // User Settings State
  const speechRate = useUserStore((s) => s.speechRate);
  const setSpeechRate = useUserStore((s) => s.setSpeechRate);
  const toggleHighContrast = useUserStore((s) => s.toggleHighContrast);
  const isHighContrast = useUserStore((s) => s.isHighContrast);

  // Permission Request on Mount
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, []);

  // Live Auto-Capture Loop when Live Mode is active
  useEffect(() => {
    if (!isLive || !isFocused || !permission?.granted) return;

    const interval = setInterval(async () => {
      if (cameraRef.current && !isScanning) {
        try {
          const photo = await cameraRef.current.takePictureAsync({
            base64: true,
            quality: 0.6,
            skipProcessing: true,
          });
          if (photo?.base64) {
            analyzeImageBase64(photo.base64, photo.uri);
          }
        } catch (e) {
          console.warn('[Live Auto-Capture] Frame capture skipped:', e);
        }
      }
    }, 4500); // 4.5s cadence to avoid overwhelming device or backend

    return () => clearInterval(interval);
  }, [isLive, isFocused, permission?.granted, isScanning]);

  // Capture from live camera
  const handleCaptureAndAnalyze = async () => {
    if (isScanning) return;
    if (!cameraRef.current) {
      alert('Camera is not ready. Please ensure camera permissions are granted.');
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
        skipProcessing: false,
      });

      if (photo?.base64) {
        await analyzeImageBase64(photo.base64, photo.uri);
      }
    } catch (e: any) {
      console.warn('[Camera Capture Error]', e);
    }
  };

  // Upload image from photo library
  const handleUploadImage = async () => {
    if (isScanning) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          await analyzeImageBase64(asset.base64, asset.uri);
        }
      }
    } catch (e: any) {
      console.warn('[Image Upload Error]', e);
    }
  };

  // Copy transcription to clipboard
  const handleCopy = async () => {
    if (activeResult?.labelText) {
      await Clipboard.setStringAsync(activeResult.labelText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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

      {/* 2. Speed Controller & High Contrast Quick Bar */}
      <View style={[styles.speedBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.speedLabelRow}>
          <Volume2 size={16} color={colors.primary} />
          <Text style={[styles.speedLabel, { color: colors.textSecondary, fontSize: scaleFont(12) }]}>
            Speed
          </Text>
          <View style={styles.speedButtonGroup}>
            {[0.85, 1.0, 1.25, 1.5].map((rate) => (
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

        <TouchableOpacity
          style={[
            styles.contrastBtn,
            {
              backgroundColor: isHighContrast ? colors.primary : colors.surfaceContainerLow,
              borderColor: colors.border,
            },
          ]}
          onPress={toggleHighContrast}
          accessibilityLabel="Toggle High Contrast Mode"
          accessibilityRole="button"
        >
          <Contrast size={14} color={isHighContrast ? colors.onPrimary : colors.text} />
          <Text
            style={[
              styles.contrastBtnText,
              { color: isHighContrast ? colors.onPrimary : colors.text, fontSize: scaleFont(11) },
            ]}
          >
            Contrast
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Live Camera Viewfinder & HUD */}
      <View style={[styles.viewfinderCard, { borderColor: colors.primary }]}>
        {permission?.granted && isFocused ? (
          <View style={StyleSheet.absoluteFill}>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              enableTorch={torchOn}
              facing={cameraFacing}
            />
            {/* Top HUD Indicators & Bounding Target Overlay */}
            <View style={[StyleSheet.absoluteFill, { justifyContent: 'space-between', padding: 12 }]} pointerEvents="box-none">
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

                <View style={styles.hudActionGroup}>
                  <TouchableOpacity
                    style={[styles.hudCircleBtn, torchOn && { backgroundColor: '#F59E0B' }]}
                    onPress={toggleTorch}
                    accessibilityLabel="Toggle camera flashlight"
                    accessibilityRole="button"
                  >
                    <Flashlight size={18} color="#FFFFFF" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.hudCircleBtn}
                    onPress={toggleCameraFacing}
                    accessibilityLabel="Switch camera facing"
                    accessibilityRole="button"
                  >
                    <SwitchCamera size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* AI Bounding Target Box */}
              <View
                style={[
                  styles.boundingTarget,
                  {
                    borderColor: isScanning ? '#F59E0B' : colors.primaryFixedDim,
                    borderStyle: isScanning ? 'solid' : 'dashed',
                  },
                ]}
              >
                <View style={styles.targetHeader}>
                  <View
                    style={[
                      styles.confidenceBadge,
                      { backgroundColor: isScanning ? '#F59E0B' : colors.primary },
                    ]}
                  >
                    <Sparkles size={11} color="#FFFFFF" />
                    <Text style={styles.confidenceText}>
                      {isScanning
                        ? 'ANALYZING SCENE...'
                        : activeResult
                        ? `CONFIDENCE: ${activeResult.confidence}%`
                        : currentMode === 'ocr'
                        ? 'ALIGN TEXT IN FRAME'
                        : currentMode === 'objects'
                        ? 'OBJECT DETECTION READY'
                        : 'SURROUNDINGS READY'}
                    </Text>
                  </View>
                </View>

                <View style={styles.targetFooter}>
                  <Text style={styles.targetTagText}>
                    {currentMode === 'ocr'
                      ? 'Optical Character Recognition'
                      : currentMode === 'objects'
                      ? 'Neural Spatial Object Grid'
                      : 'Environmental Overview'}
                  </Text>
                  <View
                    style={[
                      styles.activeLaserDot,
                      { backgroundColor: isLive ? '#EF4444' : colors.primaryFixedDim },
                    ]}
                  />
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.permissionFallback, { backgroundColor: colors.surfaceContainerLow }]}>
            <Camera size={38} color={colors.primary} />
            <Text style={[styles.permissionText, { color: colors.text, fontSize: scaleFont(14) }]}>
              {!permission?.granted
                ? 'Camera Access Required for Vision Assist'
                : 'Camera Paused in Background'}
            </Text>
            {!permission?.granted && (
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
            )}
          </View>
        )}
      </View>

      {/* 4. Primary Mobile Capture Controls Grid (Capture & Analyze, Live, Upload) */}
      <View style={styles.primaryControlsGrid}>
        {/* Col-span-2: Capture & Analyze Button */}
        <TouchableOpacity
          style={[
            styles.captureMainBtn,
            { backgroundColor: colors.primary },
            isScanning && { opacity: 0.8 },
          ]}
          onPress={handleCaptureAndAnalyze}
          disabled={isScanning}
          accessibilityLabel="Capture photo and analyze"
          accessibilityHint="Takes a live photo and performs AI text reading or scene identification"
          accessibilityRole="button"
        >
          {isScanning ? (
            <ActivityIndicator color={colors.onPrimary} size="small" />
          ) : (
            <Camera size={20} color={colors.onPrimary} />
          )}
          <Text style={[styles.captureBtnText, { color: colors.onPrimary, fontSize: scaleFont(14) }]}>
            {isScanning ? 'Analyzing...' : 'Capture & Analyze'}
          </Text>
        </TouchableOpacity>

        {/* Col-span-1: Live Mode Toggle Button */}
        <TouchableOpacity
          style={[
            styles.auxControlBtn,
            {
              backgroundColor: isLive ? colors.primaryFixed : colors.surfaceContainerHigh,
              borderColor: colors.border,
            },
          ]}
          onPress={toggleLive}
          accessibilityLabel={isLive ? 'Disable Live continuous scan' : 'Enable Live continuous scan'}
          accessibilityRole="button"
        >
          <Video size={18} color={isLive ? colors.onPrimaryFixed : colors.primary} />
          <Text
            style={[
              styles.auxBtnText,
              { color: isLive ? colors.onPrimaryFixed : colors.text, fontSize: scaleFont(11) },
            ]}
          >
            {isLive ? 'Live On' : 'Live'}
          </Text>
        </TouchableOpacity>

        {/* Col-span-1: Upload Existing Image Button */}
        <TouchableOpacity
          style={[
            styles.auxControlBtn,
            { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.border },
          ]}
          onPress={handleUploadImage}
          disabled={isScanning}
          accessibilityLabel="Upload photo from gallery"
          accessibilityRole="button"
        >
          <Upload size={18} color={colors.secondary} />
          <Text style={[styles.auxBtnText, { color: colors.text, fontSize: scaleFont(11) }]}>
            Upload
          </Text>
        </TouchableOpacity>
      </View>

      {/* Error Alert Banner */}
      {scanError && (
        <View style={[styles.errorBanner, { backgroundColor: colors.sosContainer, borderColor: colors.sos }]}>
          <AlertTriangle size={16} color={colors.sos} />
          <Text style={[styles.errorText, { color: colors.sos, fontSize: scaleFont(12) }]}>
            {scanError}
          </Text>
          <TouchableOpacity onPress={clearError} style={styles.errorDismissBtn}>
            <Text style={[styles.errorDismissText, { color: colors.sos }]}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 5. Detection Result Card */}
      {activeResult ? (
        <View style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.resultHeader}>
            <View style={styles.resultHeaderLeft}>
              <View style={[styles.resultIconBox, { backgroundColor: colors.primaryFixed }]}>
                {currentMode === 'ocr' ? (
                  <ScanLine size={18} color={colors.primary} />
                ) : currentMode === 'objects' ? (
                  <Sparkles size={18} color={colors.primary} />
                ) : (
                  <Eye size={18} color={colors.primary} />
                )}
              </View>
              <View style={styles.resultTitleWrap}>
                <Text style={[styles.resultModelTag, { color: colors.primary, fontSize: scaleFont(10) }]}>
                  {activeResult.category.toUpperCase()}
                </Text>
                <Text style={[styles.resultTitle, { color: colors.text, fontSize: scaleFont(15) }]}>
                  {activeResult.title}
                </Text>
              </View>
            </View>

            <View style={styles.badgesRight}>
              {activeResult.processingMs ? (
                <View style={[styles.metricBadge, { backgroundColor: colors.surfaceContainerLow }]}>
                  <Text style={[styles.metricText, { color: colors.textMuted, fontSize: scaleFont(10) }]}>
                    {activeResult.processingMs} ms
                  </Text>
                </View>
              ) : null}
              <View style={[styles.verifiedBadge, { backgroundColor: colors.primaryFixed }]}>
                <Text style={[styles.verifiedText, { color: colors.onPrimaryFixed, fontSize: scaleFont(11) }]}>
                  {activeResult.confidence > 0 ? `${activeResult.confidence}%` : 'Verified'}
                </Text>
              </View>
            </View>
          </View>

          {/* Speech Synthesis Audio Bar (Read Aloud, Pause, Replay) */}
          <View style={[styles.audioPlaybackBar, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
            <View style={styles.audioPlaybackTop}>
              <View style={styles.audioTitleRow}>
                <Volume2 size={16} color={colors.primary} />
                <Text style={[styles.audioPlaybackTitle, { color: colors.text, fontSize: scaleFont(12) }]}>
                  {isSpeaking ? (isPaused ? 'Speech Paused' : 'Reading Aloud...') : 'Text-to-Speech'}
                </Text>
              </View>
              <Text style={[styles.audioDuration, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
                {speechRate}x Rate
              </Text>
            </View>

            <View style={styles.audioActionRow}>
              {/* Primary Read / Stop Button */}
              <TouchableOpacity
                style={[
                  styles.readAloudMainBtn,
                  { backgroundColor: isSpeaking && !isPaused ? colors.sos : colors.primary },
                ]}
                onPress={() => readAloud()}
                accessibilityLabel={isSpeaking && !isPaused ? 'Stop speaking readout' : 'Read Aloud with Text-to-Speech'}
                accessibilityHint="Uses device speech synthesizer to vocalize recognized text"
                accessibilityRole="button"
              >
                {isSpeaking && !isPaused ? (
                  <>
                    <VolumeX size={18} color="#FFFFFF" />
                    <Text style={[styles.readAloudBtnText, { color: '#FFFFFF', fontSize: scaleFont(14) }]}>
                      Stop
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

              {/* Pause / Resume Button */}
              {isSpeaking && (
                <TouchableOpacity
                  style={[styles.playbackControlBtn, { backgroundColor: colors.surfaceContainerHigh }]}
                  onPress={isPaused ? resumeSpeaking : pauseSpeaking}
                  accessibilityLabel={isPaused ? 'Resume speaking' : 'Pause speaking'}
                  accessibilityRole="button"
                >
                  {isPaused ? <Play size={16} color={colors.text} /> : <Pause size={16} color={colors.text} />}
                </TouchableOpacity>
              )}

              {/* Replay Button */}
              <TouchableOpacity
                style={[styles.playbackControlBtn, { backgroundColor: colors.surfaceContainerHigh }]}
                onPress={replaySpeaking}
                accessibilityLabel="Replay speech from start"
                accessibilityRole="button"
              >
                <RotateCcw size={16} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Transcription / Analysis Result Box */}
          <View style={[styles.transcriptionBox, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
            <View style={styles.transcriptionTopRow}>
              <Text style={[styles.transcriptionLabel, { color: colors.textSecondary, fontSize: scaleFont(11) }]}>
                {currentMode === 'ocr' ? 'EXTRACTED TEXT' : currentMode === 'objects' ? 'OBJECTS RECOGNIZED' : 'SCENE DESCRIPTION'}
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
                  Safety Notice
                </Text>
                <Text style={[styles.warningBody, { color: colors.text, fontSize: scaleFont(12) }]}>
                  {activeResult.warningText}
                </Text>
              </View>
            </View>
          )}

          {/* Surrounding Context & Model Limitations */}
          <View style={[styles.surroundBox, { backgroundColor: colors.surfaceContainerLow }]}>
            <Compass size={14} color={colors.primary} />
            <Text style={[styles.surroundText, { color: colors.textSecondary, fontSize: scaleFont(11) }]}>
              Spatial Distance: {activeResult.distance} • Illumination: {activeResult.lux} Lux
              {activeResult.limitations ? ` • ${activeResult.limitations}` : ''}
            </Text>
          </View>
        </View>
      ) : (
        /* Empty / Prompt State when no scan has been performed */
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ScanLine size={32} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.text, fontSize: scaleFont(15) }]}>
            Ready to Scan
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary, fontSize: scaleFont(12) }]}>
            Point your camera at a prescription label, document, or room and tap "Capture & Analyze", or tap "Upload" to analyze an existing photo.
          </Text>
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
    flexWrap: 'wrap',
  },
  speedLabel: {
    fontWeight: '600',
  },
  speedButtonGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  speedBtn: {
    paddingHorizontal: 8,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  speedBtnText: {
    fontSize: 11,
  },
  contrastBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  contrastBtnText: {
    fontWeight: '600',
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
  hudActionGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  hudCircleBtn: {
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
    padding: 20,
    gap: 12,
  },
  permissionText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  permissionBtn: {
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionBtnText: {
    fontWeight: '600',
    fontSize: 13,
  },
  primaryControlsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  captureMainBtn: {
    flex: 2,
    minHeight: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  captureBtnText: {
    fontWeight: '700',
  },
  auxControlBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
  auxBtnText: {
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontWeight: '500',
  },
  errorDismissBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  errorDismissText: {
    fontWeight: '700',
    fontSize: 11,
  },
  resultCard: {
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: StyleSheet.hairlineWidth,
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
    flex: 1,
  },
  resultTitleWrap: {
    flex: 1,
  },
  resultIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultModelTag: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  resultTitle: {
    fontWeight: '700',
  },
  badgesRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  metricBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metricText: {
    fontWeight: '500',
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
    padding: 12,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
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
    minHeight: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  readAloudBtnText: {
    fontWeight: '700',
  },
  playbackControlBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transcriptionBox: {
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
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
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  copyText: {
    fontWeight: '600',
  },
  transcriptionBody: {
    fontWeight: '500',
    lineHeight: 22,
  },
  safetyWarningBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
    alignItems: 'flex-start',
  },
  warningIcon: {
    marginTop: 2,
  },
  warningContent: {
    flex: 1,
    gap: 2,
  },
  warningTitle: {
    fontWeight: '700',
  },
  warningBody: {
    lineHeight: 18,
  },
  surroundBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  surroundText: {
    flex: 1,
    lineHeight: 16,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontWeight: '700',
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
});
