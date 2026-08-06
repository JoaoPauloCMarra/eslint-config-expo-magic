import { AccessibilityInfo, StyleSheet } from 'react-native';

export const fill = StyleSheet.absoluteFillObject;

export function focusAccessibility() {
	AccessibilityInfo.setAccessibilityFocus();
}

export type LegacyRef = MutableRefObject<HTMLDivElement | null>;
