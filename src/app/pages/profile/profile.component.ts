import { Component, inject, OnInit } from '@angular/core';
import { FirestoreService } from '../../services/firebaseFirestore.service';
import { AuthService } from '../../services/firebaseAuth.service';
import {Router, RouterLink} from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { onAuthStateChanged } from 'firebase/auth';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ChangeNameComponent } from '../../components/change-name/change-name.component';
import { ChangePasswordComponent } from '../../components/change-password/change-password.component';
import { ConfirmModalComponent } from '../../components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    NzButtonModule,
    NzIconModule,
    ChangeNameComponent,
    ChangePasswordComponent,
    ConfirmModalComponent,
    RouterLink,
  ],
  providers: [FirestoreService, AuthService],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  user: any;
  provider: string = '';
  isLoggedIn: boolean = false;

  isChangeNameVisible: boolean = false;

  firestore = inject(FirestoreService);
  auth = inject(AuthService);
  router = inject(Router);

  ngOnInit() {
    onAuthStateChanged(this.auth.auth, async (user) => {
      if (user) {
        this.isLoggedIn = true;
        this.user = user;
        if (Array.isArray(user.providerData) && user.providerData.length > 0) {
          this.provider = user.providerData[0].providerId;
        }
      } else {
        this.isLoggedIn = false;
        this.user = {};
        this.provider = '';
      }
    });
  }

  async logout() {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}
