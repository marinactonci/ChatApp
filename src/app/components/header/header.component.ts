import {Component, inject, OnInit} from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDrawerModule } from "ng-zorro-antd/drawer";
import { NzButtonModule} from "ng-zorro-antd/button";
import { NzDropDownModule } from "ng-zorro-antd/dropdown";
import {AuthService} from "../../services/firebaseAuth.service";
import {onAuthStateChanged} from "firebase/auth";
import {Router} from "@angular/router";

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NzIconModule, NzDrawerModule, NzButtonModule, NzDropDownModule],
  providers: [AuthService],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit {
  user: any = {};
  isLoggedIn = false;
  visible = false;

  authService = inject(AuthService);
  router = inject(Router);

  async ngOnInit() {
    const listener = onAuthStateChanged(this.authService.auth, (user) => {
      if (user) {
        this.isLoggedIn = true;
        this.user = user
      } else {
        this.isLoggedIn = false;
        this.user = {};
      }
    });
  }

  open(): void {
    this.visible = true;
  }

  close(): void {
    this.visible = false;
  }

  async handleLogout() {
    await this.authService.logout();
  }
}
