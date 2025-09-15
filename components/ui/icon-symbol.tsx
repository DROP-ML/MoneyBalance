// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';
import type { ComponentProps } from 'react';

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>['name']>;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Core tabs
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'chart.bar.fill': 'insert-chart',
  'chart.pie.fill': 'pie-chart',
  gear: 'settings',
  'note.text': 'note',

  // Common actions
  plus: 'add',
  'plus.circle': 'add-circle-outline',
  'plus.circle.fill': 'add-circle',
  'minus.circle.fill': 'remove-circle',
  pencil: 'edit',
  trash: 'delete',
  'trash.fill': 'delete',
  magnifyingglass: 'search',
  'xmark': 'close',
  'xmark.circle.fill': 'cancel',
  'square.and.arrow.up': 'share',
  'checkmark.circle.fill': 'check-circle',
  hourglass: 'hourglass-empty',

  // Lists
  'list.bullet': 'format-list-bulleted',

  // Arrows
  'arrow.up': 'arrow-upward',
  'arrow.down': 'arrow-downward',
  'arrow.up.circle': 'arrow-upward',
  'arrow.down.circle': 'arrow-downward',
  'arrow.up.circle.fill': 'arrow-upward',
  'arrow.down.circle.fill': 'arrow-downward',

  // Shapes
  'circle': 'radio-button-unchecked',
  'circle.fill': 'circle',

  // Settings screen icons
  'dollarsign.circle': 'attach-money',
  calendar: 'calendar-today',
  paintbrush: 'brush',
  bell: 'notifications',
  'exclamationmark.triangle': 'warning',
  'chart.bar': 'insert-chart-outlined',

  // Default Category icons
  briefcase: 'work',
  laptop: 'laptop',
  'trending-up': 'trending-up',
  gift: 'card-giftcard',
  'plus-circle': 'add-circle-outline',
  utensils: 'restaurant',
  car: 'directions-car',
  'shopping-bag': 'shopping-bag',
  film: 'movie',
  'file-text': 'description',
  heart: 'favorite',
  book: 'book',
  'map-pin': 'place',
  'more-horizontal': 'more-horiz',
  home: 'home',
  phone: 'phone',
  wifi: 'wifi',
  zap: 'flash-on',
  droplet: 'opacity',
  shield: 'shield',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: string;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
}) {
  const mapped = MAPPING[name] ?? 'help-outline';
  return <MaterialIcons color={color} size={size} name={mapped} style={style} />;
}
