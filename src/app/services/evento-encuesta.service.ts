// src/app/services/evento-encuesta.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SurveyEventService {
  private survey$$ = new Subject<void>();
  surveyOn$ = this.survey$$.asObservable();
  launchSurvey() {
    this.survey$$.next();
  }
}
