import { ScrollView, StyleSheet, type ScrollViewProps } from 'react-native';

export function ScrollViewWrapper({ style, ...otherProps }: ScrollViewProps) {
  return <ScrollView style={[styles.default, style]} {...otherProps} />;
}

const styles = StyleSheet.create({
  default: {
    padding: 16,
  },
});