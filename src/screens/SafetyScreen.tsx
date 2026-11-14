import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Animated,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import {
  ShieldAlert,
  ShieldCheck,
  MapPin,
  Share2,
  Navigation,
  HeartPulse,
  UserX,
  Compass,
  MessageSquareOff,
  User,
  Phone,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { useSafetyStore } from '../store/safetyStore';

export const SafetyScreen: React.FC = () => {
  const { colors, scaleFont } = useAppTheme();

  const isArmed = useSafetyStore((s) => s.isArmed);
  const sosTriggered = useSafetyStore((s) => s.sosTriggered);
  const isHolding = useSafetyStore((s) => s.isHolding);
  const holdProgress = useSafetyStore((s) => s.holdProgress);
  const activeDistressType = useSafetyStore((s) => s.activeDistressType);
  const location = useSafetyStore((s) => s.location);
  const contacts = useSafetyStore((s) => s.contacts);
  const dispatchProfile = useSafetyStore((s) => s.dispatchProfile);

  const fetchCurrentLocation = useSafetyStore((s) => s.fetchCurrentLocation);
  const startHold = useSafetyStore((s) => s.startHold);
  const updateHoldProgress = useSafetyStore((s) => s.updateHoldProgress);
  const triggerSos = useSafetyStore((s) => s.triggerSos);
  const cancelSos = useSafetyStore((s) => s.cancelSos);
  const cancelHold = useSafetyStore((s) => s.cancelHold);
  const triggerDistressCategory = useSafetyStore((s) => s.triggerDistressCategory);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const HOLD_DURATION_MS = 3000;

  // Screen flash animation when SOS is triggered
  const flashAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  useEffect(() => {
    if (sosTriggered) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(flashAnim, {
            toValue: 0.35,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(flashAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      flashAnim.setValue(1);
    }
  }, [sosTriggered]);

  const handlePressIn = () => {
    if (sosTriggered) return;
    startHold();
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(1, elapsed / HOLD_DURATION_MS);
      updateHoldProgress(progress);

      if (progress >= 1) {
        if (timerRef.current) clearInterval(timerRef.current);
        triggerSos('Manual Long-Press SOS');
      }
    }, 50);
  };

  const handlePressOut = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (!sosTriggered) {
      cancelHold();
    }
  };

  // SVG circle calculations (radius 48, circumference ~301.6)
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - holdProgress * circumference;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Emergency SOS Critical Action Zone */}
      <Animated.View
        style={[
          styles.sosCard,
          {
            backgroundColor: sosTriggered ? colors.sos : colors.sos,
            opacity: sosTriggered ? flashAnim : 1,
          },
        ]}
      >
        <View style={styles.sosCardHeader}>
          <View style={styles.priorityBadge}>
            <View style={[styles.priorityDot, { backgroundColor: '#FFFFFF' }]} />
            <Text style={styles.priorityText}>
              {sosTriggered ? 'SOS DISPATCHED (LIVE)' : 'PRIORITY 1 ARMED'}
            </Text>
          </View>
          <View style={styles.cadLinkHeader}>
            <ShieldCheck size={16} color="#FFFFFF" />
            <Text style={styles.cadLinkText}>911 CAD Direct</Text>
          </View>
        </View>

        {/* Hold to Trigger Interactive Button with SVG Progress Ring */}
        <View style={styles.triggerCenter}>
          <View style={styles.circleContainer}>
            <Svg width={128} height={128} viewBox="0 0 120 120">
              <Circle
                cx="60"
                cy="60"
                r={radius}
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="7"
                fill="none"
              />
              <Circle
                cx="60"
                cy="60"
                r={radius}
                stroke="#FFFFFF"
                strokeWidth="7"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                transform="rotate(-90 60 60)"
              />
            </Svg>

            <Pressable
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              style={({ pressed }) => [
                styles.bigSosButton,
                { backgroundColor: '#FFFFFF' },
                pressed && { transform: [{ scale: 0.94 }] },
              ]}
              accessibilityLabel="Press and hold 3 seconds to trigger emergency SOS"
              accessibilityHint="Dispatches live GPS coordinates and clinical profile to emergency services"
              accessibilityRole="button"
            >
              <ShieldAlert size={34} color={colors.sos} />
              <Text style={[styles.bigSosText, { color: colors.sos }]}>
                {sosTriggered ? 'ACTIVE' : 'SOS'}
              </Text>
            </Pressable>
          </View>

          <Text style={[styles.instructionText, { fontSize: scaleFont(14) }]}>
            {sosTriggered
              ? `SOS TRANSMITTED: ${activeDistressType || 'EMERGENCY'}`
              : isHolding
              ? `HOLDING... ${Math.round((1 - holdProgress) * 3)}s REMAINING`
              : 'HOLD 3 SECONDS TO TRIGGER'}
          </Text>
          <Text style={[styles.subInstructionText, { fontSize: scaleFont(11) }]}>
            {sosTriggered
              ? 'Units dispatched • GPS payload locked'
              : 'Continuous hold prevents accidental false alarms'}
          </Text>

          {sosTriggered && (
            <TouchableOpacity
              style={styles.cancelSosBtn}
              onPress={cancelSos}
              accessibilityLabel="Cancel Emergency SOS"
              accessibilityRole="button"
            >
              <RotateCcw size={15} color="#FFFFFF" />
              <Text style={styles.cancelSosText}>Cancel SOS Broadcast</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Telemetry Strip */}
        <View style={styles.telemetryStrip}>
          <Text style={styles.telemetryItemText}>📡 GPS ±1.4m</Text>
          <Text style={styles.telemetryItemText}>📟 TRS 711 Armed</Text>
          <Text style={styles.telemetryItemText}>🏷️ NFC ID Ready</Text>
        </View>
      </Animated.View>

      {/* 2. Immediate Categorical Distress Quick Pills */}
      <View style={styles.distressSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeading, { color: colors.textSecondary, fontSize: scaleFont(11) }]}>
            IMMEDIATE CATEGORICAL DISTRESS
          </Text>
          <Text style={[styles.broadcastTag, { color: colors.primary, fontSize: scaleFont(11) }]}>
            One-Tap Dispatch
          </Text>
        </View>

        <View style={styles.distressGrid}>
          {/* Medical */}
          <TouchableOpacity
            style={[styles.distressPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => triggerDistressCategory('Medical Distress')}
            accessibilityLabel="Trigger Medical Distress SOS"
            accessibilityRole="button"
          >
            <View style={[styles.distressIconBox, { backgroundColor: colors.sosContainer }]}>
              <HeartPulse size={18} color={colors.sos} />
            </View>
            <View style={styles.distressTextBox}>
              <Text style={[styles.distressTitle, { color: colors.text, fontSize: scaleFont(13) }]}>
                Medical
              </Text>
              <Text style={[styles.distressDesc, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
                Vital Collapse / Pain
              </Text>
            </View>
          </TouchableOpacity>

          {/* Fall */}
          <TouchableOpacity
            style={[styles.distressPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => triggerDistressCategory('Fall Impact')}
            accessibilityLabel="Trigger Fall Distress SOS"
            accessibilityRole="button"
          >
            <View style={[styles.distressIconBox, { backgroundColor: colors.secondaryContainer }]}>
              <UserX size={18} color={colors.secondary} />
            </View>
            <View style={styles.distressTextBox}>
              <Text style={[styles.distressTitle, { color: colors.text, fontSize: scaleFont(13) }]}>
                Fall / Impact
              </Text>
              <Text style={[styles.distressDesc, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
                Cannot Stand
              </Text>
            </View>
          </TouchableOpacity>

          {/* Lost / Disoriented */}
          <TouchableOpacity
            style={[styles.distressPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => triggerDistressCategory('Spatial Disorientation')}
            accessibilityLabel="Trigger Disoriented Distress SOS"
            accessibilityRole="button"
          >
            <View style={[styles.distressIconBox, { backgroundColor: colors.surfaceContainer }]}>
              <Compass size={18} color={colors.primary} />
            </View>
            <View style={styles.distressTextBox}>
              <Text style={[styles.distressTitle, { color: colors.text, fontSize: scaleFont(13) }]}>
                Disoriented
              </Text>
              <Text style={[styles.distressDesc, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
                Route Assist Lost
              </Text>
            </View>
          </TouchableOpacity>

          {/* Silent Covert */}
          <TouchableOpacity
            style={[styles.distressPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => triggerDistressCategory('Silent Covert Alert')}
            accessibilityLabel="Trigger Silent Covert SOS"
            accessibilityRole="button"
          >
            <View style={[styles.distressIconBox, { backgroundColor: colors.surfaceContainerHigh }]}>
              <MessageSquareOff size={18} color={colors.text} />
            </View>
            <View style={styles.distressTextBox}>
              <Text style={[styles.distressTitle, { color: colors.text, fontSize: scaleFont(13) }]}>
                Silent Covert
              </Text>
              <Text style={[styles.distressDesc, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
                Muted SMS Ping
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Live Precision GPS Location Card */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.headerIconBox, { backgroundColor: colors.primaryFixed }]}>
              <MapPin size={18} color={colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text, fontSize: scaleFont(15) }]}>
              Live Precision Location
            </Text>
          </View>
          <View style={[styles.lockBadge, { backgroundColor: colors.primaryFixed }]}>
            <Text style={[styles.lockText, { color: colors.onPrimaryFixed, fontSize: scaleFont(11) }]}>
              94% Lock
            </Text>
          </View>
        </View>

        {/* Map Visual Simulation Box */}
        <View style={[styles.mapPlaceholder, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
          <View style={styles.geofenceBadge}>
            <View style={[styles.geofenceDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.geofenceText, { color: colors.text, fontSize: scaleFont(10) }]}>
              Safe Geofence Radius: 500m
            </Text>
          </View>
          <View style={styles.locationDetails}>
            <Text style={[styles.facilityText, { color: colors.text, fontSize: scaleFont(13) }]}>
              {location?.facilityName || 'St. Jude Health Center · Room 304'}
            </Text>
            <Text style={[styles.coordsText, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
              {location?.latitude.toFixed(4)}° N, {location?.longitude.toFixed(4)}° W (Accuracy: ±{location?.accuracyMeters}m)
            </Text>
          </View>
        </View>

        <View style={styles.mapActionsRow}>
          <TouchableOpacity
            style={[styles.mapBtn, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}
            onPress={fetchCurrentLocation}
            accessibilityLabel="Refresh live GPS link"
            accessibilityRole="button"
          >
            <Navigation size={15} color={colors.primary} />
            <Text style={[styles.mapBtnText, { color: colors.text, fontSize: scaleFont(12) }]}>
              Recalibrate GPS
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mapBtn, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}
            accessibilityLabel="Share location link"
            accessibilityRole="button"
          >
            <Share2 size={15} color={colors.primary} />
            <Text style={[styles.mapBtnText, { color: colors.text, fontSize: scaleFont(12) }]}>
              Share Live Pin
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. Emergency Medical Dispatch Profile */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.headerIconBox, { backgroundColor: colors.primary }]}>
              <User size={18} color={colors.onPrimary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text, fontSize: scaleFont(15) }]}>
              Medical Dispatch Profile
            </Text>
          </View>
          <View style={[styles.lockBadge, { backgroundColor: colors.secondaryContainer }]}>
            <Text style={[styles.lockText, { color: colors.onSecondaryContainer, fontSize: scaleFont(10) }]}>
              Auto-Broadcast
            </Text>
          </View>
        </View>

        <View style={[styles.patientDetailsBox, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
          <Text style={[styles.patientName, { color: colors.text, fontSize: scaleFont(15) }]}>
            {dispatchProfile.name}, {dispatchProfile.age} yrs
          </Text>
          <Text style={[styles.bloodType, { color: colors.primary, fontSize: scaleFont(12) }]}>
            Blood Type: {dispatchProfile.bloodType}
          </Text>
        </View>

        <View style={styles.conditionTagsWrap}>
          {dispatchProfile.allergies.map((allergy, i) => (
            <View key={i} style={[styles.allergyTag, { backgroundColor: colors.sosContainer }]}>
              <AlertTriangle size={11} color={colors.sos} />
              <Text style={[styles.allergyText, { color: colors.sos, fontSize: scaleFont(10) }]}>
                {allergy}
              </Text>
            </View>
          ))}
          {dispatchProfile.conditions.map((cond, i) => (
            <View key={i} style={[styles.conditionTag, { backgroundColor: colors.surfaceContainer }]}>
              <CheckCircle2 size={11} color={colors.primary} />
              <Text style={[styles.conditionText, { color: colors.text, fontSize: scaleFont(10) }]}>
                {cond}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* 5. Trusted Emergency Circle List */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 24 }]}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderLeft}>
            <Phone size={18} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text, fontSize: scaleFont(15) }]}>
              Trusted Emergency Circle
            </Text>
          </View>
          <Text style={[styles.circleCount, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
            3 Contacts Linked
          </Text>
        </View>

        <View style={styles.contactsList}>
          {contacts.map((contact) => (
            <View
              key={contact.id}
              style={[
                styles.contactRow,
                { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border },
              ]}
            >
              <View style={styles.contactLeft}>
                <View style={[styles.contactAvatar, { backgroundColor: colors.primaryContainer }]}>
                  <Text style={styles.contactAvatarText}>
                    {contact.name.split(' ').map((n) => n[0]).join('')}
                  </Text>
                </View>
                <View>
                  <Text style={[styles.contactName, { color: colors.text, fontSize: scaleFont(13) }]}>
                    {contact.name}
                  </Text>
                  <Text style={[styles.contactRelation, { color: colors.textMuted, fontSize: scaleFont(11) }]}>
                    {contact.relation} • {contact.phone}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.contactStatusBadge,
                  {
                    backgroundColor:
                      contact.status === 'alerted' ? colors.sosContainer : colors.primaryFixed,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.contactStatusText,
                    {
                      color:
                        contact.status === 'alerted' ? colors.sos : colors.onPrimaryFixed,
                      fontSize: scaleFont(10),
                    },
                  ]}
                >
                  {contact.status.toUpperCase()}
                </Text>
              </View>
            </View>
          ))}
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
  sosCard: {
    borderRadius: 18,
    padding: 16,
    gap: 14,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sosCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.6,
  },
  cadLinkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cadLinkText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 11,
  },
  triggerCenter: {
    alignItems: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  circleContainer: {
    width: 128,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigSosButton: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  bigSosText: {
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 1,
    marginTop: 2,
  },
  instructionText: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: 6,
    textAlign: 'center',
  },
  subInstructionText: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    textAlign: 'center',
  },
  cancelSosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  cancelSosText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  telemetryStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  telemetryItemText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  distressSection: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  sectionHeading: {
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  broadcastTag: {
    fontWeight: '600',
  },
  distressGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  distressPill: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 56,
  },
  distressIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  distressTextBox: {
    flex: 1,
  },
  distressTitle: {
    fontWeight: '700',
  },
  distressDesc: {
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
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontWeight: '700',
  },
  lockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  lockText: {
    fontWeight: '700',
  },
  mapPlaceholder: {
    height: 110,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    justifyContent: 'space-between',
  },
  geofenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  geofenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  geofenceText: {
    fontWeight: '600',
  },
  locationDetails: {
    gap: 2,
  },
  facilityText: {
    fontWeight: '700',
  },
  coordsText: {
    fontWeight: '500',
  },
  mapActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  mapBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  mapBtnText: {
    fontWeight: '600',
  },
  patientDetailsBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  patientName: {
    fontWeight: '700',
  },
  bloodType: {
    fontWeight: '700',
  },
  conditionTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  allergyText: {
    fontWeight: '700',
  },
  conditionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  conditionText: {
    fontWeight: '600',
  },
  circleCount: {
    fontWeight: '600',
  },
  contactsList: {
    gap: 8,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contactAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactAvatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  contactName: {
    fontWeight: '700',
  },
  contactRelation: {
    marginTop: 1,
  },
  contactStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  contactStatusText: {
    fontWeight: '700',
  },
});
