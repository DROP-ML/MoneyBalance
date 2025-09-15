/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Brand: Sona Solutions — Black and Dark Blue theme
const tintColorLight = '#1E3A8A'; // Dark blue accent for light mode
const tintColorDark = '#3B82F6'; // Brighter blue accent for dark mode

export const Colors = {
  light: {
    text: '#0B1220',
    background: '#F7F8FB',
    tint: tintColorLight,
    icon: '#6b7280',
    tabIconDefault: '#9ca3af',
    tabIconSelected: tintColorLight,
    card: '#ECEFF7',
    border: '#E2E8F0',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    surface: '#FFFFFF',
    surfaceSecondary: '#EEF2FF',
  },
  dark: {
    text: '#E6ECFF',
    background: '#0B0F19', // near-black
    tint: tintColorDark,
    icon: '#9ca3af',
    tabIconDefault: '#6b7280',
    tabIconSelected: tintColorDark,
    card: '#111827',
    border: '#2A3242',
    success: '#34d399',
    error: '#f87171',
    warning: '#fbbf24',
    surface: '#111827',
    surfaceSecondary: '#1F2937',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
