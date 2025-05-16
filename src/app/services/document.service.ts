import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  tap,
} from 'rxjs';

/* ------------ modelos ------------ */
export interface DocumentDetail {
  id: string;
  title: string;
  author: string;
  publication_date: string;
  knowledge_area: string;
  license: string;
  repository_uri: string;
  repository_id: string;
  status: 'L' | 'R' | 'E';
  created_at: string;
  updated_at: string;
}

export interface SavedDocument    { id: string; document: DocumentDetail; }
export interface AuthoredDocument { id: string; document: DocumentDetail; }

/* ================================== */
@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly api = '/api/documents';

  /* ---- documento activo ---- */
  private currentId$$ = new BehaviorSubject<string | null>(null);
  readonly currentDocumentId$ = this.currentId$$.asObservable();

  private detail$$ = new BehaviorSubject<DocumentDetail | null>(null);
  readonly document$ = this.detail$$.asObservable();

  constructor(private http: HttpClient) {}

  setCurrentDocumentId(id: string): void {
    this.currentId$$.next(id);
    this.loadDocument(id).subscribe();
  }

  /** GET /api/documents/{id}/ */
  loadDocument(id: string): Observable<DocumentDetail> {
    return this.http
      .get<DocumentDetail>(`${this.api}/${id}/`)
      .pipe(tap(d => this.detail$$.next(d)));
  }

  /* ---- guardados ---- */
  saveDocument(id: string)   : Observable<SavedDocument> {
    return this.http.post<SavedDocument>(`${this.api}/saved/add/${id}/`, {});
  }
  removeSaved(id: string)    : Observable<void> {
    return this.http.delete<void>(`${this.api}/saved/delete/${id}/`);
  }

  /* ---- autoría ---- */
  claimDocument(id: string)  : Observable<AuthoredDocument> {
    return this.http.post<AuthoredDocument>(`${this.api}/authored/add/${id}/`, {});
  }
  unclaimDocument(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/authored/delete/${id}/`);
  }

  /* opcional: limpiar al logout */
  clear(): void {
    this.currentId$$.next(null);
    this.detail$$.next(null);
  }
}
