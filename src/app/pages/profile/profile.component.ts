import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { RecommendationService } from '../../services/recommendation.service';
import { User } from '../../interfaces/user.interface';
import { NgFor, NgIf } from '@angular/common';
import { Document } from '../../interfaces/document.interface';

@Component({
  selector: 'app-profile',
  standalone: true,
  templateUrl: './profile.component.html',
  imports: [NgIf, NgFor],
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent {

  anonymous = true;
  user: User = {
    id: 0,
    email: '',
    password: '',
    name: '',
    first_name: '',
    last_name: '',
    education_level: '',
    field_of_study: '',
  };
  preferences: String[] = [];
  documents: Document[] = [];

  constructor(
    private authService: AuthService,
    private chatService: ChatService,
    private recommendationService: RecommendationService,
    private router: Router
  ) {}
  /** Regresa al chat y dispara el cuestionario */
  goBack(): void {
    this.chatService.pendingWizard = true;   // <-- mostrará wizard al volver
    this.router.navigate(['/home']);
  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if(user) {
        if ('anonymous_id' in user) {
          this.anonymous = true;
        } else {
          this.user = user;
          if(!user.field_of_study || user.field_of_study === '') {
            this.user.field_of_study = 'Sin estudios previos';
          }
          this.recommendationService.get().subscribe(data => {
            this.preferences = data.profile.interests;
          })
          this.recommendationService.getDocuments().subscribe(documents => {
            this.documents = documents;
          });
          this.anonymous = false;
        }
        if (this.preferences.length === 0) {
          this.preferences = ['Sin preferencias'];
        }
        if (this.documents.length === 0) {
          this.documents = [{
            id: 0,
            title: 'Sin documentos',
            repository_uri: '',
            status: 'L'
          }];
        }
      }
    })
  }

  logout(): void {
    this.chatService.clearSessions();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
