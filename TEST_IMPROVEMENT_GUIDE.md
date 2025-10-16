# Test Coverage Improvement Guide - Path to 95%+

**Current Coverage:** 86.73% Statements | 80.3% Branches | 85.51% Functions | 86.42% Lines  
**Target Coverage:** 95%+ across all metrics  
**Current Status:** 55 failing tests, 248 passing

---

## Critical Fixes Needed (High Priority)

### 1. Survey Modal Crypto Tests
**Issue:** Cannot set property crypto of [object Window]  
**Fix:** Don't directly modify `globalThis.crypto`, instead mock it properly

```typescript
// In beforeEach:
let cryptoSpy: jasmine.Spy;
beforeEach(() => {
  cryptoSpy = spyOn(crypto, 'randomUUID').and.returnValue('mock-uuid-123');
});
```

### 2. Login Modal Toast Timing Tests
**Issue:** Toast timing expectations are incorrect  
**Fix:** Tests expect toast to still be visible after concurrent timeouts

```typescript
// For concurrent toast tests, the last toast timeout wins
tick(4000); // First toast hides
expect(component.showToast).toBeTrue(); // Second toast still showing
tick(4000); // Second toast hides
expect(component.showToast).toBeFalse();
```

### 3. Auth Service HTTP Request Matching
**Issue:** Tests expect requests that aren't being made  
**Fix:** Check the actual AuthService flow - login may fail early

```typescript
// If login fails at token stage, no /me or /profile requests are made
const loginPromise = authService.login('email', 'password');
const tokenReq = httpMock.expectOne('/api/user/token/');
tokenReq.flush({ error: 'Failed' }, { status: 401, statusText: 'Unauthorized' });
const result = await loginPromise;
expect(result).toBeFalse();
// Don't expect /me or /profile requests
```

### 4. Document Service Return Values
**Issue:** DELETE endpoints return `null` but tests expect `undefined`  
**Fix:** Update expectations

```typescript
// Change from:
expect(response).toBeUndefined();
// To:
expect(response).toBeNull();
```

### 5. Header Component Role State
**Issue:** Role state not updating because anonymous_id check blocks it  
**Fix:** Review the logic in HeaderComponent

```typescript
// In HeaderComponent:
if ('anonymous_id' in user) {
  this.is_author = false;
  this.is_staff = false;
  return; // This prevents checking is_staff/is_author
}
// Remove the return or restructure the logic
```

### 6. Recommendations Component Error Messages
**Issue:** Expected error messages don't match actual ones  
**Fix:** Update test expectations to match actual component behavior

```typescript
// Component shows: 'No se encontraron documentos recomendados.' (warning)
// Test expects: 'Error al recibir los documentos recomendados.' (error)
// Fix: Match the actual messages
expect(component.toastMessage).toBe('No se encontraron documentos recomendados.');
expect(component.toastType).toBe('warning');
```

---

## New Tests to Add for 95% Coverage

### Missing Service Tests

#### **ChatService** - Add these tests:
1. Test reconnection logic
2. Test message retry on failure
3. Test session name update/rename
4. Test concurrent session operations
5. Test message deduplication
6. Test reference document fetching edge cases

#### **DocumentService** - Add these tests:
1. Test document caching behavior
2. Test concurrent operations on same document  
3. Test status transitions (L → R → E)
4. Test document search with filters
5. Test pagination handling

#### **AuthService** - Add these tests:
1. Test token refresh logic
2. Test session expiration handling
3. Test profile completion flag persistence
4. Test logout cleanup
5. Test registerUser method (if it exists)

#### **RecommendationService** - Add these tests:
1. Test recommendation refresh
2. Test fallback recommendations
3. Test recommendation filtering
4. Test empty state handling

### Missing Component Tests

#### **ProfileComponent** - Add comprehensive tests:
```typescript
describe('ProfileComponent', () => {
  it('should load user profile on init');
  it('should handle profile update success');
  it('should handle profile update failure');
  it('should display saved documents');
  it('should display authored documents');
  it('should handle document removal');
  it('should show loading state');
  it('should handle anonymous user state');
  it('should navigate on logout');
  it('should display preferences');
});
```

