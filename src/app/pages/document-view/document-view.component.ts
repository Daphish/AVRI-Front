import { Component, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Subject, takeUntil, filter } from "rxjs";

import {
  DocumentService,
  DocumentDetail,
} from "../../services/document.service";
import { AuthService } from "../../services/auth.service";

@Component({
  standalone: true,
  selector: "app-document-view",
  templateUrl: "./document-view.component.html",
  styleUrl: "./document-view.component.css",
  imports: [CommonModule],
})
export class DocumentViewComponent implements OnInit, OnDestroy {
  /* ---------- toast notifications ---------- */
  showToast = false;
  toastMessage = "";
  toastType: "success" | "error" | "warning" = "error";

  document: DocumentDetail | null = null;
  loading = false;
  error: string | null = null;

  is_author = false;

  saved = false;
  claimed = false;

  savingDocument = false;
  claimingDocument = false;

  private destroy$ = new Subject<void>();

  constructor(
    private docs: DocumentService,
    private auth: AuthService
  ) {}

  /* ---------- method for showing toast ---------- */
  private showToastMessage(
    message: string,
    type: "success" | "error" | "warning" = "error"
  ) {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 4000);
  }

  /* ---------------- life cycle ---------------- */
  ngOnInit(): void {
    this.document = this.docs.currentDocument;
    this.loading = false;

    this.auth.currentUser$.subscribe((user: any) => {
      if (!user) {
        this.is_author = false;
        return;
      }
      // Anonymous user
      if ("anonymous_id" in user) {
        this.is_author = false;
      }
      // Staff/autor flags if present
      if ("is_author" in user) this.is_author = !!user.is_author;
    });

    this.docs.document$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (doc) => {
        this.document = doc;
        this.loading = false;
      },
      error: (error) => {
        console.error("Error cargando documento:", error);
        this.loading = false;
        this.showToastMessage(
          "Error al cargar el documento. Inténtalo de nuevo."
        );
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* ---------------- UI actions ---------------- */

  viewInRepository(): void {
    try {
      if (this.document?.repository_uri) {
        // validate URL before opening
        const url = new URL(this.document.repository_uri);
        window.open(this.document.repository_uri, "_blank");
      } else {
        this.showToastMessage(
          "El documento no tiene URL de repositorio disponible.",
          "warning"
        );
      }
    } catch (error) {
      console.error("Error abriendo repositorio:", error);
      this.showToastMessage(
        "No se pudo abrir el enlace del repositorio.",
        "error"
      );
    }
  }

  toggleSave(): void {
    if (!this.document) {
      this.showToastMessage("No hay documento seleccionado.", "warning");
      return;
    }

    this.savingDocument = true;

    const id = this.document.id;

    if (this.saved) {
      this.docs.removeSaved(id).subscribe({
        next: () => {
          this.saved = false;
          this.savingDocument = false;
          this.showToastMessage("Documento eliminado de guardados.", "success");
        },
        error: (e) => {
          console.error("Error unsaving:", e);
          this.savingDocument = false;
          this.showToastMessage(
            "Error al eliminar de guardados. Inténtalo de nuevo."
          );
        },
      });
    } else {
      this.docs.saveDocument(id).subscribe({
        next: () => {
          this.saved = true;
          this.savingDocument = false;
          this.showToastMessage("Documento guardado correctamente.", "success");
        },
        error: (e) => {
          console.error("Error saving:", e);
          this.savingDocument = false;
          this.showToastMessage(
            "Error al guardar documento. Inténtalo de nuevo."
          );
        },
      });
    }
  }

  toggleClaim(): void {
    if (!this.document) {
      this.showToastMessage("No hay documento seleccionado.", "warning");
      return;
    }

    this.savingDocument = true;
    const id = this.document.id;

    if (this.claimed) {
      this.docs.unclaimDocument(id).subscribe({
        next: () => {
          this.claimed = false;
          this.savingDocument = false;
          this.showToastMessage("Documento liberado correctamente.", "success");
        },
        error: (e) => {
          console.error("Error un-claiming:", e);
          this.savingDocument = false;
          this.showToastMessage(
            "Error al liberar documento. Inténtalo de nuevo."
          );
        },
      });
    } else {
      this.docs.claimDocument(id).subscribe({
        next: () => {
          this.claimed = true;
          this.savingDocument = false;
          this.showToastMessage(
            "Documento reclamado correctamente.",
            "success"
          );
        },
        error: (e) => {
          console.error("Error claiming:", e);
          this.savingDocument = false;
          this.showToastMessage(
            "Error al reclamar documento. Inténtalo de nuevo."
          );
        },
      });
    }
  }
}
