import { EmailVerification } from '@/components/organism/email-verification';
import { LoginForm } from '@/components/organism/login-form';
import { Stack } from 'expo-router';
import Toast from 'react-native-toast-message';

import api from '@/api';
import useAuthStore from '@/state/auth';
import useUserStore from '@/state/user';
import { COLORS as C } from '@/styles/colors';
import { queryClient } from '@/utils/query-client';
import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayout />
      <Toast />
    </QueryClientProvider>
  );
}

function RootLayout() {
  const { token, hasHydrated } = useAuthStore((state) => state);
  const { user, setUser } = useUserStore((state) => state);

  // todo: isLoading/isError
  const { data, isSuccess, isLoading } = useQuery({
    queryKey: ['getUser'],
    queryFn: () => api.get(`/user`),
    enabled: !!token,
  });

  useEffect(() => {
    if (isSuccess && data?.data) {
      setUser(data.data)
    }
  }, [isSuccess, data, setUser]);

  // Ждём, пока прочитается сохранённый токен и загрузится профиль, чтобы не мигала форма входа
  if (!hasHydrated || (token && !user && isLoading)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.cream }}>
        <ActivityIndicator color={C.sage} />
      </View>
    );
  }

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