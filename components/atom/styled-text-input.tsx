import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

export function StyledTextInput({ style, ...otherProps }: TextInputProps) {
  return <TextInput style={[styles.default, style]} {...otherProps} />;
}

const styles = StyleSheet.create({
  default: {
    borderRadius: 15,
    borderWidth: 1,
  },
});
