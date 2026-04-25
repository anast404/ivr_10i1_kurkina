import { create } from "zustand";

interface UserStore {
    user?: { email: string, name: string, family_id: string, isVerified: boolean };
    setUser(user: any): void;
}

const useUserStore = create<UserStore>((set) => ({
    user: undefined,
    setUser: (user) => set({ user }),
}));

export default useUserStore;