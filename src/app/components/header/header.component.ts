import { Component } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDrawerModule } from "ng-zorro-antd/drawer";
import { NzButtonModule} from "ng-zorro-antd/button";

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NzIconModule, NzDrawerModule, NzButtonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  visible = false;

  open(): void {
    this.visible = true;
  }

  close(): void {
    this.visible = false;
  }
}
