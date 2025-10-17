import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Document } from '../interfaces/document.interface';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { DocumentDetail, DocumentService } from './document.service';

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private http = inject(HttpClient);
  private BASE = '/api/recommender';
  private documentService = inject(DocumentService);

  private documents$$ = new BehaviorSubject<DocumentDetail[]>([]);
  readonly documents$ = this.documents$$.asObservable();

  get(): Observable<any> {
    return this.http.get<any>(`${this.BASE}/profile/me/`).pipe(
      catchError((error) => {
        console.warn('Error en get():', error);
        return of(null);
      })
    );
  }

  getDocuments(): Observable<Document[]> {
    return this.http.get<Document[]>(`${this.BASE}/serve/`).pipe(
      catchError((error) => {
        console.warn('Error en getDocuments():', error);
        return of([]);
      })
    );
  }
  getDetailedDocuments(): void {
    this.http.get<{ documents: Document[] }>(`${this.BASE}/serve/`).subscribe((response) => {
      console.log('documents', response.documents);
      const documentIds = response.documents.map((doc) => doc.id);
      this.documentService.getDocumentsByIds(documentIds).subscribe((docs) => {
        this.documents$$.next(docs);
      });
    });
  }
}
