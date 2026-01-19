import { useFirebaseAuth } from '@/hooks/use-firebase-auth';
import React, { useState } from 'react';
import { Button, StyleSheet, TextInput, View } from 'react-native';

export function LoginForm() {
  const [email, setEmail] = useState("bacrilio@gmail.com");
  const [password, setPassword] = useState("my11111");

  const {
    user,
    register,
    signIn,
  } = useFirebaseAuth();

  console.log({ user })

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.textInput}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
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
    padding: 20,
  },
  buttonWrapper: {
    margin: 8,
  },
  textInput: {
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    width: 300,
    marginBottom: 30,
  },
});
