# Coverage Boost Plan: 86% → 90%

## Current Status
- **Statements**: 86.2% → Target: 90% (+3.8%, ~29 statements)
- **Branches**: 77.27% → Target: 90% (+12.73%, ~17 branches)
- **Functions**: 85.98% → Target: 90% (+4.02%, ~9 functions)
- **Lines**: 85.87% → Target: 90% (+4.13%, ~30 lines)

## Remaining 22 Failures to Fix

### Priority 1: Quick Wins (10 failures)
1. [DONE] **SurveyModal crypto** - Added polyfill
2. **HeaderComponent roles** (2) - Need `fixture.detectChanges()` after role changes
3. **LoginModal anonymous** (1) - Check stub return values
4. **DocumentService return** (2) - Expect `undefined` not `null`
5. **Sidebar user display** (5) - Fix initial/name logic

### Priority 2: HTTP Mocking (8 failures)
6. **ChatComponent preferences** (3) - Match correct endpoint `/api/recommender/profile/`
7. **Security tests** (2) - Handle async HTTP chains properly
8. **AuthService** (3) - Fix interceptor test expectations

### Priority 3: Observable Handling (4 failures)
9. **RecommendationService** (1) - Handle detail requests properly
10. **Sidebar sessions** (3) - Mock `window.confirm` properly

## Strategic Tests to Add for 90%

### High-Impact Files (Low Current Coverage)
1. **app.component.ts** - Add lifecycle and navigation tests
2. **app.routes.ts** - Add route guard and redirect tests
3. **Error handlers** - Add error boundary tests
4. **Edge cases**:
   - Empty state handling
   - Network failure scenarios
   - Boundary conditions (max/min values)

### Branch Coverage Targets
- Add `else` branches for all `if` statements
- Add error callbacks for all observables
- Add null/undefined checks
- Add array empty/full checks

### Function Coverage Targets
- Test all public methods at least once
- Test private methods through public API
- Test getters/setters
- Test ngOnInit/ngOnDestroy

## Quick Fix Commands

```bash
# Run tests with coverage
npx ng test --watch=false --browsers=ChromeHeadless --code-coverage

# Check specific file coverage
npx ng test --include='**/survey-modal.component.spec.ts' --code-coverage
```

## Estimated Impact
- Fixing 22 failures: +2% coverage
- Adding 10 strategic tests: +2-3% coverage
- **Total**: Should reach 90-91% coverage

