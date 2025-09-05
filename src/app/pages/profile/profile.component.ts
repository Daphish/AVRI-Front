// src/app/pages/profile/profile.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { Observable, Subscription, map } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { RecommendationService } from '../../services/recommendation.service';
import { User } from '../../interfaces/user.interface';
import { Document } from '../../interfaces/document.interface'; // Asumo que esta interfaz tiene id: string y repository_id: string

@Component({
  selector: 'app-profile',
  standalone: true,
  templateUrl: './profile.component.html',
  imports: [NgIf, NgFor],
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private chatService = inject(ChatService);
  private recommendationService = inject(RecommendationService);
  private router = inject(Router);
  private subscriptions = new Subscription();

  /* ---------- toast notifications ---------- */
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' = 'error';

  userDisplay: User | null = null;
  isActuallyAnonymous: boolean = true; // Usado para controlar la vista
  preferences: String[] = [];
  documents: Document[] = [];
  profileNeedsSetup: boolean = false; // Se actualizará en base a profileSetupComplete$

  // Para el botón de cerrar sesión y otras lógicas de plantilla
  isUserLoggedInAndNotAnonymous$: Observable<boolean> =
    this.authService.currentUser$.pipe(
      map((user) => !!user && !('anonymous_id' in user))
    );

  constructor() {}

  /* ---------- método para mostrar toast ---------- */
  private showToastMessage(
    message: string,
    type: 'success' | 'error' | 'warning' = 'error'
  ) {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 4000);
  }

  ngOnInit() {
    this.subscriptions.add(
      this.authService.currentUser$.subscribe((currentUser) => {
        if (currentUser) {
          if ('anonymous_id' in currentUser) {
            this.isActuallyAnonymous = true;
            this.userDisplay = null;
            this.preferences = [
              'El perfil de preferencias no está disponible para invitados.',
            ];
            this.documents = this.getDefaultDocumentsPlaceholder();
            this.profileNeedsSetup = false; // Anónimos no necesitan wizard de perfilamiento
          } else {
            this.isActuallyAnonymous = false;
            this.userDisplay = currentUser as User;
            if (
              this.userDisplay &&
              (this.userDisplay.field_of_study === undefined ||
                this.userDisplay.field_of_study === '')
            ) {
              this.userDisplay.field_of_study = 'Sin estudios previos';
            }
            this.loadProfileData();
          }
        } else {
          this.isActuallyAnonymous = true;
          this.userDisplay = null;
          this.preferences = ['Inicia sesión para ver y configurar tu perfil.'];
          this.documents = this.getDefaultDocumentsPlaceholder();
          this.profileNeedsSetup = false;
        }
      })
    );

    this.subscriptions.add(
      this.authService.profileSetupComplete$.subscribe((isComplete) => {
        if (!this.isActuallyAnonymous) {
          // Solo para usuarios registrados
          this.profileNeedsSetup = !isComplete;
        }
      })
    );
  }

  private getDefaultDocumentsPlaceholder(): Document[] {
    return [
      {
        id: 'default-doc-placeholder', // Asegurar que coincida con la interfaz Document
        title: 'No hay documentos para mostrar.',
        repository_uri: '',
        repository_id: 'N/A_placeholder', // Obligatorio si la interfaz lo define
        status: 'L',
      },
    ];
  }

  loadProfileData(): void {
    if (this.isActuallyAnonymous || !this.userDisplay) return;

    this.subscriptions.add(
      this.recommendationService.get().subscribe({
        next: (data) => {
          if (
            data?.profile?.interests &&
            Array.isArray(data.profile.interests)
          ) {
            this.preferences =
              data.profile.interests.length > 0
                ? data.profile.interests
                : ['Aún no has configurado tus preferencias.'];
          } else {
            this.preferences = [
              'Configura tus preferencias para mejores recomendaciones.',
            ];
          }
        },
        error: () => {
          this.preferences = [
            'Error al cargar preferencias. Intenta configurar tu perfil.',
          ];
          this.authService.markProfileAsCompleted(false);
          this.showToastMessage(
            'Error al cargar tu perfil. Inténtalo de nuevo.'
          );
        },
      })
    );

    // Este getDocuments es del RecommendationService, asumo que es para historial o similares.
    this.subscriptions.add(
      this.recommendationService.getDocuments().subscribe((docs) => {
        if (docs && docs.length > 0) {
          this.documents = docs;
        } else {
          this.documents = this.getDefaultDocumentsPlaceholder();
        }
      })
    );
  }

  async goBack(): Promise<void> {
    /* Siempre queremos volver a mostrar el wizard */
    this.authService.profileSetupComplete$.subscribe((isComplete) => {
      if (!isComplete) {
        this.chatService.pendingWizard = true;
      }
    });
    await this.router.navigate(['/home']);
  }

  async showWizard(): Promise<void> {
    this.chatService.pendingWizard = true;
    await this.router.navigate(['/home']);
  }

  logout(): void {
    try {
      this.chatService.clearSessions();
      this.authService.logout();
      this.router.navigate(['/home']);
      this.showToastMessage('Sesión cerrada correctamente.', 'success');
    } catch (error) {
      this.showToastMessage('Error al cerrar sesión.');
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
