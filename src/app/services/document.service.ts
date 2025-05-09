import { Injectable, inject } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap }                from 'rxjs/operators';
import {
  Document,
  DocumentDetail,
  RepositoryDocument,
  SavedDocument,
  AuthoredDocument,
} from '../interfaces/document.interface';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private http      = inject(HttpClient);
  private BASE_URL  = '/api/documents';

  // Add this to your DocumentService
  private currentDocumentId$$ = new BehaviorSubject<string>('');
  readonly currentDocumentId$ = this.currentDocumentId$$.asObservable();

  setCurrentDocumentId(id: string): void {
    this.currentDocumentId$$.next(id);
  }

  // — Documents —
  private documents$$ = new BehaviorSubject<Document[]>([]);
  readonly documents$ = this.documents$$.asObservable();

  /** Load all documents */
  loadDocuments(): void {
    this.http.get<Document[]>(`${this.BASE_URL}/`)
      .subscribe(list => this.documents$$.next(list));
  }

  // — Document Detail —
  private currentDocument$$ = new BehaviorSubject<DocumentDetail | null>(null);
  readonly currentDocument$ = this.currentDocument$$.asObservable();

  /** Load specific document details */
  loadDocument(id: string): void {
    this.http.get<DocumentDetail>(`${this.BASE_URL}/${id}/`)
      .subscribe(doc => this.currentDocument$$.next(doc));
  }

  // — Repository Documents —
  private repoDocument$$ = new BehaviorSubject<RepositoryDocument | null>(null);
  readonly repoDocument$ = this.repoDocument$$.asObservable();

  /** Load repository document */
  loadRepoDocument(id: string): void {
    this.http.get<RepositoryDocument>(`${this.BASE_URL}/${id}/repository/`)
      .subscribe(doc => this.repoDocument$$.next(doc));
  }

  // — Saved Documents —
  private savedDocuments$$ = new BehaviorSubject<SavedDocument[]>([]);
  readonly savedDocuments$ = this.savedDocuments$$.asObservable();

  /** Load saved documents */
  loadSavedDocuments(): void {
    this.http.get<SavedDocument[]>(`${this.BASE_URL}/saved/list/`)
      .subscribe(list => this.savedDocuments$$.next(list));
  }

  /** Save a document */
  saveDocument(id: string): Observable<SavedDocument> {
    return this.http.post<SavedDocument>(`${this.BASE_URL}/saved/add/${id}/`, {})
      .pipe(
        tap(savedDoc => {
          this.savedDocuments$$.next([...this.savedDocuments$$.value, savedDoc]);
        })
      );
  }

  /** Remove saved document */
  removeSavedDocument(id: string): void {
    this.http.delete<void>(`${this.BASE_URL}/saved/delete/${id}/`)
      .subscribe(() => {
        const updated = this.savedDocuments$$.value.filter(d => d.document.id !== id);
        this.savedDocuments$$.next(updated);
      });
  }

  // — Authored Documents —
  private authoredDocuments$$ = new BehaviorSubject<AuthoredDocument[]>([]);
  readonly authoredDocuments$ = this.authoredDocuments$$.asObservable();

  /** Load authored documents */
  loadAuthoredDocuments(): void {
    this.http.get<AuthoredDocument[]>(`${this.BASE_URL}/authored/list/`)
      .subscribe(list => this.authoredDocuments$$.next(list));
  }

  /** Add authored document */
  addAuthoredDocument(id: string): Observable<AuthoredDocument> {
    return this.http.post<AuthoredDocument>(`${this.BASE_URL}/authored/add/${id}/`, {})
      .pipe(
        tap(authoredDoc => {
          this.authoredDocuments$$.next([...this.authoredDocuments$$.value, authoredDoc]);
        })
      );
  }

  /** Remove authored document */
  removeAuthoredDocument(id: string): void {
    this.http.delete<void>(`${this.BASE_URL}/authored/delete/${id}/`)
      .subscribe(() => {
        const updated = this.authoredDocuments$$.value.filter(d => d.document.id !== id);
        this.authoredDocuments$$.next(updated);
      });
  }

  /** Clear all document data (for logout) */
  clearDocuments(): void {
    this.documents$$.next([]);
    this.currentDocument$$.next(null);
    this.repoDocument$$.next(null);
    this.savedDocuments$$.next([]);
    this.authoredDocuments$$.next([]);
  }
}
