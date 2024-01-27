import { Component, OnInit, inject } from '@angular/core';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { FormsModule } from '@angular/forms';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzInputModule } from 'ng-zorro-antd/input';
import { FirestoreService } from '../../services/firebaseFirestore.service';
import { DocumentData } from 'firebase/firestore';
import { AuthService } from '../../services/firebaseAuth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NzAutocompleteModule, FormsModule, NzListModule, NzInputModule],
  templateUrl: './sidebar.component.html',
  providers: [AuthService, FirestoreService]
})
export class SidebarComponent implements OnInit {
  authService: AuthService = inject(AuthService);
  firestoreService: FirestoreService = inject(FirestoreService);

  inputValue?: string;
  users: DocumentData[] = [];
  friends: DocumentData[] = [];
  filteredUsers: DocumentData[] = [];
  filteredFriends: DocumentData[] = [];

  async ngOnInit() {
    await this.loadUsers();
  }

  async loadUsers() {
    try {
      this.users = await this.firestoreService.getUsers();

      const currentUser = this.authService.auth.currentUser;
      if (currentUser) {
        const currentUserUid = currentUser.uid;

        const friendsUids = await this.firestoreService.getUserFriends(currentUserUid);

        // Exclude the current user and their friends from the users list
        this.users = this.users.filter(user =>
          user['uid'] !== currentUserUid && !friendsUids.includes(user['uid'])
        );
      }

      this.filteredUsers = this.users;
      this.loadFriends();
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }

  async loadFriends() {
    try {
      const user = this.authService.auth.currentUser;
      if (user) {
        const userId = user.uid;

        const friendsUids = await this.firestoreService.getUserFriends(userId);

        this.friends = await this.firestoreService.getUsersByUids(friendsUids);
        this.filteredFriends = this.friends; // Initialize filteredFriends with the full friends list
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  }

  filterUsers(): void {
    const inputValueLowerCase = (this.inputValue || '').toLowerCase();

    // Filter the users based on the input value
    this.filteredUsers = this.users.filter(user =>
      user['displayName'].toLowerCase().includes(inputValueLowerCase)
    );

    // Filter the friends based on the input value
    this.filteredFriends = this.friends.filter(friend =>
      friend['displayName'].toLowerCase().includes(inputValueLowerCase)
    );
  }
}
