import { app } from './firebaseConfig.service';
import { getFirestore, collection, doc, getDoc, getDocs } from 'firebase/firestore';

const db = getFirestore(app);
const messagesRef = collection(db, 'messages');
const usersRef = collection(db, 'users');

export const getUsers = async () => {
  const usersSnapshot = await getDocs(usersRef);
  return usersSnapshot.docs.map(doc => doc.data());
};

export const getUserFriends = async (userId: any) => {
  const userDocRef = doc(usersRef, userId);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    return userDocSnap.data()['friends'] || [];
  } else {
    console.error('User not found!');
    return [];
  }
};