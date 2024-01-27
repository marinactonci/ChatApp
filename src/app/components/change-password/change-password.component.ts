import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../../services/firebaseAuth.service';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    FormsModule,
    NzButtonModule,
    NzModalModule,
    NzInputModule,
    NzIconModule,
  ],
  providers: [AuthService],
  templateUrl: './change-password.component.html',
})
export class ChangePasswordComponent {
  isVisible: boolean = false;

  oldPassword: string = '';
  oldPasswordVisible: boolean = false;

  newPassword: string = '';
  newPasswordVisible: boolean = false;

  confirmPassword: string = '';
  confirmPasswordVisible: boolean = false;

  message = inject(NzMessageService);
  auth = inject(AuthService);

  showModal(): void {
    this.isVisible = true;
  }

  async handleOk() {
    if (this.newPassword !== this.confirmPassword) {
      this.message.create('error', 'Passwords do not match!');
      return;
    }
    const response = await this.auth.changePassword(
      this.oldPassword,
      this.newPassword
    );
    if (response) {
      this.isVisible = false;
    }
  }

  handleCancel(): void {
    this.isVisible = false;
  }
}
