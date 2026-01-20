import { LoginForm } from '@/components/organism/login';
import { useFirebaseAuth } from '@/hooks/use-firebase-auth';
import { Stack } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const {
    user,
  } = useFirebaseAuth();

  if(!user) {
    return(<LoginForm />)
  }

  return(<RootLayoutNav/>)
}

function RootLayoutNav() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
