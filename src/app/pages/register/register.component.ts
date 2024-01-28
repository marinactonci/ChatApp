import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { onAuthStateChanged } from 'firebase/auth';
import { AuthService } from '../../services/firebaseAuth.service';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { FirestoreService } from '../../services/firebaseFirestore.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    NzInputModule,
    NzIconModule,
    FormsModule,
    NzButtonModule,
    NzCheckboxModule,
  ],
  providers: [AuthService, FirestoreService],
  templateUrl: './register.component.html',
})
export class RegisterComponent implements OnInit {
  email = '';

  password = '';
  passwordVisible = false;

  passwordConfirm = '';
  passwordConfirmVisible = false;

  isDisabled = false;

  authService = inject(AuthService);
  router = inject(Router);
  message = inject(NzMessageService);

  async ngOnInit() {
    onAuthStateChanged(this.authService.auth, (user) => {
      this.isDisabled = !!user;
    });
  }

  async handleGoogleLogin() {
    await this.authService.loginWithGoogle();
  }

  async handleGithubLogin() {
    await this.authService.loginWithGithub();
  }

  async handleRegister() {
    if (this.password !== this.passwordConfirm) {
      this.message.create('error', 'Passwords do not match');
      return;
    }

    await this.authService.register(this.email, this.password);
  }
}
