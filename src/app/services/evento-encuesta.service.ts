// src/app/services/evento-encuesta.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EventoEncuestaService {
  private encuesta$$ = new Subject<void>();
  encuestaActivada$ = this.encuesta$$.asObservable();
  lanzarEncuesta() {
    this.encuesta$$.next();
  }
}
