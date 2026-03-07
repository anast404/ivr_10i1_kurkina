import { LoginForm } from '@/components/organism/login-form';
import { EmailVerification } from '@/components/organism/email-verification';
import { useFirebaseAuth } from '@/hooks/use-firebase-auth';
import { Stack } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const { user } = useFirebaseAuth();

  // Не авторизован → форма входа
  if (!user) {
    return <LoginForm />;
  }

  // Авторизован, но почта не подтверждена → экран верификации
  if (!user.emailVerified) {
    return <EmailVerification />;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}