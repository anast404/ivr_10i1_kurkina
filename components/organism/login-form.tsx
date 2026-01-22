import { useFirebaseAuth } from '@/hooks/use-firebase-auth';
import React, { useState } from 'react';
import { Button, StyleSheet, View } from 'react-native';
import { StyledTextInput } from '../atom/styled-text-input';

export function LoginForm() {
  const [email, setEmail] = useState("bacrilio@gmail.com");
  const [password, setPassword] = useState("my11111");

  const {
    register,
    signIn,
  } = useFirebaseAuth();

  return (
    <View style={styles.container}>
      <StyledTextInput
        style={styles.textInput}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <StyledTextInput
        style={styles.textInput}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <View style={styles.buttonWrapper}>
        <Button title="Зарегистрироватся" onPress={() => register(email, password)} />
      </View>
      <View style={styles.buttonWrapper}>
        <Button
          title="Войти"
          onPress={() => signIn(email, password)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonWrapper: {
    marginBottom: 24,
    width: 300,
  },
  textInput: {
    borderRadius: 15,
    borderWidth: 1,
    width: 300,
    marginBottom: 24,
  },
});
