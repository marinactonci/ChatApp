import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { getContent } from './services/firebaseConfig.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'Chat App';
  docData: any;

  async ngOnInit() {
    this.docData = await getContent();
    console.log(this.docData);
  }
}
