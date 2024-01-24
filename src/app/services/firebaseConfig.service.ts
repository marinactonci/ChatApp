// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc } from 'firebase/firestore';
import { environment } from '../../enviroments/enviroment';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = environment.firebaseConfig;

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// retrieve the collection named messages from the firestore database
const db = getFirestore(app);
export const messagesRef = collection(db, 'messages');

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
