import { useFirebaseAuth } from '@/hooks/use-firebase-auth';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { isValid, loginValidationRules, runValidation } from '@/utils/validation';

const C = {
  sageDark:   '#4E7D62',
  sage:       '#7BAF8E',
  sageLight:  '#B2D4BC',
  sagePale:   '#EEF7F1',
  cream:      '#FAF6EF',
  warm:       '#F0E8D8',
  charcoal:   '#2D3A32',
  stone:      '#8A9488',
  white:      '#FFFFFF',
  error:      '#D95B5B',
};

type Mode = 'signIn' | 'register';

export function LoginForm() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode]         = useState<Mode>('signIn');
  const [focusedField, setFocused] = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);

  const { register, signIn } = useFirebaseAuth();

  const handleSubmit = async () => {
    setError(null);

    const errs = runValidation({ email, password }, loginValidationRules);
    if (!isValid(errs)) {
      // Показываем первую ошибку как одну строку (поведение прежнее)
      setError(Object.values(errs)[0]);
      return;
    }

    try {
      if (mode === 'register') {
        await register(email, password);
      } else {
        await signIn(email, password);
      }
    } catch {
      setError('Проверьте email и пароль');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.bgCircle1} />
        <View style={styles.bgCircle2} />

        <View style={styles.logoWrap}>
          <View style={styles.logoBox}>
            <Text style={styles.logoEmoji}>🏡</Text>
          </View>
          <Text style={styles.appName}>HappyHome</Text>
          <Text style={styles.appTagline}>Семья в одном приложении</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.modeSwitch}>
            <Pressable
              style={[styles.modeBtn, mode === 'signIn' && styles.modeBtnActive]}
              onPress={() => { setMode('signIn'); setError(null); }}
            >
              <Text style={[styles.modeBtnText, mode === 'signIn' && styles.modeBtnTextActive]}>
                Войти
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modeBtn, mode === 'register' && styles.modeBtnActive]}
              onPress={() => { setMode('register'); setError(null); }}
            >
              <Text style={[styles.modeBtnText, mode === 'register' && styles.modeBtnTextActive]}>
                Регистрация
              </Text>
            </Pressable>
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={[styles.input, focusedField === 'email' && styles.inputFocused]}
              placeholder="name@example.com"
              placeholderTextColor={C.stone}
              value={email}
              onChangeText={(v) => { setEmail(v); setError(null); }}
              autoCapitalize="none"
              keyboardType="email-address"
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
            />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Пароль</Text>
            <TextInput
              style={[styles.input, focusedField === 'password' && styles.inputFocused]}
              placeholder="Минимум 6 символов"
              placeholderTextColor={C.stone}
              value={password}
              onChangeText={(v) => { setPassword(v); setError(null); }}
              secureTextEntry
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
            />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠ {error}</Text>
            </View>
          ) : null}

          <Pressable
            style={({ pressed }) => [styles.submitBtn, pressed && styles.submitBtnPressed]}
            onPress={handleSubmit}
          >
            <Text style={styles.submitBtnText}>
              {mode === 'signIn' ? 'Войти' : 'Создать аккаунт'}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.hint}>
          {mode === 'signIn' ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
          <Text
            style={styles.hintLink}
            onPress={() => { setMode(mode === 'signIn' ? 'register' : 'signIn'); setError(null); }}
          >
            {mode === 'signIn' ? 'Зарегистрироваться' : 'Войти'}
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  bgCircle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: C.sagePale, top: -80, right: -80 },
  bgCircle2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: C.warm, bottom: 40, left: -60 },
  logoWrap: { alignItems: 'center', marginBottom: 36 },
  logoBox: { width: 80, height: 80, borderRadius: 26, backgroundColor: C.sage, alignItems: 'center', justifyContent: 'center', marginBottom: 14, shadowColor: C.sageDark, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  logoEmoji: { fontSize: 36 },
  appName: { fontSize: 28, fontWeight: '800', color: C.charcoal, letterSpacing: -0.5 },
  appTagline: { fontSize: 13, color: C.stone, fontWeight: '600', marginTop: 4, letterSpacing: 0.2 },
  card: { backgroundColor: C.white, borderRadius: 24, padding: 24, shadowColor: C.charcoal, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 6 },
  modeSwitch: { flexDirection: 'row', backgroundColor: C.sagePale, borderRadius: 14, padding: 4, marginBottom: 24 },
  modeBtn: { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: 'center' },
  modeBtnActive: { backgroundColor: C.white, shadowColor: C.charcoal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  modeBtnText: { fontSize: 14, fontWeight: '700', color: C.stone },
  modeBtnTextActive: { color: C.sageDark },
  fieldWrap: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '800', color: C.stone, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: '#E0EBE4', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, fontWeight: '600', color: C.charcoal, backgroundColor: C.cream },
  inputFocused: { borderColor: C.sage, backgroundColor: C.white },
  errorBox: { backgroundColor: '#FDEAEA', borderRadius: 10, padding: 10, marginBottom: 14 },
  errorText: { color: C.error, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  submitBtn: { backgroundColor: C.sageDark, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 4, shadowColor: C.sageDark, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  submitBtnPressed: { backgroundColor: C.sage, shadowOpacity: 0.15 },
  submitBtnText: { color: C.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  hint: { textAlign: 'center', marginTop: 24, fontSize: 13, color: C.stone, fontWeight: '600' },
  hintLink: { color: C.sageDark, fontWeight: '800' },
});