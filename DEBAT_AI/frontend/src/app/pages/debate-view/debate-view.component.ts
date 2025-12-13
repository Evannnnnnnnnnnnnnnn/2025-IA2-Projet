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

  // --- NOUVEAUX ÉTATS POUR L'IA ---
  winningIds: string[] = []; // Liste des IDs gagnants (Logique Tweety)
  loadingSuggestionId: number | null = null; // Quel message charge une suggestion ?
  suggestionsMap: { [key: number]: string[] } = {}; // Stocke les suggestions reçues

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
      // Pour l'initialisation, on peut supposer que le dernier message contient l'état actuel
      // ou attendre le prochain event WebSocket.
      // Idéalement, le backend devrait renvoyer winningIds dans le GET initial aussi,
      // mais sinon ça se mettra à jour au premier message reçu.
    });
  }

  connectToWebSocket(): void {
    this.wsSubscription = this.websocketService.connect(this.debateId).subscribe({
      next: (message: Message) => {
        // 1. Mettre à jour la liste globale des gagnants
        if (message.current_winners) {
          // On convertit tout en string pour comparer facilement
          this.winningIds = message.current_winners.map(id => String(id));
        }

        // 2. Ajouter le message s'il n'existe pas déjà
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
      .subscribe(() => {
        this.newMessageContent = '';
      });
  }

  // --- NOUVELLES MÉTHODES ---

  // Vérifie si un message est gagnant (Vert)
  isWinner(msgId: number): boolean {
    return this.winningIds.includes(String(msgId));
  }

  // Appelle l'IA pour avoir des idées
  askForHelp(msgId: number): void {
    this.loadingSuggestionId = msgId;
    this.apiService.getSuggestions(this.debateId, msgId).subscribe({
      next: (resp) => {
        this.suggestionsMap[msgId] = resp.suggestions;
        this.loadingSuggestionId = null;
      },
      error: (err) => {
        console.error(err);
        this.loadingSuggestionId = null;
      }
    });
  }

  private scrollToBottom(): void {
    try {
      this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  switchUser(newUser: string): void {
  this.username = newUser;
  localStorage.setItem('username', newUser);
}
}