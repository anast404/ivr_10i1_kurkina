import { collection, doc, DocumentData, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * Забрать документ/данные из коллекции
 * @param collectionName имя коллекции
 * @param documentName имя документа
 * @returns данные
 */
async function getDocument(collectionName: string, documentName: string) {
  const docRef = doc(db, collectionName, documentName);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    return null;
  }
}

/**
 * Записать даные в документ
 * @param collectionName имя коллекции
 * @param documentName имя документа
 * @param data записываемые данные
 */
async function setDocument<T extends DocumentData>(collectionName: string, documentName: string, data: T) {
  const docRef = doc(db, collectionName, documentName);

  await setDoc(docRef, data);
}

/**
 * Обновить данные в документе
 * @param collectionName имя коллекции
 * @param documentName имя документа
 * @param data обновляемые данные
 */
async function updateDocument<T extends DocumentData>(collectionName: string, documentName: string, data: T) {
  const docRef = doc(db, collectionName, documentName);

  await updateDoc(docRef, data);
}

/**
 * Забрать документы из коллекции
 * @param collectionName имя коллекции
 * @returns документы
 */
async function getAllDocuments(collectionName: string) {
  const collectionRef = collection(db, collectionName);
  const querySnapshot = await getDocs(collectionRef);

  const documents: DocumentData[] = [];
  querySnapshot.forEach((doc) => {
    documents.push({ id: doc.id, ...doc.data() });
  });

  return documents;
}

export {
  getAllDocuments, getDocument, setDocument, updateDocument
};

