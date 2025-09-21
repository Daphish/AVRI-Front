import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarComponent } from './sidebar.component';

import { AuthService } from '../../services/auth.service';
import { AuthServiceStub } from '../../../testing/test-stubs';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [{ provide: AuthService, useClass: AuthServiceStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
