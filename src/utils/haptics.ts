import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

export function hapticLight() {
  if (isNative) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function hapticMedium() {
  if (isNative) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export function hapticHeavy() {
  if (isNative) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
}

export function hapticSuccess() {
  if (isNative) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function hapticError() {
  if (isNative) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}
