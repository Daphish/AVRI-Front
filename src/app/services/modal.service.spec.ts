import { TestBed } from "@angular/core/testing";
import { ModalService } from "./modal.service";

describe("ModalService", () => {
  let service: ModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModalService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("Modal State Management", () => {
    it("should initialize with modal closed", () => {
      expect(service.getIsModalOpen()).toBeFalse();
    });

    it("should open modal and emit state change", (done) => {
      let callCount = 0;
      service.isModalOpen$.subscribe((isOpen) => {
        callCount++;
        if (callCount === 2) {
          // Second emission (after modal opens)
          expect(isOpen).toBeTrue();
          done();
        }
      });

      service.openModal();
    });

    it("should close modal and emit state change", (done) => {
      // First open the modal
      service.openModal();

      // Then test closing
      let callCount = 0;
      service.isModalOpen$.subscribe((isOpen) => {
        callCount++;
        if (callCount === 2) {
          // Second emission (after modal closes)
          expect(isOpen).toBeFalse();
          done();
        }
      });

      service.closeModal();
    });

    it("should toggle modal state correctly", () => {
      expect(service.getIsModalOpen()).toBeFalse();

      service.openModal();
      expect(service.getIsModalOpen()).toBeTrue();

      service.closeModal();
      expect(service.getIsModalOpen()).toBeFalse();
    });

    it("should maintain state consistency", () => {
      service.openModal();
      expect(service.getIsModalOpen()).toBeTrue();

      // Multiple opens should not change state
      service.openModal();
      expect(service.getIsModalOpen()).toBeTrue();

      service.closeModal();
      expect(service.getIsModalOpen()).toBeFalse();

      // Multiple closes should not change state
      service.closeModal();
      expect(service.getIsModalOpen()).toBeFalse();
    });
  });

  describe("Observable Behavior", () => {
    it("should emit initial state to new subscribers", (done) => {
      service.isModalOpen$.subscribe((isOpen) => {
        expect(isOpen).toBeFalse();
        done();
      });
    });

    it("should emit state changes to multiple subscribers", (done) => {
      let subscriberCount = 0;
      const expectedSubscribers = 2;

      const checkAllSubscribers = () => {
        subscriberCount++;
        if (subscriberCount === expectedSubscribers) {
          done();
        }
      };

      service.isModalOpen$.subscribe(() => checkAllSubscribers());
      service.isModalOpen$.subscribe(() => checkAllSubscribers());

      service.openModal();
    });

    it("should emit current state immediately to new subscribers", (done) => {
      service.openModal();

      service.isModalOpen$.subscribe((isOpen) => {
        expect(isOpen).toBeTrue();
        done();
      });
    });

    it("should handle multiple rapid state changes", (done) => {
      let emissionCount = 0;
      const expectedEmissions = 3; // initial + open + close

      service.isModalOpen$.subscribe((isOpen) => {
        emissionCount++;
        if (emissionCount === expectedEmissions) {
          expect(isOpen).toBeFalse();
          done();
        }
      });

      service.openModal();
      service.closeModal();
    });
  });

  describe("State Persistence", () => {
    it("should maintain state across multiple service instances", () => {
      const service1 = TestBed.inject(ModalService);
      const service2 = TestBed.inject(ModalService);

      // They should be the same instance (singleton)
      expect(service1).toBe(service2);
    });

    it("should persist state during component lifecycle", () => {
      service.openModal();
      expect(service.getIsModalOpen()).toBeTrue();

      // Simulate component destruction and recreation
      service.closeModal();
      service.openModal();
      expect(service.getIsModalOpen()).toBeTrue();
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid open/close cycles", () => {
      for (let i = 0; i < 10; i++) {
        service.openModal();
        service.closeModal();
      }

      expect(service.getIsModalOpen()).toBeFalse();
    });

    it("should handle multiple consecutive opens", () => {
      service.openModal();
      service.openModal();
      service.openModal();

      expect(service.getIsModalOpen()).toBeTrue();
    });

    it("should handle multiple consecutive closes", () => {
      service.openModal();
      service.closeModal();
      service.closeModal();
      service.closeModal();

      expect(service.getIsModalOpen()).toBeFalse();
    });
  });

  describe("Integration Scenarios", () => {
    it("should work with multiple components subscribing", (done) => {
      let component1Received = false;
      let component2Received = false;

      service.isModalOpen$.subscribe((isOpen) => {
        component1Received = true;
        if (component1Received && component2Received) {
          expect(isOpen).toBeTrue();
          done();
        }
      });

      service.isModalOpen$.subscribe((isOpen) => {
        component2Received = true;
        if (component1Received && component2Received) {
          expect(isOpen).toBeTrue();
          done();
        }
      });

      service.openModal();
    });

    it("should handle unsubscribe scenarios gracefully", () => {
      const subscription = service.isModalOpen$.subscribe();

      // Should not throw when unsubscribing
      expect(() => subscription.unsubscribe()).not.toThrow();

      // Service should still work after unsubscribe
      service.openModal();
      expect(service.getIsModalOpen()).toBeTrue();
    });
  });
});
