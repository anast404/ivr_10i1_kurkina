import { StyleSheet, Text, type TextProps } from 'react-native';

export function Label({ style, children, ...otherProps }: TextProps) {
  return <Text style={[styles.default, style]} {...otherProps}>{`${children}:`}</Text>;
}

const styles = StyleSheet.create({
  default: {
    fontSize: 14,
  },
});