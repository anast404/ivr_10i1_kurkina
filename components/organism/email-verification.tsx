import { useFirebaseAuth } from '@/hooks/use-firebase-auth';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// ─── Палитра (sage, как в профиле) ─────────────────────────────────────────
const C = {
  sageDark:  '#4E7D62',
  sage:      '#7BAF8E',
  sageLight: '#B2D4BC',
  sagePale:  '#EEF7F1',
  cream:     '#FAF6EF',
  warm:      '#F0E8D8',
  charcoal:  '#2D3A32',
  stone:     '#8A9488',
  white:     '#FFFFFF',
  error:     '#D95B5B',
  errorPale: '#FDEAEA',
  successPale: '#E6F6ED',
};

const RESEND_COOLDOWN_SEC = 60;

export function EmailVerification() {
  const { user, sendVerificationEmail, checkEmailVerified, signOut } = useFirebaseAuth();

  const [checking, setChecking]     = useState(false);
  const [sending, setSending]       = useState(false);
  const [verified, setVerified]     = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cooldown, setCooldown]     = useState(0);

  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Пульсация конверта
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Автопроверка каждые 5 секунд
  useEffect(() => {
    checkTimer.current = setInterval(async () => {
      const ok = await checkEmailVerified();
      if (ok) {
        clearInterval(checkTimer.current!);
        setVerified(true);
        // _layout.tsx автоматически перенаправит когда user.emailVerified станет true
      }
    }, 5000);
    return () => { if (checkTimer.current) clearInterval(checkTimer.current); };
  }, []);

  // Таймер повторной отправки
  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(timerRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || sending) return;
    setSending(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await sendVerificationEmail();
      setSuccessMsg('Письмо отправлено! Проверьте почту.');
      setCooldown(RESEND_COOLDOWN_SEC);
    } catch {
      setError('Не удалось отправить письмо. Попробуйте позже.');
    } finally {
      setSending(false);
    }
  };

  const handleCheckNow = async () => {
    setChecking(true);
    setError(null);
    const ok = await checkEmailVerified();
    setChecking(false);
    if (ok) {
      setVerified(true);
    } else {
      setError('Почта ещё не подтверждена. Проверьте письмо.');
    }
  };

  const email = user?.email ?? '';

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
        {/* Фоновые декоративные круги */}
        <View style={styles.bgCircle1} />
        <View style={styles.bgCircle2} />

        {/* Логотип */}
        <View style={styles.logoWrap}>
          <View style={styles.logoBox}>
            <Text style={styles.logoEmoji}>🏡</Text>
          </View>
          <Text style={styles.appName}>HappyHome</Text>
        </View>

        {/* Карточка */}
        <View style={styles.card}>

          {/* Анимированный конверт */}
          <Animated.View style={[styles.iconWrap, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.iconEmoji}>{verified ? '✅' : '✉️'}</Text>
          </Animated.View>

          <Text style={styles.cardTitle}>
            {verified ? 'Почта подтверждена!' : 'Подтвердите почту'}
          </Text>

          {!verified && (
            <>
              <Text style={styles.cardDesc}>
                Мы отправили письмо со ссылкой на
              </Text>
              <View style={styles.emailBadge}>
                <Text style={styles.emailBadgeText}>{email}</Text>
              </View>
              <Text style={styles.cardHint}>
                Перейдите по ссылке в письме, затем нажмите кнопку ниже.
              </Text>

              {/* Сообщение об успехе */}
              {successMsg ? (
                <View style={styles.successBox}>
                  <Text style={styles.successText}>✓ {successMsg}</Text>
                </View>
              ) : null}

              {/* Сообщение об ошибке */}
              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠ {error}</Text>
                </View>
              ) : null}

              {/* Кнопка «Я подтвердил» */}
              <Pressable
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
                onPress={handleCheckNow}
                disabled={checking}
              >
                {checking
                  ? <ActivityIndicator color={C.white} />
                  : <Text style={styles.primaryBtnText}>Я подтвердил почту ✓</Text>
                }
              </Pressable>

              {/* Кнопка повторной отправки */}
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  (cooldown > 0 || sending) && styles.secondaryBtnDisabled,
                  pressed && cooldown === 0 && styles.secondaryBtnPressed,
                ]}
                onPress={handleResend}
                disabled={cooldown > 0 || sending}
              >
                {sending
                  ? <ActivityIndicator color={C.sage} size="small" />
                  : <Text style={[styles.secondaryBtnText, cooldown > 0 && styles.secondaryBtnTextDisabled]}>
                      {cooldown > 0 ? `Отправить снова (${cooldown}с)` : 'Отправить письмо снова'}
                    </Text>
                }
              </Pressable>
            </>
          )}

          {verified && (
            <Text style={styles.verifiedDesc}>
              Аккаунт активирован. Перенаправляем вас…
            </Text>
          )}
        </View>

        {/* Выход */}
        {!verified && (
          <Pressable style={styles.signOutBtn} onPress={signOut}>
            <Text style={styles.signOutText}>Выйти из аккаунта</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.cream,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },

  // Декор
  bgCircle1: {
    position: 'absolute',
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: C.sagePale,
    top: -80, right: -80,
  },
  bgCircle2: {
    position: 'absolute',
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: C.warm,
    bottom: 40, left: -60,
  },

  // Логотип
  logoWrap: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBox: {
    width: 72, height: 72, borderRadius: 24,
    backgroundColor: C.sage,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    shadowColor: C.sageDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  logoEmoji: { fontSize: 32 },
  appName: {
    fontSize: 26, fontWeight: '800', color: C.charcoal, letterSpacing: -0.5,
  },

  // Карточка
  card: {
    backgroundColor: C.white,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: C.charcoal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 20, elevation: 6,
  },

  iconWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: C.sagePale,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  iconEmoji: { fontSize: 42 },

  cardTitle: {
    fontSize: 22, fontWeight: '800', color: C.charcoal,
    letterSpacing: -0.3, marginBottom: 10, textAlign: 'center',
  },
  cardDesc: {
    fontSize: 14, color: C.stone, fontWeight: '600',
    textAlign: 'center', marginBottom: 6,
  },
  emailBadge: {
    backgroundColor: C.sagePale,
    borderRadius: 99,
    paddingHorizontal: 16, paddingVertical: 7,
    marginBottom: 12,
  },
  emailBadgeText: {
    fontSize: 14, fontWeight: '800', color: C.sageDark, letterSpacing: 0.1,
  },
  cardHint: {
    fontSize: 13, color: C.stone, fontWeight: '600',
    textAlign: 'center', lineHeight: 18, marginBottom: 20,
  },

  // Статусы
  successBox: {
    backgroundColor: C.successPale,
    borderRadius: 10, padding: 10,
    marginBottom: 14, width: '100%',
  },
  successText: {
    color: C.sageDark, fontSize: 13, fontWeight: '700', textAlign: 'center',
  },
  errorBox: {
    backgroundColor: C.errorPale,
    borderRadius: 10, padding: 10,
    marginBottom: 14, width: '100%',
  },
  errorText: {
    color: C.error, fontSize: 13, fontWeight: '700', textAlign: 'center',
  },

  // Кнопки
  primaryBtn: {
    backgroundColor: C.sageDark,
    borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', width: '100%',
    marginBottom: 10,
    shadowColor: C.sageDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  primaryBtnPressed: { backgroundColor: C.sage, shadowOpacity: 0.15 },
  primaryBtnText: {
    color: C.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.2,
  },

  secondaryBtn: {
    borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', width: '100%',
    borderWidth: 1.5, borderColor: C.sageLight,
    backgroundColor: C.white,
  },
  secondaryBtnDisabled: { borderColor: '#E0E8E4', backgroundColor: C.cream },
  secondaryBtnPressed:  { backgroundColor: C.sagePale },
  secondaryBtnText: {
    color: C.sageDark, fontSize: 15, fontWeight: '800',
  },
  secondaryBtnTextDisabled: { color: C.stone },

  // Подтверждено
  verifiedDesc: {
    fontSize: 15, color: C.stone, fontWeight: '600',
    textAlign: 'center', marginTop: 8,
  },

  // Выход
  signOutBtn: {
    marginTop: 24, alignItems: 'center', padding: 12,
  },
  signOutText: {
    fontSize: 13, fontWeight: '700', color: C.stone,
    textDecorationLine: 'underline',
  },
});
