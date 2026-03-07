import useUserStore from "@/state/user";
import {
  signOut as authSignOut,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect } from "react";
import { auth, db } from "../firebaseConfig";

export function useFirebaseAuth() {
  const { user, setUser } = useUserStore((state) => state);

  /**
   * Регистрация пользователя
   */
  const register = async (email: string, password: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      // Отправляем письмо сразу после регистрации
      await sendEmailVerification(user);
      setUser(user);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  /**
   * Вход
   */
  const signIn = async (email: string, password: string) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      setUser(user);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  /**
   * Выход
   */
  const signOut = async () => {
    try {
      await authSignOut(auth);
      setUser(null);
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Отправить письмо с подтверждением на текущий email
   */
  const sendVerificationEmail = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Пользователь не авторизован");
    await sendEmailVerification(currentUser);
  };

  /**
   * Обновить состояние пользователя и проверить верификацию email.
   * Возвращает true если почта подтверждена.
   */
  const checkEmailVerified = async (): Promise<boolean> => {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;
    // reload запрашивает актуальные данные с Firebase
    await reload(currentUser);
    if (currentUser.emailVerified) {
      setUser({ ...currentUser });
      return true;
    }
    return false;
  };

  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          await setDoc(userDocRef, {
            name: user.email,
            email: user.email,
            createdAt: new Date(),
          })
            .then(() => console.log("Профиль пользователя создан!"))
            .catch((error) => console.error("Ошибка при создании профиля:", error));
        }

        setUser(user);
      }
    });
    return subscriber;
  }, []);

  return {
    user,
    register,
    signIn,
    signOut,
    sendVerificationEmail,
    checkEmailVerified,
  };
}