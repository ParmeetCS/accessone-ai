import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stethoscope, DoorOpen, Activity, User, Radio } from 'lucide-react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { SoundRadarEvent } from '../store/hearingStore';

interface SoundRadarProps {
  events: SoundRadarEvent[];
  activeAlert: string | null;
  onSelectEvent?: (ev: SoundRadarEvent) => void;
}

export const SoundRadar: React.FC<SoundRadarProps> = ({ events, activeAlert, onSelectEvent }) => {
  const { colors, scaleFont } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel="360 degree spatial acoustic radar showing direction and decibel of detected sounds"
    >
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Radio size={14} color={colors.primary} />
          <Text style={[styles.title, { color: colors.textSecondary, fontSize: scaleFont(11) }]}>
            ACOUSTIC RADAR 360°
          </Text>
        </View>
        <Text style={[styles.statusTag, { color: colors.primary, fontSize: scaleFont(10) }]}>
          ARRAY ACTIVE
        </Text>
      </View>

      {/* Radar Disc View */}
      <View style={styles.discContainer}>
        {/* Concentric circles */}
        <View style={[styles.ringOuter, { borderColor: colors.border }]} />
        <View style={[styles.ringMiddle, { borderColor: colors.border }]} />
        <View style={[styles.ringInner, { backgroundColor: colors.surfaceContainerLow }]} />

        {/* Compass Cardinal Points */}
        <Text style={[styles.cardinalText, styles.cardinalN, { color: colors.textMuted }]}>N</Text>
        <Text style={[styles.cardinalText, styles.cardinalS, { color: colors.textMuted }]}>S</Text>
        <Text style={[styles.cardinalText, styles.cardinalW, { color: colors.textMuted }]}>W</Text>
        <Text style={[styles.cardinalText, styles.cardinalE, { color: colors.textMuted }]}>E</Text>

        {/* Center User Pin */}
        <View style={[styles.centerUserPin, { backgroundColor: colors.primary }]}>
          <User size={12} color={colors.onPrimary} />
        </View>

        {/* Blip 1: Dr Evans (Front Right: 45°) */}
        <TouchableOpacity
          style={[styles.blipItem, styles.blipDoctor]}
          onPress={() => events[0] && onSelectEvent?.(events[0])}
          accessibilityLabel="Sound source: Doctor Evans, Front Right, 62 decibels"
          accessibilityRole="button"
          activeOpacity={0.8}
        >
          <View style={[styles.blipIconCircle, { backgroundColor: colors.primary }]}>
            <Stethoscope size={11} color={colors.onPrimary} />
          </View>
          <Text style={[styles.blipLabel, { backgroundColor: colors.surface, color: colors.primary }]}>
            Doc
          </Text>
        </TouchableOpacity>

        {/* Blip 2: Door Knock (Left: 280°) */}
        <TouchableOpacity
          style={[styles.blipItem, styles.blipDoor]}
          onPress={() => events[1] && onSelectEvent?.(events[1])}
          accessibilityLabel="Sound event: Door Knock, Left Peripheral corridor, 58 decibels"
          accessibilityRole="button"
          activeOpacity={0.8}
        >
          <View style={[styles.blipIconCircle, { backgroundColor: colors.sos }]}>
            <DoorOpen size={11} color={colors.onSos} />
          </View>
          <Text style={[styles.blipLabel, { backgroundColor: colors.surface, color: colors.sos }]}>
            Door
          </Text>
        </TouchableOpacity>

        {/* Blip 3: IV Chime (Right: 110°) */}
        <TouchableOpacity
          style={[styles.blipItem, styles.blipIv]}
          onPress={() => events[2] && onSelectEvent?.(events[2])}
          accessibilityLabel="Sound event: IV Chime, Right side, 46 decibels"
          accessibilityRole="button"
          activeOpacity={0.8}
        >
          <View style={[styles.blipIconCircle, { backgroundColor: colors.secondary }]}>
            <Activity size={10} color={colors.surface} />
          </View>
          <Text style={[styles.blipLabel, { backgroundColor: colors.surface, color: colors.secondary }]}>
            IV
          </Text>
        </TouchableOpacity>
      </View>

      {/* Footer Decibel status */}
      <View style={styles.footerRow}>
        <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
        <Text style={[styles.footerText, { color: colors.textSecondary, fontSize: scaleFont(11) }]}>
          3 Sound Vectors Tracked
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  statusTag: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  discContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  ringOuter: {
    position: 'absolute',
    width: 136,
    height: 136,
    borderRadius: 68,
    borderWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.7,
  },
  ringMiddle: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    opacity: 0.5,
  },
  ringInner: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  cardinalText: {
    position: 'absolute',
    fontSize: 9,
    fontWeight: '700',
  },
  cardinalN: { top: 2 },
  cardinalS: { bottom: 2 },
  cardinalW: { left: 4 },
  cardinalE: { right: 4 },
  centerUserPin: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  blipItem: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  blipDoctor: {
    top: 18,
    right: 22,
  },
  blipDoor: {
    top: 52,
    left: 12,
  },
  blipIv: {
    bottom: 24,
    right: 18,
  },
  blipIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
  blipLabel: {
    fontSize: 8,
    fontWeight: '700',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
    overflow: 'hidden',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  footerText: {
    fontWeight: '500',
  },
});
