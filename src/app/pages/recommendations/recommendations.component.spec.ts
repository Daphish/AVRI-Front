import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecommendationsComponent } from './recommendations.component';

import { RecommendationService } from '../../services/recommendation.service';
import { RecommendationServiceStub } from '../../../testing/test-stubs';

describe('RecommendationsComponent', () => {
  let component: RecommendationsComponent;
  let fixture: ComponentFixture<RecommendationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecommendationsComponent],
      providers: [{ provide: RecommendationService, useClass: RecommendationServiceStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(RecommendationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
