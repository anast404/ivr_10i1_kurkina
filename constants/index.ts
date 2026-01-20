import { TIconMapping } from "@/types";
import { SymbolViewProps } from "expo-symbols";

export const ICONS: Record<string, SymbolViewProps['name']> = {
  // таблетки
  'pills': 'cross.case.fill',
  // растения
  'plants': 'camera.macro.circle.fill',
  // профиль
  'profile': 'person.crop.circle.fill',
  // редактировать
  'edit': 'pencil',
  // отправить
  'send': 'paperplane.fill',
  // закрыть
  'close': 'xmark'
}

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
export const ICON_MAPPING = {
  [ICONS.pills]: 'local-pharmacy',
  [ICONS.plants]: 'local-florist',
  [ICONS.profile]: 'manage-accounts',
  [ICONS.edit]: 'edit',
  [ICONS.send]: 'send',
  [ICONS.close]: 'close',
  // 'chevron.left.forwardslash.chevron.right': 'code',
  // 'chevron.right': 'chevron-right',
} as TIconMapping;