import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ActivatedRoute } from '@angular/router';
import { FirestoreService } from '../../services/firebaseFirestore.service';
import { AuthService } from '../../services/firebaseAuth.service';
import { CommonModule } from '@angular/common';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzUploadChangeParam, NzUploadFile } from 'ng-zorro-antd/upload';
import { onSnapshot, doc } from 'firebase/firestore';


@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, NzInputModule, NzButtonModule, NzIconModule, CommonModule, NzUploadModule],
  providers: [FirestoreService, AuthService],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent {
  messages = [];
  messageContent: string = '';
  chatRoomId: string | null = '';

  @ViewChild('bottom') private bottom: ElementRef;
  @ViewChild('chatContainer') private chatContainer: ElementRef;

  fileList: NzUploadFile[] = [];

  private route: ActivatedRoute = inject(ActivatedRoute);
  private firestoreService: FirestoreService = inject(FirestoreService);
  protected authService: AuthService = inject(AuthService);
  private chatRoomSubscription: any;

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.chatRoomId = params['id'];
      this.loadChatRoomMessages();
      this.updateMessageStatus();
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
            status: 'sent'
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
      this.updateMessageStatus();
      this.loadChatRoomMessages();
      await this.scrollToBottom();
    }
  }

  async loadChatRoomMessages() {
    try {
      if (this.chatRoomId) {
        const chatRoomRef = doc(this.firestoreService.chatRoomsCollection, this.chatRoomId);
          this.chatRoomSubscription = onSnapshot(chatRoomRef, (doc) => {
          if (doc.exists()) {
            const chatRoomData = doc.data();

            if (Array.isArray(chatRoomData['messages'])) {
              const senderUids = chatRoomData['messages'].map((message) => message.sender);

              this.firestoreService.getUsersByUids(senderUids)
                .then((senders) => {
                  this.messages = chatRoomData['messages'].map((message) => {
                    const sender = senders.find((user) => user.uid === message.sender);
                    return { ...message, senderDisplayName: sender?.displayName || 'Unknown', senderProfilePicture: sender?.photoURL || 'https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg' };
                  });
                });
            } else {
              console.error('Messages array not found!');
            }
          } else {
            console.error('Chat room not found!');
          }
        });
      }
    } catch (error) {
      console.error('Error loading chat room messages:', error);
    }
  }

  scrollToBottom(): void {
    try {
      this.bottom.nativeElement.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {}
  }

  sendFile(file: File): void {
    const reader = new FileReader();

    reader.onload = (event) => {
      const message = {
        content: event.target.result,
        type: 'file',
        fileName: file.name,
        // Add other properties like sender, timestamp, etc.
      };

      this.messages.push(message);
      this.scrollToBottom();
    };

    reader.readAsDataURL(file);
  }

  handleChange(info: NzUploadChangeParam): void {
    let fileList = [...info.fileList];
    console.log(info.fileList)

    fileList = fileList.slice(-1);

    // 2. Read from response and show file link
    fileList = fileList.map(file => {
      if (file.response) {
        // Component will show file.url as link
        file.url = file.response.url;
      }
      return file;
    });

    this.fileList = fileList;

    for (const file of fileList) {
      if (file.status === 'done') this.sendFile(file.originFileObj);
    }
  }

  async updateMessageStatus() {
    try {
      if (this.chatRoomId) {
        const currentUser = this.authService.auth.currentUser;

        if (currentUser) {
          const chatRoom = await this.firestoreService.getChatRoom(this.chatRoomId);

          if (chatRoom) {
            const updatedMessages = chatRoom.messages.map((message) => {
              // Update status to 'read' for messages sent by other user
              if (message.sender !== currentUser.uid && message.status === 'sent') {
                return { ...message, status: 'read' };
              }
              return message;
            });

            await this.firestoreService.updateChatRoom(this.chatRoomId, {
              messages: updatedMessages,
            });
          } else {
            console.error('Chat room not found!');
          }
        } else {
          console.error('Current user not found!');
        }
      }
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  }

  updateMessageStatusOnInput() {
      this.updateMessageStatus();    
  }

  ngOnDestroy() {
    if (this.chatRoomSubscription) {
      this.chatRoomSubscription();
    }
  }
}
