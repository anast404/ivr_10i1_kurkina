import useAuthStore from "@/state/auth";
import useUserStore from "@/state/user";
import { queryClient } from "@/utils/query-client";

/** Выход из аккаунта: забываем токен и пользователя, сбрасываем кэш данных */
export default () => {
    useAuthStore.getState().setToken(undefined)
    useUserStore.getState().setUser(undefined)
    queryClient.clear()
}
