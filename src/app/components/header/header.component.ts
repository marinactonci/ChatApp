import { Component, inject, OnInit } from "@angular/core";
import { NzIconModule } from "ng-zorro-antd/icon";
import { NzDrawerModule } from "ng-zorro-antd/drawer";
import { NzButtonModule } from "ng-zorro-antd/button";
import { NzDropDownModule } from "ng-zorro-antd/dropdown";
import { AuthService } from "../../services/firebaseAuth.service";
import { onAuthStateChanged } from "firebase/auth";
import { Router } from "@angular/router";
import {FirestoreService} from "../../services/firebaseFirestore.service";
import {NzBadgeModule} from "ng-zorro-antd/badge";
import {NzEmptyComponent} from "ng-zorro-antd/empty";

@Component({
  selector: "app-header",
  standalone: true,
  imports: [NzIconModule, NzDrawerModule, NzButtonModule, NzDropDownModule, NzBadgeModule, NzEmptyComponent],
  providers: [AuthService, FirestoreService],
  templateUrl: "./header.component.html",
})
export class HeaderComponent implements OnInit {
  user: any = {};
  isLoggedIn = false;
  notifications: any[] = [];

  authService = inject(AuthService);
  firestoreService = inject(FirestoreService);
  router = inject(Router);

  async ngOnInit() {
    onAuthStateChanged(this.authService.auth, async (user) => {
      if (user) {
        this.isLoggedIn = true;
        this.user = user;
        this.notifications = await this.firestoreService.getNotifications(user.uid);
      } else {
        this.isLoggedIn = false;
        this.user = {};
      }
    });
  }

  async handleLogout() {
    await this.authService.logout();
  }
}
