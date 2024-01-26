import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputDirective } from 'ng-zorro-antd/input';
import { getContent } from "./services/firebaseFirestore.service";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    NzButtonModule,
    NzInputDirective,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  isCollapsed = false;

  async ngOnInit() {
    const response = await getContent()
    console.log(response);
  }
}
