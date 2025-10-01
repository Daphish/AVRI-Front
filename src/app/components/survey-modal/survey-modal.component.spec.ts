import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { BehaviorSubject, Subject } from 'rxjs';

import { SurveyModalComponent } from './survey-modal.component';
import { ChatService } from '../../services/chat.service';
import { EventoEncuestaService } from '../../services/evento-encuesta.service';

/** Minimal stubs to drive the component’s subscriptions/flows */
class ChatServiceStub {
  private _id$ = new BehaviorSubject<string>('');
  idChat$ = this._id$.asObservable();
  emit(id: string) { this._id$.next(id); }
}

class EventoEncuestaServiceStub {
  encuestaActivada$ = new Subject<void>();
  trigger() { this.encuestaActivada$.next(); }
}

describe('SurveyModalComponent (coverage)', () => {
  let fixture: ComponentFixture<SurveyModalComponent>;
  let component: SurveyModalComponent;
  let httpMock: HttpTestingController;
  let encuesta: EventoEncuestaServiceStub;
  let chat: ChatServiceStub;
  let alertSpy: jasmine.Spy<(msg?: any) => void>;
  let originalRandomUUID: any;
  let originalCrypto: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SurveyModalComponent],
      providers: [
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
        { provide: ChatService, useClass: ChatServiceStub },
        { provide: EventoEncuestaService, useClass: EventoEncuestaServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SurveyModalComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    encuesta = TestBed.inject(EventoEncuestaService) as unknown as EventoEncuestaServiceStub;
    chat = TestBed.inject(ChatService) as unknown as ChatServiceStub;

    alertSpy = spyOn(window, 'alert');

    // Keep/prepare crypto.randomUUID variants for the two branches
    originalCrypto = (globalThis as any).crypto;
    if (!originalCrypto) (globalThis as any).crypto = {};
    originalRandomUUID = (globalThis as any).crypto.randomUUID;

    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    // restore crypto
    (globalThis as any).crypto = originalCrypto;
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('opens when encuesta is triggered and takes current session id from ChatService', () => {
    // starts closed
    expect(component.mostrarEncuesta).toBeFalse();
    expect(component.mostrarFormulario).toBeFalse();

    // trigger modal open
    encuesta.trigger();
    expect(component.mostrarEncuesta).toBeTrue();
    expect(component.mostrarFormulario).toBeFalse();

    // update session id
    chat.emit('session-123');
    expect(component.currentSessionId).toBe('session-123');
  });

  it('iniciarEncuesta / volverAtras / cancelarEncuesta / cerrarEncuesta flow resets flags and answers', () => {
    encuesta.trigger();
    component.iniciarEncuesta();
    expect(component.mostrarFormulario).toBeTrue();

    component.volverAtras();
    expect(component.mostrarFormulario).toBeFalse();

    // set some answers to verify reset
    component.respuestas.q1 = 5;
    component.respuestas.q10 = 4;

    component.cancelarEncuesta(); // -> cerrarEncuesta
    expect(component.mostrarEncuesta).toBeFalse();
    expect(component.mostrarFormulario).toBeFalse();
    // answers reset to 0/''?
    for (let i = 1; i <= 10; i++) {
      expect((component.respuestas as any)['q' + i]).toBe(0);
    }
    expect(component.respuestas.comments).toBe('');
  });

  it('enviarEncuesta blocks when some answers are missing (validation path)', () => {
    // all answers default to 0 -> should alert and not call HTTP
    component.enviarEncuesta();

    expect(alertSpy).toHaveBeenCalledWith('Por favor responde todas las preguntas');
    // no requests should have been made
    httpMock.match(() => true).forEach(() => fail('No HTTP call expected'));
  });

  it('enviarEncuesta success: posts payload with Idempotency-Key using crypto.randomUUID()', () => {
    // fill all answers
    for (let i = 1; i <= 10; i++) {
      (component.respuestas as any)['q' + i] = 3;
    }
    component.respuestas.comments = 'Nice app';
    chat.emit('sess-xyz');

    // deterministic UUID branch
    (globalThis as any).crypto.randomUUID = () => 'uuid-fixed-123';

    component.enviarEncuesta();

    const req = httpMock.expectOne(r => r.url === '/api/feedback/');
    expect(req.request.method).toBe('POST');

    // header present and equal to stubbed UUID
    expect(req.request.headers.get('Idempotency-Key')).toBe('uuid-fixed-123');

    // check minimal payload shape
    const body = req.request.body as any;
    expect(body.version).toBe('sus-1.0');
    expect(body.survey?.rating_items?.q1).toBe(3);
    expect(body.survey?.comments).toBe('Nice app');
    expect(body.survey?.meta?.session_id).toBe('sess-xyz');

    req.flush({ ok: true });

    // success alert + modal closed (cerrarEncuesta called)
    expect(alertSpy).toHaveBeenCalledWith('¡Gracias! Tu encuesta ha sido enviada exitosamente.');
    expect(component.mostrarEncuesta).toBeFalse();
    expect(component.mostrarFormulario).toBeFalse();
    // answers reset after close
    for (let i = 1; i <= 10; i++) {
      expect((component.respuestas as any)['q' + i]).toBe(0);
    }
  });

  it('enviarEncuesta error: posts with fallback UUID generator and resets isSubmittingSurvey=false', () => {
    for (let i = 1; i <= 10; i++) {
      (component.respuestas as any)['q' + i] = 4;
    }

    // fallback branch (no randomUUID)
    (globalThis as any).crypto.randomUUID = undefined;

    component.enviarEncuesta();

    const req = httpMock.expectOne(r => r.url === '/api/feedback/');
    const idem = req.request.headers.get('Idempotency-Key');
    expect(!!idem).toBeTrue(); // header exists (value is from fallback generator)

    req.flush({ detail: 'boom' }, { status: 500, statusText: 'Server Error' });

    expect(alertSpy).toHaveBeenCalledWith('Hubo un error al enviar la encuesta. Inténtalo de nuevo.');
    expect(component.isSubmittingSurvey).toBeFalse();
  });
});
