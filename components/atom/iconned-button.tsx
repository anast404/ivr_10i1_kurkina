import { TIconSymbolName } from '@/types';
import { OpaqueColorValue, Pressable, StyleSheet, View, type PressableProps } from 'react-native';
import { IconSymbol } from './icon-symbol';

type TIconedButton = PressableProps & {
  iconName: TIconSymbolName,
  color?: string | OpaqueColorValue;
}

export function IconedButton({ iconName, color = 'blue', ...otherProps  }: TIconedButton) {
  return (
    <Pressable {...otherProps}>
      <View style={styles.wrapper}>
        <IconSymbol size={24} name={iconName} color={color} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 30,
    height: 30,
  },
});
