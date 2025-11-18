import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { DocumentViewComponent } from "./document-view.component";
import { provideHttpClient, withFetch } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import {
  DocumentService,
  DocumentDetail,
} from "../../services/document.service";
import { BehaviorSubject, of, throwError } from "rxjs";

// Enhanced service stub for behavior testing
class EnhancedDocumentServiceStub {
  private documentSubject = new BehaviorSubject<DocumentDetail | null>(null);
  document$ = this.documentSubject.asObservable();
  currentDocument: DocumentDetail | null = null;

  saveDocument(id: string) {
    return of({ success: true });
  }

  removeSaved(id: string) {
    return of({ success: true });
  }

  claimDocument(id: string) {
    return of({ success: true });
  }

  unclaimDocument(id: string) {
    return of({ success: true });
  }

  // Test helper methods
  setCurrentDocument(doc: DocumentDetail | null) {
    this.currentDocument = doc;
    this.documentSubject.next(doc);
  }

  emitDocumentError(error: string) {
    this.documentSubject.error(new Error(error));
  }

  setSaveResult(success: boolean) {
    this.saveDocument = success
      ? () => of({ success: true })
      : () => throwError(() => new Error("Save failed"));
  }

  setRemoveResult(success: boolean) {
    this.removeSaved = success
      ? () => of({ success: true })
      : () => throwError(() => new Error("Remove failed"));
  }

  setClaimResult(success: boolean) {
    this.claimDocument = success
      ? () => of({ success: true })
      : () => throwError(() => new Error("Claim failed"));
  }

  setUnclaimResult(success: boolean) {
    this.unclaimDocument = success
      ? () => of({ success: true })
      : () => throwError(() => new Error("Unclaim failed"));
  }
}

