import { TestBed } from '@angular/core/testing';
import { firstValueFrom, take } from 'rxjs';
import { EventoEncuestaService } from './evento-encuesta.service';

describe('EventoEncuestaService (trigger only)', () => {
  let service: EventoEncuestaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EventoEncuestaService],
    });
    service = TestBed.inject(EventoEncuestaService);
  });

  it('lanzarEncuesta() emits on encuestaActivada$', async () => {
    const next = firstValueFrom(service.encuestaActivada$.pipe(take(1)));
    service.lanzarEncuesta();
    await next;
    expect(true).toBeTrue();
  });
});
