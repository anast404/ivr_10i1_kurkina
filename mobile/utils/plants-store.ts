import { TPlant, TCreatePlant, TCareRecord } from '@/types/plant';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

const PLANTS_COLLECTION = 'plants';
const CARE_COLLECTION = 'care_records';

/** Получить все растения семьи */
export async function getPlants(familyUuid: string): Promise<TPlant[]> {
  const q = query(
    collection(db, PLANTS_COLLECTION),
    where('familyUuid', '==', familyUuid),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as TPlant));
}

/** Добавить растение */
export async function addPlant(
  data: TCreatePlant,
  familyUuid: string,
  userId: string
): Promise<string> {
  const docRef = await addDoc(collection(db, PLANTS_COLLECTION), {
    ...data,
    familyUuid,
    createdBy: userId,
    createdAt: new Date().toISOString(),
    lastWateredAt: new Date().toISOString(),
  });
  return docRef.id;
}

/** Обновить растение */
export async function updatePlant(id: string, data: Partial<TCreatePlant>): Promise<void> {
  await updateDoc(doc(db, PLANTS_COLLECTION, id), data as any);
}

/** Удалить растение */
export async function deletePlant(id: string): Promise<void> {
  await deleteDoc(doc(db, PLANTS_COLLECTION, id));
}

/** Отметить полив — обновить lastWateredAt и добавить запись в историю */
export async function waterPlant(
  plantId: string,
  familyUuid: string,
  note?: string
): Promise<void> {
  const now = new Date().toISOString();

  // обновить дату последнего полива
  await updateDoc(doc(db, PLANTS_COLLECTION, plantId), { lastWateredAt: now });

  // добавить запись в историю
  await addDoc(collection(db, CARE_COLLECTION), {
    plantId,
    familyUuid,
    date: now,
    note: note ?? '',
  });
}

/** Получить историю ухода за растением */
export async function getCareRecords(plantId: string): Promise<TCareRecord[]> {
  const q = query(
    collection(db, CARE_COLLECTION),
    where('plantId', '==', plantId),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() } as TCareRecord))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
