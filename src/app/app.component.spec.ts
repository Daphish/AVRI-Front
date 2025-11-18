import { TestBed } from "@angular/core/testing";
import { AppComponent } from "./app.component";
import { provideRouter } from "@angular/router";
import { provideHttpClient, withFetch } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { AuthService } from "./services/auth.service";
import { ChatService } from "./services/chat.service";
import { DocumentService } from "./services/document.service";
import { RecommendationService } from "./services/recommendation.service";

import {
  AuthServiceStub,
  ChatServiceStub,
  DocumentServiceStub,
  RecommendationServiceStub,
} from "../testing/test-stubs";

describe("AppComponent", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: ChatService, useClass: ChatServiceStub },
        { provide: DocumentService, useClass: DocumentServiceStub },
        { provide: RecommendationService, useClass: RecommendationServiceStub },
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it("should create the app", () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it("should render the shell (has a router-outlet)", () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector("router-outlet")).toBeTruthy();
  });
});
