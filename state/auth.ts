import { create } from "zustand";

interface AuthStore {
    token?: string;
    setToken(token?: string): void;
}

const useAuthStore = create<AuthStore>((set) => ({
    user: undefined,
    setToken: (token) => set({ token }),
}));

export default useAuthStore;