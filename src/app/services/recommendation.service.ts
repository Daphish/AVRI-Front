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

  /* getDocuments(): Observable<Document[]> {
    return this.http.get<Document[]>(`${this.BASE}/serve/`).pipe(
      catchError((error) => {
        console.warn('Error en getDocuments():', error);
        return of([]);
      })
    );
  } */
  getDocuments(): void {
    this.http.get<Document[]>(`${this.BASE}/serve/`).subscribe((documents) => {
      const documentIds = documents.map((doc) => doc.id);
      const detailedDocuments: DocumentDetail[] = [];
      this.documentService.getDocumentsByIds(documentIds).subscribe((docs) => {
        detailedDocuments.push(...docs);
      });
      this.documents$$.next(detailedDocuments);
    });
  }
}
