import { app } from './firebaseConfig.service';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, arrayUnion, arrayRemove, query, where } from 'firebase/firestore';

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
    
    if (docSnap.exists()) {
      const friendRequests = docSnap.data()['friendRequests'] || [];
      const notifications = [];
  
      for (const request of friendRequests) {
        const senderId = request.senderId;
        const senderDocRef = doc(this.usersCollection, senderId);
        const senderDocSnap = await getDoc(senderDocRef);
  
        if (senderDocSnap.exists()) {
          const senderData = senderDocSnap.data();
          const notification = { ...request, senderDisplayName: senderData['displayName'] };
          notifications.push(notification);
        }
      }
  
      return notifications;
    } else {
      console.error('User not found!');
      return [];
    }
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

  async sendFriendRequest(senderId: string, receiverId: string) {
    const userRef = doc(this.usersCollection, receiverId);

    await updateDoc(userRef, {
      friendRequests: arrayUnion({ senderId, status: 'pending' })
    });
  }

  async updateFriendsList(userId: string, friendId: string) {
    const userRef = doc(this.usersCollection, userId);

    await updateDoc(userRef, {
      friends: arrayUnion(friendId),
      friendRequests: arrayRemove({ senderId: friendId, status: 'pending' })
    });
  }

  async deleteFriendRequestNotification(receiverId: string, senderId: string) {
    const receiverRef = doc(this.usersCollection, receiverId);

    await updateDoc(receiverRef, {
      friendRequests: arrayRemove({ senderId, status: 'pending' })
    });
  }
  
  async createChatRoom(participants: string[]) {
    const chatRoomRef = doc(this.chatRoomsCollection);
  
    // Create a new chat room with participants and an empty messages array
    const newChatRoom = {
      participants,
      messages: [],
    };
  
    await setDoc(chatRoomRef, newChatRoom);
  
    // Return the ID of the newly created chat room
    return chatRoomRef.id;
  }
  
  async getChatRoomId(participants: string[]): Promise<string | null> {
    const querySnapshot = await getDocs(
      query(this.chatRoomsCollection, where('participants', '==', participants))
    );
  
    if (querySnapshot.docs.length > 0) {
      return querySnapshot.docs[0].id;
    } else {
      return null;
    }
  }
  
}
