import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthStore {
    token?: string;
    /** true, когда сохранённый токен уже прочитан с устройства */
    hasHydrated: boolean;
    setToken(token?: string): void;
    setHasHydrated(value: boolean): void;
}

const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            token: undefined,
            hasHydrated: false,
            setToken: (token) => set({ token }),
            setHasHydrated: (hasHydrated) => set({ hasHydrated }),
        }),
        {
            name: "happyhome-auth",
            storage: createJSONStorage(() => AsyncStorage),
            // на устройстве храним только токен
            partialize: (state) => ({ token: state.token }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);

export default useAuthStore;
