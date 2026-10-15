import { create } from "zustand";

interface AuthStore {
    token?: string;
    setToken(token?: string): void;
}

const useAuthStore = create<AuthStore>((set) => ({
    token: undefined,
    setToken: (token) => set({ token }),
}));

export default useAuthStore;