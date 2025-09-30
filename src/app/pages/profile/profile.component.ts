// src/app/pages/profile/profile.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { Observable, Subscription, map, take } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { RecommendationService } from '../../services/recommendation.service';
import { User } from '../../interfaces/user.interface';
import {
  DocumentService,
  SavedDocument,
} from '../../services/document.service';

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
  private documentService = inject(DocumentService);
  private router = inject(Router);
  private subscriptions = new Subscription();

  /* ---------- toast notifications ---------- */
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' = 'error';

  userDisplay: User | null = null;
  isActuallyAnonymous: boolean = true; // Usado para controlar la vista
  preferences: String[] = [];
  documents: SavedDocument[] = [];
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
      this.authService.currentUser$.pipe(take(1)).subscribe((currentUser) => {
        if (currentUser && !('anonymous_id' in currentUser)) {
          this.isActuallyAnonymous = false;
          this.userDisplay = currentUser as User;
          this.loadProfileData();
        } else {
          this.isActuallyAnonymous = true;
          this.userDisplay = null;
          this.preferences = ['Inicia sesión para ver y configurar tu perfil.'];
          this.documents = this.getDefaultDocumentsPlaceholder();
        }
      })
    );

    this.subscriptions.add(
      this.authService.profileSetupComplete$
        .subscribe((isComplete) => {
          if (!this.isActuallyAnonymous) {
            this.profileNeedsSetup = !isComplete;
          }
        })
    );
  }

  private getDefaultDocumentsPlaceholder(): SavedDocument[] {
    return [
      {
        id: 'default-doc-placeholder',
        document: {
          id: 'default-doc-placeholder',
          title: 'No hay documentos para mostrar.',
          author: 'Sin autor',
          publication_date: '0',
          knowledge_area: 'Sin área',
          license: 'Sin licencia',
          repository_uri: '',
          repository_id: 'N/A_placeholder',
          status: 'L',
          created_at: '0',
          updated_at: '0',
        },
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
      this.documentService.getSavedDocuments().subscribe((docs) => {
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
