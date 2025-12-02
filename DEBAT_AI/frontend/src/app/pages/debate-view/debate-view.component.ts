import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { ApiService } from '../../services/api.service';
import { WebsocketService } from '../../services/websocket.service';
import { Message } from '../../models';

@Component({
  selector: 'app-debate-view',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './debate-view.component.html',
  styleUrls: ['./debate-view.component.css']
})
export class DebateViewComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  messages: Message[] = [];
  newMessageContent: string = '';
  debateId: number = 0;
  username: string = '';
  private wsSubscription!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private websocketService: WebsocketService
  ) { }

  ngOnInit(): void {
    this.username = localStorage.getItem('username') || 'Anonymous';
    
    this.route.paramMap.subscribe(params => {
      this.debateId = Number(params.get('id'));
      if (this.debateId) {
        this.loadInitialMessages();
        this.connectToWebSocket();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    this.websocketService.disconnect();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  loadInitialMessages(): void {
    this.apiService.getMessages(this.debateId).subscribe(data => {
      this.messages = data;
    });
  }

  connectToWebSocket(): void {
    this.wsSubscription = this.websocketService.connect(this.debateId).subscribe({
      next: (message: Message) => {
        // Avoid adding duplicate messages that the sender already has
        if (!this.messages.find(m => m.id === message.id)) {
            this.messages.push(message);
        }
      },
      error: err => console.error('WebSocket error:', err),
      complete: () => console.log('WebSocket connection closed')
    });
  }

  sendMessage(): void {
    if (!this.newMessageContent.trim() || !this.username) {
      return;
    }

    this.apiService.postMessage(this.debateId, this.newMessageContent, this.username)
      .subscribe(message => {
        // Add the message optimistically to the UI
        this.messages.push(message);
        this.newMessageContent = '';
      });
  }

  private scrollToBottom(): void {
    try {
      this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }
}