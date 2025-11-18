import { BehaviorSubject, of } from "rxjs";

export class AuthServiceStub {
  currentUser$ = new BehaviorSubject<any>(null);
  isLoggedIn$ = new BehaviorSubject<boolean>(false);
  profileSetupComplete$ = new BehaviorSubject<boolean>(true);
  autoLogin() {
    return Promise.resolve(true);
  }
  login() {
    return Promise.resolve(true);
  }
  logout() {}
  getToken() {
    return null;
  }
}

export class ChatServiceStub {
  idChat$ = new BehaviorSubject<string | null>(null);
  messages$ = new BehaviorSubject<any[]>([]);
  sessions$ = new BehaviorSubject<any[]>([]);
  pendingWizard = false;
  loadSessions() {}
  sendMessage() {
    return of({});
  }
  createSession() {
    return of({});
  }
}

export class DocumentServiceStub {
  document$ = new BehaviorSubject<any | null>(null);
  loadDocument() {
    return of({});
  }
  getDocumentsByIds(ids: string[]) {
    return of([]);
  }
}

export class RecommendationServiceStub {
  documents$ = of([]);
  getDetailedDocuments() {}
}
