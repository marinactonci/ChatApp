import { app } from './firebaseConfig.service';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';

export class FirestoreService {
  db = getFirestore(app);
  usersCollection = collection(this.db, "users");
  chatRoomsCollection = collection(this.db, "chatRooms");

  async addToUserCollection(user: any) {
    const docRef = doc(this.usersCollection, user.uid);
    const newUser = {
      displayName: user.displayName,
      email: user.email,
      photoURL: '/assets/default-profile.png',
      friends: [],
      friendRequests: []
    }
    await setDoc(docRef, newUser);
  }

  async getNotifications(userId: string) {
    const docRef = doc(this.usersCollection, userId);
    const docSnap = await getDoc(docRef);
    // @ts-ignore
    return docSnap.data().friendRequests;
  }

  async getUsers() {
    const usersSnapshot = await getDocs(this.usersCollection);
    return usersSnapshot.docs.map(doc => {
      const userData = doc.data();
      return { ...userData, uid: doc.id };
    });
  }

  async getUserFriends(userId: string) {
    try {
      const userDocRef = doc(this.usersCollection, userId);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        return userDocSnap.data()['friends'] || [];
      } else {
        console.error('User not found!');
        return [];
      }
    } catch (error) {
      console.error('Error fetching user friends:', error);
      return [];
    }
  }

  // Add this method to your FirestoreService
  async getUsersByUids(uids: string[]) {
    const users = [];

    for (const uid of uids) {
      const userDocRef = doc(this.usersCollection, uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        users.push({ ...userData, uid: userDocSnap.id });
      } else {
        console.error('User not found with UID:', uid);
      }
    }

    return users;
  }

}
