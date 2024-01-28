import { app } from './firebaseConfig.service';
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut,
  setPersistence,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  browserSessionPersistence,
  browserLocalPersistence,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { NzMessageService } from 'ng-zorro-antd/message';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { FirestoreService } from './firebaseFirestore.service';

export class AuthService {
  private message = inject(NzMessageService);
  private firestore = inject(FirestoreService);
  private router = inject(Router);

  auth = getAuth(app);

  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(this.auth, provider);
      const documentIds = await this.firestore.getAllDocumentIds('users');
      const currentUser = this.auth.currentUser;
      if (currentUser) {
        const currentUserUid = currentUser.uid;
        if (!documentIds.includes(currentUserUid)) {
          await this.firestore.addToUserCollection(currentUser);
        }
      }
      this.message.create('success', 'Login successful!');
      this.router.navigate(['/']);
    } catch {
      this.message.create('error', 'Login failed!', {
        nzDuration: 10000,
      });
    }
  }

  async loginWithGithub() {
    try {
      const provider = new GithubAuthProvider();
      await signInWithPopup(this.auth, provider);
      const documentIds = await this.firestore.getAllDocumentIds('users');
      const currentUser = this.auth.currentUser;
      if (currentUser) {
        const currentUserUid = currentUser.uid;
        if (!documentIds.includes(currentUserUid)) {
          await this.firestore.addToUserCollection(currentUser);
        }
      }
      this.message.create('success', 'Login successful!');
      this.router.navigate(['/']);
    } catch {
      this.message.create('error', 'Login failed!', {
        nzDuration: 10000,
      });
    }
  }

  async login(email: string, password: string, remember: boolean) {
    try {
      if (remember) {
        await setPersistence(this.auth, browserLocalPersistence);
      } else {
        await setPersistence(this.auth, browserSessionPersistence);
      }
      await signInWithEmailAndPassword(this.auth, email, password);
      this.message.create('success', 'Login successful!');
      this.router.navigate(['/']);
    } catch {
      this.message.create('error', 'Wrong email or password!');
    }
  }

  async logout() {
    try {
      await signOut(this.auth);
      this.message.create('success', 'Logout successful!');
      this.router.navigate(['/login']);
    } catch {
      this.message.create('error', 'Logout failed!');
    }
  }

  async register(email: string, password: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      const user = userCredential.user;
      if (user.displayName === null) {
        await updateProfile(user, { displayName: email.split('@')[0] });
      }
      if (user.photoURL === null) {
        await updateProfile(user, {
          photoURL: 'assets/default-profile.jpeg',
        });
      }
      await this.firestore.addToUserCollection(user);
      this.router.navigate(['/']);
      this.message.create('success', 'Successfully registered!');
    } catch (error) {
      // @ts-ignore
      if (error?.code === 'auth/email-already-in-use') {
        this.message.create('error', 'Email already in use!');
        // @ts-ignore
      } else if (error?.code === 'auth/invalid-email') {
        this.message.create('error', 'Invalid email!');
        // @ts-ignore
      } else if (error?.code === 'auth/weak-password') {
        this.message.create('error', 'Password too weak!');
      } else {
        // @ts-ignore
        this.message.create('error', error?.message);
      }
    }
  }

  async forgotPassword(email: string) {
    try {
      await sendPasswordResetEmail(this.auth, email);
      this.message.create('success', 'Email sent!');
    } catch (error) {
      // @ts-ignore
      if (error?.code === 'auth/invalid-email') {
        this.message.create('error', 'Invalid email!');
      } else {
        // @ts-ignore
        this.message.create('error', error?.message);
      }
    }
  }

  async changeDisplayName(displayName: string) {
    try {
      const user = this.auth.currentUser;
      if (user) {
        await updateProfile(user, { displayName });
        await this.firestore.updateUser(user.uid, { displayName });
        this.message.create('success', 'Display name changed!');
        return true;
      }
      return false;
    } catch (error: any) {
      this.message.create('error', error.message ? error.message : error);
      return false;
    }
  }

  async changePassword(oldPassword: string, newPassword: string) {
    try {
      const user = this.auth.currentUser;
      if (user) {
        if (user.email !== null) {
          const credential = EmailAuthProvider.credential(
            user.email,
            oldPassword
          );
          await reauthenticateWithCredential(user, credential);
          await updatePassword(user, newPassword);
          this.message.create('success', 'Password changed!');
          return true;
        }
      }
      return false;
    } catch (error: any) {
      this.message.create('error', error.message ? error.message : error);
      return false;
    }
  }

  async deleteAccount(password: string) {
    try {
      const user = this.auth.currentUser;
      if (user) {
        if (user.email !== null) {
          const credential = EmailAuthProvider.credential(user.email, password);
          await reauthenticateWithCredential(user, credential);
          await this.firestore.deleteUser(user.uid);
          await user.delete();
          this.message.create('success', 'Account deleted!');
          this.router.navigate(['/register']);
          return true;
        }
      }
      return false;
    } catch (error: any) {
      this.message.create('error', 'Wrong password!');
      return false;
    }
  }
}
