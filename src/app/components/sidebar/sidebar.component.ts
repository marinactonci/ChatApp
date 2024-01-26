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
  filteredUsers: any[] = []; 

  ngOnInit(): void {
    this.loadUsers();
  }

  async loadUsers() {
    try {
      this.users = await this.firestoreService.getUsers();
      this.filteredUsers = this.users;
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }

  filterUsers(): void {
    this.filteredUsers = this.users.filter(user =>
      user['displayName'].toLowerCase().includes((this.inputValue || '').toLowerCase())
    );
  }

  async loadFriends() {
    try {
      const user = this.authService.auth.currentUser;
      if (user) {
        const userId = user.uid;
        const friends = await this.firestoreService.getUserFriends(userId);
        
        this.filteredUsers = this.users.filter(user =>
          friends.includes(user['uid'])
        );
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  }
}
