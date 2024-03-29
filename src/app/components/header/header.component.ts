import { Component, inject, OnInit } from "@angular/core";
import { NzIconModule } from "ng-zorro-antd/icon";
import { NzDrawerModule } from "ng-zorro-antd/drawer";
import { NzButtonModule } from "ng-zorro-antd/button";
import { NzDropDownModule } from "ng-zorro-antd/dropdown";
import { AuthService } from "../../services/firebaseAuth.service";
import { onAuthStateChanged } from "firebase/auth";
import { Router, RouterModule } from "@angular/router";
import {FirestoreService} from "../../services/firebaseFirestore.service";
import {NzBadgeModule} from "ng-zorro-antd/badge";
import {NzEmptyComponent} from "ng-zorro-antd/empty";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-header",
  standalone: true,
  imports: [NzIconModule, NzDrawerModule, NzButtonModule, NzDropDownModule, NzBadgeModule, NzEmptyComponent, CommonModule, RouterModule],
  providers: [AuthService, FirestoreService],
  templateUrl: "./header.component.html",
})
export class HeaderComponent implements OnInit {
  user: any = {};
  isLoggedIn = false;
  notifications: any[] = [];
  private notificationsListenerUnsubscribe: any;

  authService = inject(AuthService);
  firestoreService = inject(FirestoreService);
  router = inject(Router);

  async ngOnInit() {
    onAuthStateChanged(this.authService.auth, async (user) => {
      if (user) {
        this.isLoggedIn = true;
        this.user = user;
  
        // Subscribe to real-time updates on notifications
        this.notificationsListenerUnsubscribe = this.firestoreService.getNotifications(user.uid, (notifications) => {
          this.notifications = notifications;
        });
      } else {
        this.isLoggedIn = false;
        this.user = {};
  
        // If user is not logged in, unsubscribe from real-time updates
        if (this.notificationsListenerUnsubscribe) {
          this.notificationsListenerUnsubscribe();
        }
      }
    });
  }
  
  async handleLogout() {
    await this.authService.logout();
  }

  async acceptFriendRequest(senderId: string) {
    try {
      const currentUser = this.user;
      const receiverId = currentUser.uid;

      // Update sender's friends list
      await this.firestoreService.updateFriendsList(senderId, receiverId);

      // Update receiver's friends list
      await this.firestoreService.updateFriendsList(receiverId, senderId);

      // Delete notification
      await this.firestoreService.deleteFriendRequestNotification(receiverId, senderId);
      this.ngOnInit()
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  }

  async declineFriendRequest(senderId: string) {
    try {
      const currentUser = this.user;
      const receiverId = currentUser.uid;

      await this.firestoreService.deleteFriendRequestNotification(receiverId, senderId);
      this.ngOnInit()
    } catch (error) {
      console.error('Error declining friend request:', error);
    }
  }

  ngOnDestroy() {
    if (this.notificationsListenerUnsubscribe) {
      this.notificationsListenerUnsubscribe();
    }
  }
}
