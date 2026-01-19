import useUserStore from "@/state/user";
import { signOut as authSignOut, createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app } from "../firebaseConfig.js";

export function useFirebaseAuth() {
  const auth = getAuth(app);
  const { user, setUser } = useUserStore((state) => state);

  const register = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (e) {
      console.error(e);
    }
  };

  const signIn = async (
    email: string,
    password: string
  ) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      setUser(user);
    } catch (e) {
      console.error(e);
    }
  };

  const signOut = async () => {
    try {
      await authSignOut(auth);
      setUser(null);
    } catch (e) {
      console.error(e);
    }
  };

  // useEffect(() => {
  //   const subscriber = onAuthStateChanged(auth, (user) => setUser(user));
  //   return subscriber;
  // }, []);

  return {
    user,
    register,
    signIn,
    signOut,
  };
}
