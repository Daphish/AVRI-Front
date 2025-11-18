import { Component } from "@angular/core";
import { NgIf, AsyncPipe } from "@angular/common";
import { Router } from "@angular/router";
import { Observable } from "rxjs";
import { AuthService } from "../../services/auth.service";
import { SurveyEventService } from "../../services/evento-encuesta.service";
import { ChatService } from "../../services/chat.service";
import { ModalService } from "../../services/modal.service";

@Component({
  selector: "app-header",
  standalone: true,
  imports: [NgIf, AsyncPipe],
  templateUrl: "./header.component.html",
  styleUrl: "./header.component.css",
})
export class HeaderComponent {
  is_author = false;
  is_staff = false;
  isModalOpen$: Observable<boolean>;

  constructor(
    private auth: AuthService,
    private router: Router,
    private survey: SurveyEventService,
    private chatService: ChatService,
    private modalService: ModalService
  ) {
    this.isModalOpen$ = this.modalService.isModalOpen$;
  }

  ngOnInit() {
    this.auth.currentUser$.subscribe((user: any) => {
      if (!user) {
        this.is_author = false;
        this.is_staff = false;
        return;
      }
      // Anonymous user
      if ("anonymous_id" in user) {
        this.is_author = false;
        this.is_staff = false;
      }
      // Staff/autor flags if present
      if ("is_staff" in user) this.is_staff = !!user.is_staff;
      if ("is_author" in user) this.is_author = !!user.is_author;
    });
  }

  viewFYP() {
    this.router.navigate(["/fyp"]);
  }

  openSurvey() {
    this.survey.launchSurvey();
  }

  async closeSession(): Promise<void> {
    try {
      this.chatService.clearSessions();
      this.auth.logout();
      await this.router.navigate(["/home"]);
    } catch (error) {
      console.error("Error closing session:", error);
    }
  }
}
