import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { getContent } from './services/firebaseFirestore.service';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { FooterComponent } from './components/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, FooterComponent],
})
export class AppComponent implements OnInit {
  title = 'Chat App';
  docData: any;

  async ngOnInit() {
    this.docData = await getContent();
    console.log(this.docData);
  }
}
