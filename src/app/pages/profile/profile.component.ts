// src/app/pages/profile/profile.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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

  isLoadingProfile = false;
  isLoadingPreferences = false;
  isLoadingDocuments = false;
  isLoggingOut = false;
  isNavigating = false;

  /* ---------- toast notifications ---------- */
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' = 'error';

  userDisplay: User | null = null;
  isActuallyAnonymous: boolean = true; // For controlling the display
  preferences: String[] = [];
  documents: SavedDocument[] = [];
  profileNeedsSetup: boolean = false;

  // For closing session
  isUserLoggedInAndNotAnonymous$: Observable<boolean> =
    this.authService.currentUser$.pipe(
      map((user) => !!user && !('anonymous_id' in user))
    );

  constructor(private destroyRef: DestroyRef) {}

  /* ---------- Method for showing toast ---------- */
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
    this.isLoadingProfile = true;

    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((currentUser) => {
        if (currentUser && !('anonymous_id' in currentUser)) {
          this.isActuallyAnonymous = false;
          this.userDisplay = currentUser as User;
          this.loadProfileData();
        } else {
          this.isActuallyAnonymous = true;
          this.userDisplay = null;
          this.preferences = ['Inicia sesión para ver y configurar tu perfil.'];
          this.documents = this.getDefaultDocumentsPlaceholder();
          this.isLoadingProfile = false;
        }
      });

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

    this.isLoadingPreferences = true;
    this.isLoadingDocuments = true;

    this.subscriptions.add(
      this.recommendationService.get().subscribe({
        next: (data) => {
          this.isLoadingPreferences = false;
          this.isLoadingProfile = false;

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
          this.isLoadingPreferences = false;
          this.isLoadingProfile = false;

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

    this.subscriptions.add(
      this.documentService.getSavedDocuments().subscribe({
        next: (docs) => {
          if (docs && docs.length > 0) {
            this.documents = docs;
          } else {
            this.documents = this.getDefaultDocumentsPlaceholder();
          }
          this.isLoadingDocuments = false;
        },
        error: () => {
          this.documents = this.getDefaultDocumentsPlaceholder();
          this.isLoadingDocuments = false;
          this.showToastMessage('Error al cargar documentos guardados.');
        },
      })
    );
  }

  async goBack(): Promise<void> {
    this.isNavigating = true;
    try {
      this.authService.profileSetupComplete$.subscribe((isComplete) => {
        if (!isComplete) {
          this.chatService.pendingWizard = true;
        }
      });
      await this.router.navigate(['/home']);
    } finally {
      this.isNavigating = false;
    }
  }

  async showWizard(): Promise<void> {
    this.isNavigating = true;
    try {
      this.chatService.pendingWizard = true;
      await this.router.navigate(['/home']);
    } finally {
      this.isNavigating = false;
    }
  }

  async logout(): Promise<void> {
    this.isLoggingOut = true;
    try {
      this.chatService.clearSessions();
      this.authService.logout();
      await this.router.navigate(['/home']);
      this.showToastMessage('Sesión cerrada correctamente.', 'success');
    } catch (error) {
      this.showToastMessage('Error al cerrar sesión.');
    } finally {
      this.isLoggingOut = false;
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
