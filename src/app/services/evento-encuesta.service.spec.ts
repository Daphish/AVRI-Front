import { TestBed } from '@angular/core/testing';
import { firstValueFrom, take } from 'rxjs';
import { SurveyEventService } from './evento-encuesta.service';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('EventoEncuestaService (trigger only)', () => {
  let service: SurveyEventService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SurveyEventService, provideHttpClient(withFetch()), provideHttpClientTesting()],
    });
    service = TestBed.inject(SurveyEventService);
  });

  it('lanzarEncuesta() emits on encuestaActivada$', async () => {
    const next = firstValueFrom(service.surveyOn$.pipe(take(1)));
    service.launchSurvey();
    await next;
    expect(true).toBeTrue();
  });
});
