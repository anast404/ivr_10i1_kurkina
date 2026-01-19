// import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { create } from "zustand";

interface UserStore {
    // user: FirebaseAuthTypes.User | null;
    user: any;
    // setUser(user: FirebaseAuthTypes.User | null): void;
    setUser(user: any): void;
}

const useUserStore = create<UserStore>((set) => ({
    user: null,
    setUser: (user) => set({ user }),
}));

export default useUserStore;