#### **RecommendationsComponent** - Add tests:
```typescript
describe('RecommendationsComponent', () => {
  it('should load recommendations on init');
  it('should handle empty recommendations');
  it('should handle recommendation click');
  it('should refresh recommendations');
  it('should display loading state');
  it('should handle service errors');
  it('should filter recommendations');
  it('should sort recommendations');
});
```

### Missing Pipe Tests

**SeguroHtmlPipe** - Comprehensive test (already created in this session):
- Created: `src/app/pipes/seguro-html.pipe.spec.ts`

### Missing Integration Tests

**App Routing** - Test all routes (already created):
- Created: `src/app/app-routing.spec.ts`

**App Component** - Add tests:
```typescript
describe('AppComponent', () => {
  it('should create the app');
  it('should have router-outlet');
  it('should display header');
  it('should display sidebar');
  it('should handle routing');
});
```

---

## Edge Cases to Test

### 1. Network Failures
```typescript
it('should handle network timeout', fakeAsync(() => {
  service.getData().subscribe({
    error: (err) => expect(err).toBeTruthy()
  });
  tick(30000); // Simulate timeout
}));
```

### 2. Concurrent Operations
```typescript
it('should handle concurrent requests', () => {
  const promise1 = service.operation1();
  const promise2 = service.operation2();
  // Test that both resolve correctly
});
```

### 3. Memory Leaks
```typescript
it('should unsubscribe on destroy', () => {
  const subscription = component['subscription'];
  spyOn(subscription, 'unsubscribe');
  component.ngOnDestroy();
  expect(subscription.unsubscribe).toHaveBeenCalled();
});
```

### 4. Invalid Data
```typescript
it('should handle null response', () => {
  service.getData().subscribe(data => {
    expect(data).toBeNull();
  });
  httpMock.expectOne('/api/data').flush(null);
});
```

---

## Test Organization Best Practices

### 1. Use Descriptive Test Names
```typescript
// Bad
it('should work');

// Good
it('should display error message when login fails with invalid credentials');
```

### 2. Arrange-Act-Assert Pattern
```typescript
it('should update user profile', () => {
  // Arrange
  const newProfile = { name: 'Test' };
  
  // Act
  component.updateProfile(newProfile);
  
  // Assert
  expect(component.profile).toEqual(newProfile);
});
```

### 3. Group Related Tests
```typescript
describe('Authentication', () => {
  describe('Login', () => {
    it('should login with valid credentials');
    it('should reject invalid credentials');
  });
  
  describe('Logout', () => {
    it('should clear session on logout');
    it('should redirect to login page');
  });
});
```

---

## Quick Wins for Coverage Boost

### 1. Test All Public Methods
Run coverage report and look for uncovered public methods. Add basic tests for each.

### 2. Test All Branches
Look for `if/else` statements in coverage report. Add tests for both paths.

### 3. Test Error Handlers
Every `.catch()` or error callback should have a test.

### 4. Test Edge Cases
- Empty arrays/strings
- Null/undefined values
- Very large/small numbers
- Boundary conditions

---

## Coverage Analysis Command

```bash
# Generate detailed coverage report
npx ng test --watch=false --browsers=ChromeHeadless --code-coverage

# View HTML report
start coverage/avri/index.html  # Windows
open coverage/avri/index.html   # Mac
xdg-open coverage/avri/index.html  # Linux
```

Look for red/yellow highlighted code in the HTML report - these are your targets!

---

## Estimated Time to 95%

| Task | Estimated Time |
|------|----------------|
| Fix 55 failing tests | 4-6 hours |
| Add ProfileComponent tests | 2-3 hours |
| Add RecommendationsComponent tests | 2-3 hours |
| Add missing service tests | 3-4 hours |
| Add edge case tests | 2-3 hours |
| **Total** | **13-19 hours** |

---

## Priority Order

1. **Fix failing tests** (blocks everything else)
2. **Add tests for ProfileComponent** (likely low coverage)
3. **Add tests for RecommendationsComponent** (likely low coverage)
4. **Add missing service method tests**
5. **Add edge case and error handling tests**
6. **Achieve 95%+ coverage**

---

## Notes

- The HTML coverage report is your best friend - use it to identify exact lines needing coverage
- Focus on meaningful tests, not just hitting coverage numbers
- Integration tests can cover multiple components at once
- Don't forget to test error states and edge cases
- Keep tests maintainable - they're part of your codebase too!


