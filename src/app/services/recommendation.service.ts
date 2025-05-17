import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Document } from '../interfaces/document.interface';

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private http = inject(HttpClient);
  private BASE = '/api/recommender';

  get(): Observable<any> {
    return this.http.get<any>(`${this.BASE}/profile/me/`);
  }

  getDocuments(): Observable<Document[]> {
    return this.http.get<Document[]>(`${this.BASE}/serve/`);
  }
}
