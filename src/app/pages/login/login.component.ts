import { Component, inject, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NzInputModule } from "ng-zorro-antd/input";
import { NzIconModule } from "ng-zorro-antd/icon";
import { AuthService } from "../../services/firebaseAuth.service";
import { Router } from "@angular/router";
import { NzButtonModule } from "ng-zorro-antd/button";
import { NzCheckboxModule } from "ng-zorro-antd/checkbox";
import { onAuthStateChanged } from "firebase/auth";
import {FirestoreService} from "../../services/firebaseFirestore.service";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [
    NzInputModule,
    NzIconModule,
    FormsModule,
    NzButtonModule,
    NzCheckboxModule,
  ],
  providers: [AuthService, FirestoreService],
  templateUrl: "./login.component.html",
})
export class LoginComponent implements OnInit {
  rememberMe = false;
  isDisabled = false;

  email = "";
  password = "";
  passwordVisible = false;

  authService = inject(AuthService);
  router = inject(Router);

  async ngOnInit() {
    onAuthStateChanged(this.authService.auth, (user) => {
      this.isDisabled = !!user;
    });
  }

  async handleGoogleLogin() {
    await this.authService.loginWithGoogle();
  }

  handleGithubLogin() {}

  async handleLogin() {
    await this.authService.login(this.email, this.password, this.rememberMe);
  }
}
