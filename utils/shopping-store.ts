import { TShoppingItem, TCreateShoppingItem } from '@/types/shopping';
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

const COLLECTION = 'shopping_items';

/** Получить все товары семьи */
export async function getShoppingItems(familyUuid: string): Promise<TShoppingItem[]> {
  const q = query(
    collection(db, COLLECTION),
    where('familyUuid', '==', familyUuid),
    orderBy('createdAt', 'desc'),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as TShoppingItem));
}

/** Добавить товар */
export async function addShoppingItem(
  data: TCreateShoppingItem,
  familyUuid: string,
  userId: string,
): Promise<string> {
  const clean = Object.fromEntries(
    Object.entries({ ...data, familyUuid, createdBy: userId, createdAt: new Date().toISOString(), bought: false })
      .filter(([, v]) => v !== undefined)
  );
  const docRef = await addDoc(collection(db, COLLECTION), clean);
  return docRef.id;
}

/** Обновить товар */
export async function updateShoppingItem(
  id: string,
  data: Partial<TShoppingItem>,
): Promise<void> {
  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );
  await updateDoc(doc(db, COLLECTION, id), clean);
}

/** Отметить куплено / не куплено */
export async function toggleShoppingItemBought(
  id: string,
  bought: boolean,
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    bought,
    boughtAt: bought ? new Date().toISOString() : null,
  });
}

/** Удалить товар */
export async function deleteShoppingItem(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
