import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, filter } from 'rxjs';
import { DocumentService } from '../../services/document.service';

import { RepositoryDocument } from '../../interfaces/document.interface';

@Component({
  selector: 'app-document-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-view.component.html',
  styleUrl: './document-view.component.css'
})
export class DocumentViewComponent implements OnInit, OnDestroy {
  private documentId$$ = new Subject<string>();

  loading = false;
  error: string | null = null;
  document: RepositoryDocument | null = null;

  private destroy$ = new Subject<void>();

  constructor(private documentService: DocumentService) {}

  ngOnInit(): void {
    // Subscribe to repository document changes
    this.documentService.repoDocument$
      .pipe(takeUntil(this.destroy$))
      .subscribe(doc => {
        this.document = doc;
        this.loading = false;
      });

    this.documentService.currentDocumentId$
      .pipe(
        takeUntil(this.destroy$),
        filter(id => !!id)
      )
      .subscribe(id => {
        this.loading = true;
        this.error = null;
        this.documentService.loadRepoDocument(id);
      });
  }

  setDocumentId(id: string): void {
    this.documentId$$.next(id);
  }

  viewInRepository(): void {
    if (this.document?.repository_uri) {
      window.open(this.document.repository_uri, '_blank');
    }
  }

  saveDocument(): void {
    if (this.document?.id) {
      this.documentService.saveDocument(this.document.id)
        .subscribe({
          error: err => console.error('Error saving document:', err)
        });
    }
  }

  unsaveDocument(): void {
    if (this.document?.id) {
      this.documentService.removeSavedDocument(this.document.id)
    }
  }

  claimAsAuthor(): void {
    if (this.document?.id) {
      this.documentService.addAuthoredDocument(this.document.id)
        .subscribe({
          error: err => console.error('Error claiming as author:', err)
        });
    }
  }

  unclaimAsAuthor(): void {
    if (this.document?.id) {
      this.documentService.removeAuthoredDocument(this.document.id)
    }
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.documentId$$.complete();
  }

  saved = false;
  claimed = false;

  toggleSave() {
    if (this.saved) {
      this.saveDocument();
    } else {
      this.unsaveDocument();
    }
    this.saved = !this.saved;
  }

  toggleClaim() {
    if (!this.claimed) {
      this.claimAsAuthor();
    } else {
      this.unclaimAsAuthor();
    }
    this.claimed = !this.claimed;
  }

}
