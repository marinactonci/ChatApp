import { Component } from '@angular/core';
import { SidebarComponent } from "../../components/sidebar/sidebar.component";
import { ChatComponent } from '../../components/chat/chat.component';

@Component({
    selector: 'app-home',
    standalone: true,
    templateUrl: './home.component.html',
    imports: [SidebarComponent, ChatComponent]
})
export class HomeComponent {

}
