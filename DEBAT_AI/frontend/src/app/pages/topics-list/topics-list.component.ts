import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Debate } from '../../models';

@Component({
  selector: 'app-topics-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './topics-list.component.html',
  styleUrls: ['./topics-list.component.css']
})
export class TopicsListComponent implements OnInit {
  debates: Debate[] = [];
  username: string = '';

  constructor(private apiService: ApiService, private router: Router) { }

  ngOnInit(): void {
    this.apiService.getDebates().subscribe(data => {
      this.debates = data;
    });

    // Persist username across sessions
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      this.username = storedUsername;
    }
  }

  onUsernameChange(): void {
    localStorage.setItem('username', this.username);
  }

  joinDebate(debateId: number): void {
    if (!this.username.trim()) {
      alert('Please enter a username to join a debate.');
      return;
    }
    this.router.navigate(['/debates', debateId]);
  }
}