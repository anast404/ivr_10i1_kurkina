import { StyleSheet, Text, type TextProps } from 'react-native';

export function StyledText({ style, ...otherProps }: TextProps) {
  return <Text style={[styles.default, style]} {...otherProps} />;
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
  },
});