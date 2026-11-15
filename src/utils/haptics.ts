/**
 * safeHaptics — drop-in replacement for `expo-haptics`
 *
 * expo-haptics throws "not available on android" in Expo Go or on devices
 * where the native module isn't linked. This wrapper catches every error
 * silently so the app never crashes from a haptic call.
 *
 * Usage — replace:
 *   import * as Haptics from 'expo-haptics';
 * with:
 *   import * as Haptics from '../utils/haptics';   // adjust relative path
 *
 * The ImpactFeedbackStyle and NotificationFeedbackType enums are re-exported
 * so existing call-sites require zero further changes.
 */

import {
  ImpactFeedbackStyle,
  NotificationFeedbackType,
} from 'expo-haptics';
import * as _Haptics from 'expo-haptics';

export { ImpactFeedbackStyle, NotificationFeedbackType };

/** Trigger an impact (physical tap) haptic — silently no-ops if unavailable */
export async function impactAsync(
  style: ImpactFeedbackStyle = ImpactFeedbackStyle.Medium
): Promise<void> {
  try {
    await _Haptics.impactAsync(style);
  } catch (_) {
    // Haptics not available on this device/environment — ignore
  }
}

/** Trigger a notification haptic — silently no-ops if unavailable */
export async function notificationAsync(
  type: NotificationFeedbackType = NotificationFeedbackType.Success
): Promise<void> {
  try {
    await _Haptics.notificationAsync(type);
  } catch (_) {
    // Haptics not available on this device/environment — ignore
  }
}

/** Trigger a selection haptic — silently no-ops if unavailable */
export async function selectionAsync(): Promise<void> {
  try {
    await _Haptics.selectionAsync();
  } catch (_) {
    // Haptics not available on this device/environment — ignore
  }
}
