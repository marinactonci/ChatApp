import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ActivatedRoute } from '@angular/router';
import { FirestoreService } from '../../services/firebaseFirestore.service';
import { AuthService } from '../../services/firebaseAuth.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, NzInputModule, NzButtonModule, NzIconModule],
  providers: [FirestoreService, AuthService],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent {
  messages = [];
  messageContent: string = ''
  chatRoomId: string | null = '';

  private route: ActivatedRoute = inject(ActivatedRoute);
  private firestoreService: FirestoreService = inject(FirestoreService);
  private authService: AuthService = inject(AuthService);


  ngOnInit() {
    this.route.params.subscribe(params => {
      this.chatRoomId = params['id'];
      this.loadChatRoomMessages();
    });
  }

  async sendMessage() {
    if (this.chatRoomId && this.messageContent.trim() !== '') {
      try {
        const currentUser = this.authService.auth.currentUser;
  
        if (currentUser) {
          const message = {
            timestamp: new Date(),
            sender: currentUser.uid,
            content: this.messageContent,
          };
  
          const chatRoom = await this.firestoreService.getChatRoom(this.chatRoomId);
  
          if (chatRoom) {
            const updatedMessages = Array.isArray(chatRoom.messages) ? [...chatRoom.messages, message] : [message];
  
            await this.firestoreService.updateChatRoom(this.chatRoomId, {
              messages: updatedMessages,
            });
          } else {
            console.error('Chat room not found!');
          }
        } else {
          console.error('Current user not found!');
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
      this.messageContent = '';
      this.loadChatRoomMessages();
    }
  }

  async loadChatRoomMessages() {
    try {
      if (this.chatRoomId) {
        const chatRoom = await this.firestoreService.getChatRoom(this.chatRoomId);

        if (chatRoom && Array.isArray(chatRoom.messages)) {
          this.messages = chatRoom.messages;
        } else {
          console.error('Chat room or messages not found!');
        }
      }
    } catch (error) {
      console.error('Error loading chat room messages:', error);
    }
  }
}
