import { QueryClient } from '@tanstack/react-query';

/** Единый клиент запросов: нужен и корню приложения, и выходу из аккаунта (сброс кэша) */
export const queryClient = new QueryClient();
