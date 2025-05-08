import { TestBed } from '@angular/core/testing';

import { EventoEncuestaService } from './evento-encuesta.service';

describe('EventoEncuestaService', () => {
  let service: EventoEncuestaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventoEncuestaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
