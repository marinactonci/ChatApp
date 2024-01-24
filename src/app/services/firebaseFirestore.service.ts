import { app } from './firebaseConfig.service';
import { getFirestore, collection, doc, getDoc } from 'firebase/firestore';

const db = getFirestore(app);
const messagesRef = collection(db, 'messages');

// get document from collection and save it as a readable reference
export const getContent = async () => {
  const docRef = doc(messagesRef, 'message1');
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    // doc.data() will be undefined in this case
    console.error('No such document!');
    return null;
  }
};
