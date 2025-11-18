import { TestBed } from "@angular/core/testing";
import { provideHttpClient, withFetch } from "@angular/common/http";
import {
  provideHttpClientTesting,
  HttpTestingController,
} from "@angular/common/http/testing";
import { UserService } from "./user.service";
import { User } from "../interfaces/user.interface";

describe("UserService", () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserService,
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("getUsers", () => {
    it("should return users list", () => {
      const mockUsers: User[] = [
        {
          id: 1,
          email: "user1@test.com",
          name: "User One",
          first_name: "User",
          last_name: "One",
          education_level: "Bachelor",
          field_of_study: "Computer Science",
        },
        {
          id: 2,
          email: "user2@test.com",
          name: "User Two",
          first_name: "User",
          last_name: "Two",
          education_level: "Master",
          field_of_study: "Information Systems",
        },
      ];

      service.getUsers().subscribe((users) => {
        expect(users).toEqual(mockUsers);
        expect(users.length).toBe(2);
        expect(users[0].id).toBe(1);
        expect(users[0].email).toBe("user1@test.com");
      });

      const req = httpMock.expectOne("/api/user/list");
      expect(req.request.method).toBe("GET");
      req.flush(mockUsers);
    });

    it("should return empty array when no users", () => {
      service.getUsers().subscribe((users) => {
        expect(users).toEqual([]);
        expect(users.length).toBe(0);
      });

      const req = httpMock.expectOne("/api/user/list");
      expect(req.request.method).toBe("GET");
      req.flush([]);
    });

    it("should handle HTTP error response", () => {
      service.getUsers().subscribe({
        next: () => fail("Expected error, but got success"),
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne("/api/user/list");
      expect(req.request.method).toBe("GET");
      req.flush("Server Error", {
        status: 500,
        statusText: "Internal Server Error",
      });
    });

    it("should handle network error", () => {
      service.getUsers().subscribe({
        next: () => fail("Expected error, but got success"),
        error: (error) => {
          expect(error).toBeTruthy();
        },
      });

      const req = httpMock.expectOne("/api/user/list");
      req.error(new ProgressEvent("network error"));
    });

    it("should handle malformed response data", () => {
      service.getUsers().subscribe((users) => {
        // Service should still return the data as received
        expect(users).toEqual({ invalid: "data" } as any);
      });

      const req = httpMock.expectOne("/api/user/list");
      req.flush({ invalid: "data" });
    });

    it("should handle null response", () => {
      service.getUsers().subscribe((users) => {
        expect(users).toBeNull();
      });

      const req = httpMock.expectOne("/api/user/list");
      req.flush(null);
    });

    it("should make multiple requests independently", () => {
      const mockUsers1: User[] = [
        {
          id: 1,
          email: "user1@test.com",
          name: "User One",
          first_name: "User",
          last_name: "One",
          education_level: "Bachelor",
          field_of_study: "Computer Science",
        },
      ];

      const mockUsers2: User[] = [
        {
          id: 2,
          email: "user2@test.com",
          name: "User Two",
          first_name: "User",
          last_name: "Two",
          education_level: "Master",
          field_of_study: "Information Systems",
        },
      ];

      // First request
      service.getUsers().subscribe((users) => {
        expect(users).toEqual(mockUsers1);
      });

      // Second request
      service.getUsers().subscribe((users) => {
        expect(users).toEqual(mockUsers2);
      });

      const req1 = httpMock.expectOne("/api/user/list");
      const req2 = httpMock.expectOne("/api/user/list");

      req1.flush(mockUsers1);
      req2.flush(mockUsers2);
    });

    it("should handle users with different education levels", () => {
      const mockUsers: User[] = [
        {
          id: 1,
          email: "undergrad@test.com",
          name: "Undergraduate Student",
          first_name: "Undergraduate",
          last_name: "Student",
          education_level: "Bachelor",
          field_of_study: "Computer Science",
        },
        {
          id: 2,
          email: "grad@test.com",
          name: "Graduate Student",
          first_name: "Graduate",
          last_name: "Student",
          education_level: "Master",
          field_of_study: "Data Science",
        },
        {
          id: 3,
          email: "phd@test.com",
          name: "PhD Student",
          first_name: "PhD",
          last_name: "Student",
          education_level: "Doctorate",
          field_of_study: "Artificial Intelligence",
        },
      ];

      service.getUsers().subscribe((users) => {
        expect(users).toEqual(mockUsers);
        expect(users.length).toBe(3);

        const educationLevels = users.map((u) => u.education_level);
        expect(educationLevels).toContain("Bachelor");
        expect(educationLevels).toContain("Master");
        expect(educationLevels).toContain("Doctorate");
      });

      const req = httpMock.expectOne("/api/user/list");
      req.flush(mockUsers);
    });

    it("should handle users with different fields of study", () => {
      const mockUsers: User[] = [
        {
          id: 1,
          email: "cs@test.com",
          name: "CS Student",
          first_name: "CS",
          last_name: "Student",
          education_level: "Bachelor",
          field_of_study: "Computer Science",
        },
        {
          id: 2,
          email: "bio@test.com",
          name: "Bio Student",
          first_name: "Bio",
          last_name: "Student",
          education_level: "Master",
          field_of_study: "Biology",
        },
        {
          id: 3,
          email: "psych@test.com",
          name: "Psychology Student",
          first_name: "Psychology",
          last_name: "Student",
          education_level: "Bachelor",
          field_of_study: "Psychology",
        },
      ];

      service.getUsers().subscribe((users) => {
        expect(users).toEqual(mockUsers);

        const fieldsOfStudy = users.map((u) => u.field_of_study);
        expect(fieldsOfStudy).toContain("Computer Science");
        expect(fieldsOfStudy).toContain("Biology");
        expect(fieldsOfStudy).toContain("Psychology");
      });

      const req = httpMock.expectOne("/api/user/list");
      req.flush(mockUsers);
    });

    it("should handle users with profile preferences set", () => {
      const mockUsers: User[] = [
        {
          id: 1,
          email: "complete@test.com",
          name: "Complete User",
          first_name: "Complete",
          last_name: "User",
          education_level: "Bachelor",
          field_of_study: "Computer Science",
          profile_preferences_set: true,
        },
        {
          id: 2,
          email: "incomplete@test.com",
          name: "Incomplete User",
          first_name: "Incomplete",
          last_name: "User",
          education_level: "Master",
          field_of_study: "Information Systems",
          profile_preferences_set: false,
        },
      ];

      service.getUsers().subscribe((users) => {
        expect(users).toEqual(mockUsers);
        expect(users[0].profile_preferences_set).toBeTrue();
        expect(users[1].profile_preferences_set).toBeFalse();
      });

      const req = httpMock.expectOne("/api/user/list");
      req.flush(mockUsers);
    });
  });

  describe("Service Configuration", () => {
    it("should use correct API endpoint", () => {
      service.getUsers().subscribe();

      const req = httpMock.expectOne("/api/user/list");
      expect(req.request.url).toBe("/api/user/list");
    });

    it("should use GET method", () => {
      service.getUsers().subscribe();

      const req = httpMock.expectOne("/api/user/list");
      expect(req.request.method).toBe("GET");
    });

    it("should not send any request body", () => {
      service.getUsers().subscribe();

      const req = httpMock.expectOne("/api/user/list");
      expect(req.request.body).toBeNull();
    });

    it("should not add custom headers by default", () => {
      service.getUsers().subscribe();

      const req = httpMock.expectOne("/api/user/list");
      // Only default headers should be present
      expect(req.request.headers.keys().length).toBeLessThanOrEqual(2);
    });
  });

  describe("Observable Behavior", () => {
    it("should complete the observable after response", () => {
      let completed = false;

      service.getUsers().subscribe({
        complete: () => (completed = true),
      });

      const req = httpMock.expectOne("/api/user/list");
      req.flush([]);

      expect(completed).toBeTrue();
    });

    it("should be a cold observable", () => {
      let requestCount = 0;

      const observable = service.getUsers();

      // First subscription
      observable.subscribe();
      httpMock.expectOne("/api/user/list").flush([]);
      requestCount++;

      // Second subscription should make another request
      observable.subscribe();
      httpMock.expectOne("/api/user/list").flush([]);
      requestCount++;

      expect(requestCount).toBe(2);
    });

    it("should handle concurrent subscriptions", () => {
      const results: User[][] = [];

      const observable = service.getUsers();

      // Multiple concurrent subscriptions
      observable.subscribe((users) => results.push(users));
      observable.subscribe((users) => results.push(users));

      // Should create separate requests for each subscription
      const req1 = httpMock.expectOne("/api/user/list");
      const req2 = httpMock.expectOne("/api/user/list");

      const mockUsers: User[] = [
        {
          id: 1,
          email: "concurrent@test.com",
          name: "Concurrent User",
          first_name: "Concurrent",
          last_name: "User",
          education_level: "Bachelor",
          field_of_study: "Computer Science",
        },
      ];

      req1.flush(mockUsers);
      req2.flush(mockUsers);

      expect(results.length).toBe(2);
      expect(results[0]).toEqual(mockUsers);
      expect(results[1]).toEqual(mockUsers);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very large user list", () => {
      const largeUserList: User[] = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        email: `user${i + 1}@test.com`,
        name: `User ${i + 1}`,
        first_name: "User",
        last_name: `${i + 1}`,
        education_level: "Bachelor",
        field_of_study: "Computer Science",
      }));

      service.getUsers().subscribe((users) => {
        expect(users).toEqual(largeUserList);
        expect(users.length).toBe(1000);
      });

      const req = httpMock.expectOne("/api/user/list");
      req.flush(largeUserList);
    });

    it("should handle users with special characters in names", () => {
      const mockUsers: User[] = [
        {
          id: 1,
          email: "special@test.com",
          name: "José María Ñoño",
          first_name: "José María",
          last_name: "Ñoño",
          education_level: "Bachelor",
          field_of_study: "Ciencias Sociales",
        },
        {
          id: 2,
          email: "unicode@test.com",
          name: "أحمد محمد",
          first_name: "أحمد",
          last_name: "محمد",
          education_level: "Master",
          field_of_study: "Computer Science",
        },
      ];

      service.getUsers().subscribe((users) => {
        expect(users).toEqual(mockUsers);
        expect(users[0].name).toBe("José María Ñoño");
        expect(users[1].name).toBe("أحمد محمد");
      });

      const req = httpMock.expectOne("/api/user/list");
      req.flush(mockUsers);
    });

    it("should handle users with missing optional fields", () => {
      const mockUsers: User[] = [
        {
          id: 1,
          email: "minimal@test.com",
          name: "Minimal User",
          first_name: "Minimal",
          last_name: "User",
          education_level: "Bachelor",
          field_of_study: "Computer Science",
          // profile_preferences_set is optional and not included
        },
      ];

      service.getUsers().subscribe((users) => {
        expect(users).toEqual(mockUsers);
        expect(users[0].profile_preferences_set).toBeUndefined();
      });

      const req = httpMock.expectOne("/api/user/list");
      req.flush(mockUsers);
    });
  });

  describe("Integration Scenarios", () => {
    it("should work with authentication headers (future enhancement)", () => {
      // This test demonstrates how the service would work with auth headers
      // when they are added in the future via interceptors

      service.getUsers().subscribe((users) => {
        expect(users).toBeDefined();
      });

      const req = httpMock.expectOne("/api/user/list");

      // In the future, we might expect authorization headers
      // expect(req.request.headers.get('Authorization')).toBeDefined();

      req.flush([]);
    });

    it("should handle timeout scenarios", () => {
      service.getUsers().subscribe({
        next: () => fail("Expected timeout error"),
        error: (error) => {
          expect(error).toBeTruthy();
        },
      });

      const req = httpMock.expectOne("/api/user/list");
      req.error(new ProgressEvent("timeout"));
    });

    it("should work with different response formats", () => {
      // Test response with additional metadata (future API enhancement)
      const mockResponse = {
        users: [
          {
            id: 1,
            email: "meta@test.com",
            name: "Meta User",
            first_name: "Meta",
            last_name: "User",
            education_level: "Bachelor",
            field_of_study: "Computer Science",
          },
        ],
        total: 1,
        page: 1,
      };

      service.getUsers().subscribe((users) => {
        // Currently the service expects User[] directly
        // This test shows it would need modification for metadata responses
        expect(users).toEqual(mockResponse as any);
      });

      const req = httpMock.expectOne("/api/user/list");
      req.flush(mockResponse);
    });
  });
});
