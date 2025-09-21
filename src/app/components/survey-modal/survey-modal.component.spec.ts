import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SurveyModalComponent } from './survey-modal.component';

import { ChatService } from '../../services/chat.service';
import { ChatServiceStub } from '../../../testing/test-stubs';

describe('SurveyModalComponent', () => {
  let component: SurveyModalComponent;
  let fixture: ComponentFixture<SurveyModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SurveyModalComponent],
      providers: [{ provide: ChatService, useClass: ChatServiceStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(SurveyModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
