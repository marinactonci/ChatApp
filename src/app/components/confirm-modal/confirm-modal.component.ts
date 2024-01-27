import { Component, inject } from '@angular/core';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { AuthService } from '../../services/firebaseAuth.service';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [
    NzModalModule,
    NzButtonModule,
    FormsModule,
    NzIconModule,
    NzInputModule,
  ],
  providers: [AuthService],
  templateUrl: './confirm-modal.component.html',
})
export class ConfirmModalComponent {
  isVisible: boolean = false;

  password: string = '';
  passwordVisible: boolean = false;

  auth = inject(AuthService);

  showModal(): void {
    this.isVisible = true;
  }

  async handleOk() {
    const response = await this.auth.deleteAccount(this.password);
    if (response) {
      this.isVisible = false;
    }
  }

  handleCancel(): void {
    this.isVisible = false;
  }
}
