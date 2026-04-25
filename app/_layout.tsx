import { EmailVerification } from '@/components/organism/email-verification';
import { LoginForm } from '@/components/organism/login-form';
import { Stack } from 'expo-router';

import api from '@/api';
import useAuthStore from '@/state/auth';
import useUserStore from '@/state/user';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayout />
    </QueryClientProvider>
  );
}

function RootLayout() {
  const { token } = useAuthStore((state) => state);
  const { user, setUser } = useUserStore((state) => state);

  // todo: isLoading/isError
  const {data, isSuccess} = useQuery({
    queryKey: ['getUser'],
    queryFn: () => api.get(`/user`),
    enabled: !!token,
  });

  useEffect(() => {
    if (isSuccess && data?.data) {
      setUser(data.data)
    }
  }, [isSuccess, data, setUser]);

  // Не авторизован → форма входа
  if (!user) {
    return <LoginForm />;
  }

  // Авторизован, но почта не подтверждена → экран верификации
  if (!user.isVerified) {
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