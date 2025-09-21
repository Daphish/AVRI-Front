import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DocumentViewComponent } from './document-view.component';

import { DocumentService } from '../../services/document.service';
import { DocumentServiceStub } from '../../../testing/test-stubs';

describe('DocumentViewComponent', () => {
  let component: DocumentViewComponent;
  let fixture: ComponentFixture<DocumentViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentViewComponent],
      providers: [
        provideRouter([]),
        { provide: DocumentService, useClass: DocumentServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
