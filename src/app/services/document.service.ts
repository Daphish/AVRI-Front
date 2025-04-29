import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Document,
  DocumentDetail,
  SavedDocument,
  AuthoredDocument
} from '../interfaces/document.interface'

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private http = inject(HttpClient);
  private BASE = '/api/documents';

  getAll(): Observable<Document[]> {
    return this.http.get<Document[]>(`${this.BASE}/`);
  }

  getById(id: number): Observable<DocumentDetail> {
    return this.http.get<DocumentDetail>(`${this.BASE}/${id}/`);
  }

  getSaved(): Observable<SavedDocument[]> {
    return this.http.get<SavedDocument[]>(`${this.BASE}/saved/list/`);
  }

  save(id: number): Observable<SavedDocument> {
    return this.http.post<SavedDocument>(
      `${this.BASE}/saved/add/${id}/`,
      {}
    );
  }

  removeSaved(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.BASE}/saved/delete/${id}/`
    );
  }

  getAuthored(): Observable<AuthoredDocument[]> {
    return this.http.get<AuthoredDocument[]>(
      `${this.BASE}/authored/list/`
    );
  }

  addAuthored(id: number): Observable<AuthoredDocument> {
    return this.http.post<AuthoredDocument>(
      `${this.BASE}/authored/add/${id}/`,
      {}
    );
  }

  removeAuthored(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.BASE}/authored/delete/${id}/`
    );
  }
}
