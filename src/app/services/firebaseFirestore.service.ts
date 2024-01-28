import { app } from './firebaseConfig.service';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  query,
  where,
  DocumentData,
  onSnapshot,
} from 'firebase/firestore';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzConfigService } from 'ng-zorro-antd/core/config';
import { NzConfig, provideNzConfig } from 'ng-zorro-antd/core/config';
import { inject } from '@angular/core';

export class FirestoreService {
  db = getFirestore(app);
  usersCollection = collection(this.db, 'users');
  chatRoomsCollection = collection(this.db, 'chatRooms');

  notification = inject(NzNotificationService);
  nzConfigService = inject(NzConfigService);

  constructor() {
    this.nzConfigService.set('notification', { nzMaxStack: 1 });
  }

  async getAllDocumentIds(collectionName: string) {
    const collectionRef = collection(this.db, collectionName);
    const querySnapshot = await getDocs(collectionRef);
    return querySnapshot.docs.map((doc) => doc.id);
  }

  async addToUserCollection(user: any) {
    const docRef = doc(this.usersCollection, user.uid);
    const newUser = {
      displayName: user.displayName,
      email: user.email,
      friends: [],
      friendRequests: [],
    };
    await setDoc(docRef, newUser);
  }

  async getNotifications(
    userId: string,
    callback: (notifications: any[]) => void
  ): Promise<() => void> {
    const docRef = doc(this.usersCollection, userId);

    // Subscribe to real-time updates on the friendRequests field
    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      const friendRequests = docSnap.data()['friendRequests'] || [];
      const notifications = [];

      for (const request of friendRequests) {
        const senderId = request.senderId;
        const senderDocRef = doc(this.usersCollection, senderId);
        const senderDocSnap = await getDoc(senderDocRef);

        if (senderDocSnap.exists()) {
          const senderData = senderDocSnap.data();
          const notification = {
            ...request,
            senderDisplayName: senderData['displayName'],
          };
          notifications.push(notification);

          // Display the notification when a friend request is received
          this.notification.blank(
            'Friend Request',
            `You have received a friend request from <strong>${senderData['displayName']}</strong>!`,
            { nzDuration: 0, nzPlacement: 'bottomRight' }
          );
        }
      }

      // Invoke the callback with the updated notifications
      callback(notifications);
    });

    return unsubscribe; // Return the unsubscribe function for cleanup when needed
  }

  async getUsers() {
    const usersSnapshot = await getDocs(this.usersCollection);
    return usersSnapshot.docs.map((doc) => {
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

  async updateUser(userId: string, data: any) {
    const docRef = doc(this.usersCollection, userId);
    await setDoc(docRef, data, { merge: true });
  }

  async deleteUser(userId: string) {
    const docRef = doc(this.usersCollection, userId);
    await deleteDoc(docRef);
  }
  async sendFriendRequest(senderId: string, receiverId: string) {
    const userRef = doc(this.usersCollection, receiverId);

    await updateDoc(userRef, {
      friendRequests: arrayUnion({ senderId, status: 'pending' }),
    });
  }

  async updateFriendsList(userId: string, friendId: string) {
    const userRef = doc(this.usersCollection, userId);

    await updateDoc(userRef, {
      friends: arrayUnion(friendId),
      friendRequests: arrayRemove({ senderId: friendId, status: 'pending' }),
    });
  }

  async deleteFriendRequestNotification(receiverId: string, senderId: string) {
    const receiverRef = doc(this.usersCollection, receiverId);

    await updateDoc(receiverRef, {
      friendRequests: arrayRemove({ senderId, status: 'pending' }),
    });
  }

  async getChatRoomId(participants: string[]): Promise<string | null> {
    participants.sort();

    const querySnapshot = await getDocs(
      query(this.chatRoomsCollection, where('participants', '==', participants))
    );

    if (querySnapshot.docs.length > 0) {
      return querySnapshot.docs[0].id;
    } else {
      return null;
    }
  }

  async createChatRoom(participants: string[]) {
    participants.sort();

    const chatRoomRef = doc(this.chatRoomsCollection);

    const newChatRoom = {
      participants,
      messages: [],
    };

    await setDoc(chatRoomRef, newChatRoom);

    return chatRoomRef.id;
  }

  async getChatRoom(chatRoomId: string): Promise<any | null> {
    const chatRoomRef = doc(this.chatRoomsCollection, chatRoomId);
    const chatRoomSnap = await getDoc(chatRoomRef);

    if (chatRoomSnap.exists()) {
      return { ...chatRoomSnap.data(), id: chatRoomSnap.id };
    } else {
      console.error('Chat room not found!');
      return null;
    }
  }

  async updateChatRoom(chatRoomId: string, data: any) {
    const chatRoomRef = doc(this.chatRoomsCollection, chatRoomId);
    await updateDoc(chatRoomRef, data);
  }

  listenForUsersChanges(callback: (users: DocumentData[]) => void): () => void {
    const usersCollection = collection(this.db, 'users');

    // Subscribe to real-time updates on the users collection
    const unsubscribe = onSnapshot(usersCollection, (querySnapshot) => {
      const users = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        uid: doc.id,
      }));
      callback(users);
    });

    return unsubscribe;
  }
}
