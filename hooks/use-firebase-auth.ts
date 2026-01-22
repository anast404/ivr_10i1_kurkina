import useUserStore from "@/state/user";
import {
  signOut as authSignOut,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect } from "react";
import { auth, db } from "../firebaseConfig";

export function useFirebaseAuth() {
  const { user, setUser } = useUserStore((state) => state);

  /**
   * регистрация пользователя
   * @param email почта
   * @param password пароль
   */
  const register = async (email: string, password: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      setUser(user);
    } catch (e) {
      // todo: добавить оповещение
      console.error(e);
    }
  };

  /**
   * вход
   * @param email почта
   * @param password пароль
   */
  const signIn = async (
    email: string,
    password: string
  ) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);

      setUser(user);
    } catch (e) {
      // todo: добавить оповещение
      console.error(e);
    }
  };

  /**
   * выход
   */
  const signOut = async () => {
    try {
      await authSignOut(auth);

      setUser(null);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, async (user) => {
      // создадим пользователя если его еще нет
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          await setDoc(userDocRef, {
            name: user.email,
            email: user.email,
            createdAt: new Date()
          })
            .then(() => {
              // todo: добавить оповещение
              console.log("Профиль пользователя создан!");
            })
            .catch((error) => {
              // todo: добавить оповещение
              console.error("Ошибка при создании профиля:", error);
            });
        }
      }
    });
    return subscriber;
  }, []);

  return {
    user,
    register,
    signIn,
    signOut,
  };
}
