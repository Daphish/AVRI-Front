import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, filter } from 'rxjs';

import {
  DocumentService,
  DocumentDetail,
} from '../../services/document.service';

@Component({
  standalone: true,
  selector: 'app-document-view',
  templateUrl: './document-view.component.html',
  styleUrl: './document-view.component.css',
  imports: [CommonModule],
})
export class DocumentViewComponent implements OnInit, OnDestroy {
  document: DocumentDetail | null = null;
  loading = false;
  error: string | null = null;

  saved = false;
  claimed = false;

  private destroy$ = new Subject<void>();

  constructor(private docs: DocumentService) {}

  /* ---------------- ciclo de vida ---------------- */
  ngOnInit(): void {
    /* Detalle reactivo */
    this.docs.document$.pipe(takeUntil(this.destroy$)).subscribe((doc) => {
      this.document = doc;
      this.loading = false;
    });

    /* Id que llega desde el chat */
    this.docs.currentDocumentId$
      .pipe(
        takeUntil(this.destroy$),
        filter((id) => !!id)
      )
      .subscribe(() => {
        this.loading = true;
        this.error = null;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* ---------------- acciones UI ---------------- */

  viewInRepository(): void {
    if (this.document?.repository_uri) {
      window.open(this.document.repository_uri, '_blank');
    }
  }

  toggleSave(): void {
    if (!this.document) return;

    const id = this.document.id;

    if (this.saved) {
      this.docs.removeSaved(id).subscribe({
        next: () => (this.saved = false),
        error: (e) => console.error('Error unsaving:', e),
      });
    } else {
      this.docs.saveDocument(id).subscribe({
        next: () => (this.saved = true),
        error: (e) => console.error('Error saving:', e),
      });
    }
  }

  toggleClaim(): void {
    if (!this.document) return;

    const id = this.document.id;

    if (this.claimed) {
      this.docs.unclaimDocument(id).subscribe({
        next: () => (this.claimed = false),
        error: (e) => console.error('Error un-claiming:', e),
      });
    } else {
      this.docs.claimDocument(id).subscribe({
        next: () => (this.claimed = true),
        error: (e) => console.error('Error claiming:', e),
      });
    }
  }
}
