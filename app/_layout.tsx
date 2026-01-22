import { LoginForm } from '@/components/organism/login-form';
import { useFirebaseAuth } from '@/hooks/use-firebase-auth';
import { Stack } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const {
    user,
  } = useFirebaseAuth();

  if (!user) {
    // если пользователь неопределен то показываем форму авторизации
    return (<LoginForm />)
  }

  return (<RootLayoutNav />)
}

function RootLayoutNav() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
