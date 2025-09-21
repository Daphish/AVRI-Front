import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileComponent } from './profile.component';

import { AuthService } from '../../services/auth.service';
import { AuthServiceStub } from '../../../testing/test-stubs';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [{ provide: AuthService, useClass: AuthServiceStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
