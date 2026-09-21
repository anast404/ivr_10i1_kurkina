import { TPill, TCreatePill } from '@/types/pill';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

const COLLECTION = 'pills';

/**
 * Получить все лекарства семьи, отсортированные по сроку годности
 */
export async function getPills(familyUuid: string): Promise<TPill[]> {
  const q = query(
    collection(db, COLLECTION),
    where('familyUuid', '==', familyUuid),
    orderBy('expiresAt', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as TPill));
}

/**
 * Добавить лекарство
 */
export async function addPill(
  data: TCreatePill,
  familyUuid: string,
  userId: string
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...data,
    familyUuid,
    createdBy: userId,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

/**
 * Обновить лекарство
 */
export async function updatePill(id: string, data: Partial<TCreatePill>): Promise<void> {
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, data as any);
}

/**
 * Удалить лекарство
 */
export async function deletePill(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
