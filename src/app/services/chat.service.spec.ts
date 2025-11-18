import { TestBed, fakeAsync, tick } from "@angular/core/testing";
import { provideHttpClient, withFetch } from "@angular/common/http";
import {
  provideHttpClientTesting,
  HttpTestingController,
} from "@angular/common/http/testing";
import { of } from "rxjs";
import { take } from "rxjs/operators";

import { ChatService } from "./chat.service";
import { AuthService } from "./auth.service";
import { DocumentService, DocumentDetail } from "./document.service";

/** Helper to build a full DocumentDetail object that satisfies your typings */
function makeDoc(id: string): DocumentDetail {
  return {
    id,
    title: `Doc ${id}`,
    author: "Author",
    publication_date: "2024-01-01",
    knowledge_area: "Area",
    license: "MIT",
    repository_uri: `https://repo/${id}`,
    repository_id: `r-${id}`,
    status: "L",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  };
}

class DocServiceMock {
  calls: string[][] = [];
  getDocumentsByIds(ids: string[]) {
    this.calls.push(ids);
    const unique = Array.from(new Set(ids));
    return of(unique.map(makeDoc));
  }
}

describe("ChatService — extra coverage", () => {
  let service: ChatService;
  let http: HttpTestingController;
  let docMock: DocServiceMock;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    docMock = new DocServiceMock();
    authSpy = jasmine.createSpyObj<AuthService>("AuthService", [
      "markProfileAsCompleted",
    ]);

    TestBed.configureTestingModule({
      providers: [
        ChatService,
        { provide: DocumentService, useValue: docMock },
        { provide: AuthService, useValue: authSpy },
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ChatService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  /* ---------------------- tiny helpers ---------------------- */

  function expectOneUrlPart(part: string) {
    return http.expectOne((r) => r.url.includes(part));
  }

  /* ---------------------- clearIdChat() ---------------------- */

  it("clearIdChat(): clears id and messages", (done) => {
    service.clearIdChat();

    service.idChat$.pipe(take(1)).subscribe((id) => {
      expect(id).toBe("");
      service.messages$.pipe(take(1)).subscribe((msgs) => {
        expect(msgs).toEqual([]);
        done();
      });
    });
  });

  /* ---------------------- createSession() default branch ---------------------- */

  it('createSession() without name uses default "Chat sin título" and updates state', (done) => {
    service.createSession().subscribe((session) => {
      expect(session.session_name).toBe("Chat sin título");

      service.idChat$.pipe(take(1)).subscribe((id) => {
        expect(id).toBe("s-new-default");
        service.sessions$.pipe(take(1)).subscribe((arr) => {
          expect(arr.length).toBe(1);
          expect(arr[0].session_id).toBe("s-new-default");
          service.messages$.pipe(take(1)).subscribe((msgs) => {
            expect(msgs).toEqual([]); // no auto message
            done();
          });
        });
      });
    });

    const post = expectOneUrlPart("/api/chat/");
    expect(post.request.method).toBe("POST");
    expect(post.request.body).toEqual({ session_name: "Chat sin título" });
    post.flush({
      session_id: "s-new-default",
      session_name: "Chat sin título",
    });
  });

  /* ---------------------- deleteSession() active-session path ---------------------- */

  it("deleteSession(): removes session and clears active id/messages if deleting current", (done) => {
    // Seed sessions
    service.loadSessions();
    const load = expectOneUrlPart("/api/chat/");
    load.flush([
      { session_id: "s-del", session_name: "To Delete" },
      { session_id: "s-keep", session_name: "Keep" },
    ]);

    // Make s-del active (this also fires a GET)
    service.loadMessages("s-del");
    const getMsgs = expectOneUrlPart("/api/chat/s-del/");
    getMsgs.flush({ messages: [] });

    // Delete s-del
    service.deleteSession("s-del");
    const del = expectOneUrlPart("/api/chat/s-del/");
    expect(del.request.method).toBe("DELETE");
    del.flush({});

    // Assert
    service.sessions$.pipe(take(1)).subscribe((arr) => {
      expect(arr.some((s) => s.session_id === "s-del")).toBeFalse();
      service.idChat$.pipe(take(1)).subscribe((id) => {
        expect(id).toBe(""); // cleared
        service.messages$.pipe(take(1)).subscribe((msgs) => {
          expect(msgs).toEqual([]);
          done();
        });
      });
    });
  });

  /* ---------------------- loadMessages() branch shapes + ref mapping ---------------------- */

  it("loadMessages(): handles { data[0].messages } shape, content cleanup and chunk refs", fakeAsync(() => {
    // Put the session in the list so "reorder" path runs
    service.loadSessions();
    const sess = expectOneUrlPart("/api/chat/");
    sess.flush([{ session_id: "s-1", session_name: "One" }]);

    // Trigger load
    service.loadMessages("s-1");
    const req = expectOneUrlPart("/api/chat/s-1/");
    expect(req.request.method).toBe("GET");

    // Respond using the alt "data[0].messages" shape + reference.chunks
    req.flush({
      data: [
        {
          messages: [
            {
              role: "assistant",
              content: "Hello ##12$$  ",
              reference: {
                chunks: [
                  { document_id: "d1" },
                  { document_id: "d2" },
                  { document_id: "d1" },
                ],
              },
            },
          ],
        },
      ],
    });

    // Let inner documentService subscription push docs into the captured array
    tick();

    service.messages$.pipe(take(1)).subscribe((msgs) => {
      expect(msgs.length).toBe(1);
      expect(msgs[0].text).toBe("Hello");
      expect(msgs[0].references?.length).toBe(2);
      expect(docMock.calls[docMock.calls.length - 1]).toEqual(["d1", "d2"]);
    });
  }));

  it('loadMessages(): handles reference provided as an array and reads "answer" field', fakeAsync(() => {
    service.loadMessages("s-2");
    const req = expectOneUrlPart("/api/chat/s-2/");
    req.flush({
      messages: [
        {
          role: "assistant",
          answer: "Answer ##99$$",
          reference: [
            { document_id: "x1" },
            { document_id: "x1" },
            { document_id: "x2" },
          ],
        },
      ],
    });

    tick();

    service.messages$.pipe(take(1)).subscribe((msgs) => {
      expect(msgs[0].text).toBe("Answer");
      expect(msgs[0].references?.length).toBe(2);
      expect(docMock.calls[docMock.calls.length - 1]).toEqual(["x1", "x2"]);
    });
  }));

  it("loadMessages(): falls back to empty list when no messages present", (done) => {
    service.loadMessages("s-empty");
    const req = expectOneUrlPart("/api/chat/s-empty/");
    req.flush({ data: [] }); // neither data[0].messages nor messages
    service.messages$.pipe(take(1)).subscribe((msgs) => {
      expect(msgs).toEqual([]);
      done();
    });
  });

  /* ---------------------- sendMessage(): else-branch (no spinner present) ---------------------- */

  it("sendMessage(): if loading message is missing, pushes reply (covers else path)", (done) => {
    // Start a send...
    service.sendMessage("s-else", "Hi");

    // ...but clear state before the HTTP returns, removing the spinner
    service.clearSessions();

    const post = expectOneUrlPart("/api/chat/s-else/ask");
    expect(post.request.method).toBe("POST");
    post.flush({
      data: {
        answer: "Ok!",
        reference: {
          chunks: [
            { document_id: "a" },
            { document_id: "b" },
            { document_id: "a" },
          ],
        },
      },
    });

    service.messages$.pipe(take(1)).subscribe((msgs) => {
      // We should still have the assistant reply despite having no spinner to replace
      const reply = msgs.find((m) => !m.fromUser && !m.isLoading);
      expect(reply).toBeTruthy();
      done();
    });
  });

  /* ---------------------- getProfile() + submitProfile() flows ---------------------- */

  it("getProfile(): GETs /recommender/profile/me/", (done) => {
    service.getProfile().subscribe((res) => {
      expect(res).toEqual({ ok: true });
      done();
    });

    const get = expectOneUrlPart("/api/recommender/profile/me");
    expect(get.request.method).toBe("GET");
    get.flush({ ok: true });
  });

  it("submitProfile(): PATCH path → marks completed=true", (done) => {
    service.submitProfile(["ai"], ["Doc A"]).subscribe((res) => {
      expect(authSpy.markProfileAsCompleted).toHaveBeenCalledWith(true);
      expect(res).toEqual({ patched: true });
      done();
    });

    const get = expectOneUrlPart("/api/recommender/profile/me");
    get.flush({ exists: true });

    const patch = expectOneUrlPart("/api/recommender/profile/me");
    expect(patch.request.method).toBe("PATCH");
    expect(patch.request.body).toEqual({
      profile: { interests: ["ai"], document_titles: ["Doc A"] },
    });
    patch.flush({ patched: true });
  });

  it("submitProfile(): PATCH fails → POST create path → marks completed=false", (done) => {
    service.submitProfile(["ml"], ["Doc B"]).subscribe((res) => {
      expect(authSpy.markProfileAsCompleted).toHaveBeenCalledWith(false);
      expect(res).toEqual({ created: true });
      done();
    });

    const get = expectOneUrlPart("/api/recommender/profile/me");
    get.flush({ exists: true });

    const patch = expectOneUrlPart("/api/recommender/profile/me");
    patch.flush({ oops: true }, { status: 400, statusText: "Bad Request" });

    const post = expectOneUrlPart("/api/recommender/profile/create");
    expect(post.request.method).toBe("POST");
    expect(post.request.body).toEqual({
      profile: { interests: ["ml"], document_titles: ["Doc B"] },
    });
    post.flush({ created: true });
  });

  it("submitProfile(): PATCH fails and POST also fails → surfaces error", (done) => {
    service.submitProfile(["ds"], ["Doc C"]).subscribe({
      next: () => fail("should error"),
      error: (err) => {
        expect(err.status).toBe(500);
        done();
      },
    });

    const get = expectOneUrlPart("/api/recommender/profile/me");
    get.flush({ exists: true });

    const patch = expectOneUrlPart("/api/recommender/profile/me");
    patch.flush({ oops: true }, { status: 400, statusText: "Bad Request" });

    const post = expectOneUrlPart("/api/recommender/profile/create");
    post.flush({ boom: true }, { status: 500, statusText: "Server Error" });
  });
});
