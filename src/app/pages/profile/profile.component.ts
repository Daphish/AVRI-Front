import { Component, OnInit } from '@angular/core'; // Agregado OnInit
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
export class ProfileComponent implements OnInit { // Implementado OnInit

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

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if(user) {
        if ('anonymous_id'in user) {
          this.anonymous = true;
        } else {
          this.user = user as User; // Aseguramos el tipo User si no es anónimo
          if(!this.user.field_of_study || this.user.field_of_study === '') {
            this.user.field_of_study = 'Sin estudios previos';
          }
          this.recommendationService.get().subscribe(data => {
            // Asegúrate que data.profile.interests exista y sea un array
            if (data && data.profile && Array.isArray(data.profile.interests)) {
              this.preferences = data.profile.interests;
            } else {
              this.preferences = []; // Inicializa como vacío si no es válido
            }
            // Mueve la lógica de 'Sin preferencias' aquí para que se aplique después de la carga
            if (this.preferences.length === 0) {
              this.preferences = ['Sin preferencias'];
            }
          });
          this.recommendationService.getDocuments().subscribe(documents => {
            this.documents = documents;
            // Mueve la lógica de 'Sin documentos' aquí para que se aplique después de la carga
            if (this.documents.length === 0) {
              this.documents = [{
                id: 'default-doc-0', // CORREGIDO: id como string
                title: 'Sin documentos',
                repository_uri: '',
                repository_id: 'N/A', // AÑADIDO: repository_id (requerido por la interfaz)
                status: 'L'
              }];
            }
          });
          this.anonymous = false;
        }
      } else {
        // Manejar caso donde el usuario es null (ej. al inicio o después de logout)
        this.anonymous = true;
        this.preferences = ['Sin preferencias'];
        this.documents = [{
            id: 'default-doc-0', // CORREGIDO: id como string
            title: 'Sin documentos',
            repository_uri: '',
            repository_id: 'N/A', // AÑADIDO: repository_id
            status: 'L'
          }];
      }
    });
  }

  logout(): void {
    // 1) Limpiar sesiones de chat en memoria (invitado o usuario)
    this.chatService.clearSessions();
    // 2) Cerrar sesión en el AuthService
    this.authService.logout();
    // 3) Redirigir al login
    this.router.navigate(['/home']);
  }
}