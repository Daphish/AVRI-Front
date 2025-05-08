import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EventoEncuestaService {
  private encuestaActivada = new Subject<void>();
  encuestaActivada$ = this.encuestaActivada.asObservable();

  lanzarEncuesta() {
    this.encuestaActivada.next();
  }
}

