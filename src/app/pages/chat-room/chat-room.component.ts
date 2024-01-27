import { Component } from '@angular/core';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { ChatComponent } from '../../components/chat/chat.component';

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [SidebarComponent, ChatComponent],
  templateUrl: './chat-room.component.html',
  styleUrl: './chat-room.component.css'
})
export class ChatRoomComponent {

}
