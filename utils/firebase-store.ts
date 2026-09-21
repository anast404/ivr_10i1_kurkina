import { doc, getDoc } from "firebase/firestore";
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

export {
  getDocument
};

