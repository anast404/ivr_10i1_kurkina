import useAuthStore from "@/state/auth";
import useUserStore from "@/state/user";

export default () => {
    useAuthStore.getState().setToken(undefined)
    useUserStore.getState().setUser(undefined)
}