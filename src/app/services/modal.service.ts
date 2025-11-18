import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ModalService {
  private isModalOpenSubject = new BehaviorSubject<boolean>(false);
  public isModalOpen$: Observable<boolean> =
    this.isModalOpenSubject.asObservable();

  openModal(): void {
    this.isModalOpenSubject.next(true);
  }

  closeModal(): void {
    this.isModalOpenSubject.next(false);
  }

  getIsModalOpen(): boolean {
    return this.isModalOpenSubject.value;
  }
}