describe("DocumentViewComponent", () => {
  let component: DocumentViewComponent;
  let fixture: ComponentFixture<DocumentViewComponent>;
  let documentService: EnhancedDocumentServiceStub;
  let originalWindowOpen: typeof window.open;

  beforeEach(async () => {
    // Mock window.open
    originalWindowOpen = window.open;
    window.open = jasmine.createSpy("windowOpen");

    await TestBed.configureTestingModule({
      imports: [DocumentViewComponent],
      providers: [
        provideRouter([]),
        { provide: DocumentService, useClass: EnhancedDocumentServiceStub },
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentViewComponent);
    component = fixture.componentInstance;
    documentService = TestBed.inject(DocumentService) as any;

    fixture.detectChanges();
  });

  afterEach(() => {
    window.open = originalWindowOpen;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("Component Initialization", () => {
    it("should initialize with default values", () => {
      expect(component.showToast).toBeFalse();
      expect(component.toastMessage).toBe("");
      expect(component.toastType).toBe("error");
      expect(component.document).toBeNull();
      expect(component.loading).toBeFalse();
      expect(component.error).toBeNull();
      expect(component.saved).toBeFalse();
      expect(component.claimed).toBeFalse();
    });

    it("should load current document from service on init", () => {
      const mockDocument: DocumentDetail = {
        id: "doc-1",
        title: "Test Document",
        author: "Test Author",
        publication_date: "2023-01-01",
        knowledge_area: "Computer Science",
        license: "MIT",
        repository_uri: "https://test.com",
        repository_id: "repo-1",
        status: "L",
        created_at: "2023-01-01",
        updated_at: "2023-01-01",
      };

      documentService.setCurrentDocument(mockDocument);
      component.ngOnInit();

      expect(component.document).toEqual(mockDocument);
    });

    it("should subscribe to document$ stream", () => {
      const mockDocument: DocumentDetail = {
        id: "doc-2",
        title: "Stream Document",
        author: "Stream Author",
        publication_date: "2023-01-02",
        knowledge_area: "Information Systems",
        license: "CC BY",
        repository_uri: "https://stream.test",
        repository_id: "stream-repo",
        status: "R",
        created_at: "2023-01-02",
        updated_at: "2023-01-02",
      };

      component.ngOnInit();
      documentService.setCurrentDocument(mockDocument);

      expect(component.document).toEqual(mockDocument);
      expect(component.loading).toBeFalse();
    });

    it("should handle document loading error", () => {
      component.ngOnInit();

      documentService.emitDocumentError("Loading failed");

      expect(component.loading).toBeFalse();
      expect(component.showToast).toBeTrue();
      expect(component.toastMessage).toBe(
        "Error al cargar el documento. Inténtalo de nuevo."
      );
    });
  });

  describe("Repository Viewing", () => {
    it("should open repository URL in new window", () => {
      const mockDocument: DocumentDetail = {
        id: "doc-1",
        title: "Test Doc",
        author: "Test Author",
        publication_date: "2023-01-01",
        knowledge_area: "Computer Science",
        license: "MIT",
        repository_uri: "https://repository.test/doc/1",
        repository_id: "repo-1",
        status: "L",
        created_at: "2023-01-01",
        updated_at: "2023-01-01",
      };
      component.document = mockDocument;

      component.viewInRepository();

      expect(window.open).toHaveBeenCalledWith(
        "https://repository.test/doc/1",
        "_blank"
      );
    });

    it("should show warning when no repository URI", () => {
      const mockDocument: DocumentDetail = {
        id: "doc-1",
        title: "Test Doc",
        author: "Test Author",
        publication_date: "2023-01-01",
        knowledge_area: "Computer Science",
        license: "MIT",
        repository_uri: "",
        repository_id: "repo-1",
        status: "L",
        created_at: "2023-01-01",
        updated_at: "2023-01-01",
      };
      component.document = mockDocument;

      component.viewInRepository();

      expect(window.open).not.toHaveBeenCalled();
      expect(component.showToast).toBeTrue();
      expect(component.toastMessage).toBe(
        "El documento no tiene URL de repositorio disponible."
      );
      expect(component.toastType).toBe("warning");
    });

    it("should handle invalid repository URL", () => {
      const mockDocument: DocumentDetail = {
        id: "doc-1",
        title: "Test Doc",
        author: "Test Author",
        publication_date: "2023-01-01",
        knowledge_area: "Computer Science",
        license: "MIT",
        repository_uri: "invalid-url",
        repository_id: "repo-1",
        status: "L",
        created_at: "2023-01-01",
        updated_at: "2023-01-01",
      };
      component.document = mockDocument;

      component.viewInRepository();

      expect(window.open).not.toHaveBeenCalled();
      expect(component.showToast).toBeTrue();
      expect(component.toastMessage).toBe(
        "No se pudo abrir el enlace del repositorio."
      );
      expect(component.toastType).toBe("error");
    });

    it("should handle null document when viewing repository", () => {
      component.document = null;

      component.viewInRepository();

      expect(window.open).not.toHaveBeenCalled();
      expect(component.showToast).toBeTrue();
      expect(component.toastType).toBe("warning");
    });
  });

  describe("Save/Unsave Functionality", () => {
    let mockDocument: DocumentDetail;

    beforeEach(() => {
      mockDocument = {
        id: "save-doc-1",
        title: "Saveable Document",
        author: "Save Author",
        publication_date: "2023-01-01",
        knowledge_area: "Information Science",
        license: "MIT",
        repository_uri: "https://save.test",
        repository_id: "save-repo",
        status: "L",
        created_at: "2023-01-01",
        updated_at: "2023-01-01",
      };
      component.document = mockDocument;
    });

    it("should save document successfully", () => {
      component.saved = false;
      documentService.setSaveResult(true);
      spyOn(documentService, "saveDocument").and.returnValue(
        of({ success: true })
      );

      component.toggleSave();

      expect(documentService.saveDocument).toHaveBeenCalledWith("save-doc-1");
      expect(component.saved).toBeTrue();
      expect(component.showToast).toBeTrue();
      expect(component.toastMessage).toBe("Documento guardado correctamente.");
      expect(component.toastType).toBe("success");
    });

    it("should unsave document successfully", () => {
      component.saved = true;
      spyOn(documentService, "removeSaved").and.returnValue(
        of({ success: true })
      );

      component.toggleSave();

      expect(documentService.removeSaved).toHaveBeenCalledWith("save-doc-1");
      expect(component.saved).toBeFalse();
      expect(component.showToast).toBeTrue();
      expect(component.toastMessage).toBe("Documento eliminado de guardados.");
      expect(component.toastType).toBe("success");
    });

    it("should handle save error", () => {
      component.saved = false;
      spyOn(documentService, "saveDocument").and.returnValue(
        throwError(() => new Error("Save failed"))
      );

      component.toggleSave();

      expect(component.saved).toBeFalse();
      expect(component.showToast).toBeTrue();
      expect(component.toastMessage).toBe(
        "Error al guardar documento. Inténtalo de nuevo."
      );
      expect(component.toastType).toBe("error");
    });

    it("should handle unsave error", () => {
      component.saved = true;
      spyOn(documentService, "removeSaved").and.returnValue(
        throwError(() => new Error("Unsave failed"))
      );

      component.toggleSave();

      expect(component.saved).toBeTrue();
      expect(component.showToast).toBeTrue();
      expect(component.toastMessage).toBe(
        "Error al eliminar de guardados. Inténtalo de nuevo."
      );
    });

    it("should show warning when no document selected for save", () => {
      component.document = null;

      component.toggleSave();

      expect(component.showToast).toBeTrue();
      expect(component.toastMessage).toBe("No hay documento seleccionado.");
      expect(component.toastType).toBe("warning");
    });
  });

  describe("Claim/Unclaim Functionality", () => {
    let mockDocument: DocumentDetail;

    beforeEach(() => {
      mockDocument = {
        id: "claim-doc-1",
        title: "Claimable Document",
        author: "Claim Author",
        publication_date: "2023-01-01",
        knowledge_area: "Information Science",
        license: "MIT",
        repository_uri: "https://claim.test",
        repository_id: "claim-repo",
        status: "L",
        created_at: "2023-01-01",
        updated_at: "2023-01-01",
      };
      component.document = mockDocument;
    });

    it("should claim document successfully", () => {
      component.claimed = false;
      spyOn(documentService, "claimDocument").and.returnValue(
        of({ success: true })
      );

      component.toggleClaim();

      expect(documentService.claimDocument).toHaveBeenCalledWith("claim-doc-1");
      expect(component.claimed).toBeTrue();
      expect(component.showToast).toBeTrue();
      expect(component.toastMessage).toBe("Documento reclamado correctamente.");
      expect(component.toastType).toBe("success");
    });

    it("should unclaim document successfully", () => {
      component.claimed = true;
      spyOn(documentService, "unclaimDocument").and.returnValue(
        of({ success: true })
      );

      component.toggleClaim();

      expect(documentService.unclaimDocument).toHaveBeenCalledWith(
        "claim-doc-1"
      );
      expect(component.claimed).toBeFalse();
      expect(component.showToast).toBeTrue();
      expect(component.toastMessage).toBe("Documento liberado correctamente.");
      expect(component.toastType).toBe("success");
    });

    it("should handle claim error", () => {
      component.claimed = false;
      spyOn(documentService, "claimDocument").and.returnValue(
        throwError(() => new Error("Claim failed"))
      );

      component.toggleClaim();

      expect(component.claimed).toBeFalse();
      expect(component.showToast).toBeTrue();
      expect(component.toastMessage).toBe(
        "Error al reclamar documento. Inténtalo de nuevo."
      );
    });

    it("should handle unclaim error", () => {
      component.claimed = true;
      spyOn(documentService, "unclaimDocument").and.returnValue(
        throwError(() => new Error("Unclaim failed"))
      );

      component.toggleClaim();

      expect(component.claimed).toBeTrue();
      expect(component.showToast).toBeTrue();
      expect(component.toastMessage).toBe(
        "Error al liberar documento. Inténtalo de nuevo."
      );
    });

    it("should show warning when no document selected for claim", () => {
      component.document = null;

      component.toggleClaim();

      expect(component.showToast).toBeTrue();
      expect(component.toastMessage).toBe("No hay documento seleccionado.");
      expect(component.toastType).toBe("warning");
    });
  });

  describe("Toast Notifications", () => {
    it("should show and auto-hide toast with default error type", fakeAsync(() => {
      component["showToastMessage"]("Test error message");

      expect(component.showToast).toBeTrue();
      expect(component.toastMessage).toBe("Test error message");
      expect(component.toastType).toBe("error");

      tick(4000);

      expect(component.showToast).toBeFalse();
    }));

    it("should show toast with custom type", fakeAsync(() => {
      component["showToastMessage"]("Success message", "success");

      expect(component.showToast).toBeTrue();
      expect(component.toastMessage).toBe("Success message");
      expect(component.toastType).toBe("success");

      tick(4000);

      expect(component.showToast).toBeFalse();
    }));

    it("should show warning toast", () => {
      component["showToastMessage"]("Warning message", "warning");

      expect(component.toastType).toBe("warning");
      expect(component.toastMessage).toBe("Warning message");
    });
  });

  describe("Lifecycle Management", () => {
    it("should complete destroy subject on ngOnDestroy", () => {
      const destroySubject = (component as any).destroy$;
      spyOn(destroySubject, "next");
      spyOn(destroySubject, "complete");

      component.ngOnDestroy();

      expect(destroySubject.next).toHaveBeenCalled();
      expect(destroySubject.complete).toHaveBeenCalled();
    });

    it("should unsubscribe from document$ when destroyed", () => {
      const destroySubject = (component as any).destroy$;
      spyOn(destroySubject, "next");

      component.ngOnInit();
      component.ngOnDestroy();

      expect(destroySubject.next).toHaveBeenCalled();
    });
  });

  describe("Integration Scenarios", () => {
    it("should handle complete document workflow", () => {
      const mockDocument: DocumentDetail = {
        id: "workflow-doc",
        title: "Workflow Document",
        author: "Workflow Author",
        publication_date: "2023-01-01",
        knowledge_area: "Information Science",
        license: "MIT",
        repository_uri: "https://workflow.test",
        repository_id: "workflow-repo",
        status: "L",
        created_at: "2023-01-01",
        updated_at: "2023-01-01",
      };

      // Initial state
      expect(component.document).toBeNull();

      // Load document
      documentService.setCurrentDocument(mockDocument);
      component.ngOnInit();

      expect(component.document).toEqual(mockDocument);

      // Save document
      spyOn(documentService, "saveDocument").and.returnValue(
        of({ success: true })
      );
      component.toggleSave();

      expect(component.saved).toBeTrue();

      // Claim document
      spyOn(documentService, "claimDocument").and.returnValue(
        of({ success: true })
      );
      component.toggleClaim();

      expect(component.claimed).toBeTrue();

      // View in repository
      component.viewInRepository();

      expect(window.open).toHaveBeenCalledWith(
        "https://workflow.test",
        "_blank"
      );
    });

    it("should handle error recovery scenarios", () => {
      const mockDocument: DocumentDetail = {
        id: "error-doc",
        title: "Error Document",
        author: "Error Author",
        publication_date: "2023-01-01",
        knowledge_area: "Information Science",
        license: "MIT",
        repository_uri: "https://error.test",
        repository_id: "error-repo",
        status: "E",
        created_at: "2023-01-01",
        updated_at: "2023-01-01",
      };
      component.document = mockDocument;

      // First save attempt fails
      spyOn(documentService, "saveDocument").and.returnValue(
        throwError(() => new Error("Network error"))
      );
      component.toggleSave();

      expect(component.saved).toBeFalse();
      expect(component.showToast).toBeTrue();

      // Wait for toast to hide
      tick(4000);
      expect(component.showToast).toBeFalse();

      // Second save attempt succeeds
      (documentService.saveDocument as jasmine.Spy).and.returnValue(
        of({ success: true })
      );
      component.toggleSave();

      expect(component.saved).toBeTrue();
      expect(component.toastType).toBe("success");
    });

    it("should handle rapid successive operations", fakeAsync(() => {
      const mockDocument: DocumentDetail = {
        id: "rapid-doc",
        title: "Rapid Operations Document",
        author: "Rapid Author",
        publication_date: "2023-01-01",
        knowledge_area: "Information Science",
        license: "MIT",
        repository_uri: "https://rapid.test",
        repository_id: "rapid-repo",
        status: "L",
        created_at: "2023-01-01",
        updated_at: "2023-01-01",
      };
      component.document = mockDocument;

      spyOn(documentService, "saveDocument").and.returnValue(
        of({ success: true })
      );
      spyOn(documentService, "removeSaved").and.returnValue(
        of({ success: true })
      );

      // Save
      component.toggleSave();
      expect(component.saved).toBeTrue();

      // Immediately unsave
      component.toggleSave();
      expect(component.saved).toBeFalse();

      // Save again
      component.toggleSave();
      expect(component.saved).toBeTrue();

      tick(4000);
      expect(component.showToast).toBeFalse();
    }));
  });

  describe("Edge Cases", () => {
    it("should handle document with special characters in URI", () => {
      const mockDocument: DocumentDetail = {
        id: "special-doc",
        title: "Special Document",
        author: "Special Author",
        publication_date: "2023-01-01",
        knowledge_area: "Information Science",
        license: "MIT",
        repository_uri:
          "https://test.com/docs/título%20español?query=test&lang=es#section1",
        repository_id: "special-repo",
        status: "L",
        created_at: "2023-01-01",
        updated_at: "2023-01-01",
      };
      component.document = mockDocument;

      component.viewInRepository();

      expect(window.open).toHaveBeenCalledWith(
        mockDocument.repository_uri,
        "_blank"
      );
    });

    it("should handle multiple document changes", () => {
      const doc1: DocumentDetail = {
        id: "doc-1",
        title: "First Document",
        author: "First Author",
        publication_date: "2023-01-01",
        knowledge_area: "Information Science",
        license: "MIT",
        repository_uri: "https://first.test",
        repository_id: "first-repo",
        status: "L",
        created_at: "2023-01-01",
        updated_at: "2023-01-01",
      };

      const doc2: DocumentDetail = {
        id: "doc-2",
        title: "Second Document",
        author: "Second Author",
        publication_date: "2023-01-02",
        knowledge_area: "Information Science",
        license: "CC BY",
        repository_uri: "https://second.test",
        repository_id: "second-repo",
        status: "R",
        created_at: "2023-01-02",
        updated_at: "2023-01-02",
      };

      component.ngOnInit();

      // Load first document
      documentService.setCurrentDocument(doc1);
      expect(component.document).toEqual(doc1);

      // Change to second document
      documentService.setCurrentDocument(doc2);
      expect(component.document).toEqual(doc2);

      // Clear document
      documentService.setCurrentDocument(null);
      expect(component.document).toBeNull();
    });

    it("should handle component destruction during async operations", fakeAsync(() => {
      const mockDocument: DocumentDetail = {
        id: "async-doc",
        title: "Async Document",
        author: "Async Author",
        publication_date: "2023-01-01",
        knowledge_area: "Information Science",
        license: "MIT",
        repository_uri: "https://async.test",
        repository_id: "async-repo",
        status: "L",
        created_at: "2023-01-01",
        updated_at: "2023-01-01",
      };
      component.document = mockDocument;

      // Start save operation
      spyOn(documentService, "saveDocument").and.returnValue(
        of({ success: true })
      );
      component.toggleSave();

      // Destroy component before operation completes
      component.ngOnDestroy();

      // Operation should still complete without errors
      tick();
      expect(component.saved).toBeTrue();
    }));
  });
});
