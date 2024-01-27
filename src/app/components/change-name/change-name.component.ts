import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
import { AuthService } from '../../services/firebaseAuth.service';

@Component({
  selector: 'app-change-name',
  standalone: true,
  imports: [NzButtonModule, NzModalModule, FormsModule, NzInputModule],
  providers: [AuthService],
  templateUrl: './change-name.component.html',
})
export class ChangeNameComponent {
  isVisible: boolean = false;
  displayName: string = '';

  auth = inject(AuthService);

  showModal(): void {
    this.isVisible = true;
  }

  async handleOk() {
    const response = await this.auth.changeDisplayName(this.displayName);
    if (response) {
      this.isVisible = false;
    }
  }

  handleCancel(): void {
    console.log('Button cancel clicked!');
    this.isVisible = false;
  }
}
