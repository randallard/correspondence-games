# Testing Quick Start - React Games

## TL;DR - Get Testing Fast

### Install Dependencies
```bash
npm install --save-dev vitest @vitest/ui happy-dom
npm install --save-dev @testing-library/react @testing-library/user-event
npm install --save-dev @playwright/test
```

### Configure Vitest
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 }
    }
  }
})
```

### Setup File
```typescript
// tests/setup.ts
import { beforeEach, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
})
```

---

## Test Templates

### 1. Testing Game Logic (Pure Functions)
```typescript
import { describe, it, expect } from 'vitest'
import { calculateWinner } from './gameLogic'

describe('calculateWinner', () => {
  it('detects horizontal win', () => {
    const board = ['X', 'X', 'X', null, 'O', null, 'O', null, null]
    expect(calculateWinner(board)).toBe('X')
  })
})
```

### 2. Testing Custom Hooks
```typescript
import { renderHook, act } from '@testing-library/react'
import { useGameState } from './useGameState'

it('makes a move and switches player', () => {
  const { result } = renderHook(() => useGameState())

  act(() => {
    result.current.makeMove(0)
  })

  expect(result.current.board[0]).toBe('X')
  expect(result.current.currentPlayer).toBe('O')
})
```

### 3. Testing Components (User Interactions)
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

it('allows clicking cells to make moves', async () => {
  const user = userEvent.setup()
  render(<TicTacToe />)

  const cell = screen.getByRole('button', { name: /Cell 0/i })
  await user.click(cell)

  expect(cell).toHaveTextContent('X')
})
```

### 4. Testing localStorage
```typescript
import { vi, beforeEach } from 'vitest'

beforeEach(() => {
  localStorage.clear()
})

it('saves game state to localStorage', () => {
  const { result } = renderHook(() => useGameState())

  act(() => {
    result.current.makeMove(0)
  })

  const saved = JSON.parse(localStorage.getItem('gameState'))
  expect(saved.board[0]).toBe('X')
})
```

### 5. Testing URL State
```typescript
it('loads game from URL parameter', () => {
  delete window.location
  window.location = new URL('http://localhost/game/abc123') as any

  render(<Game />)

  expect(screen.getByText(/Game ID: abc123/i)).toBeInTheDocument()
})
```

### 6. E2E Test (Playwright)
```typescript
import { test, expect } from '@playwright/test'

test('complete game flow', async ({ page }) => {
  await page.goto('/game')

  // Make winning moves
  await page.locator('[data-testid="cell-0"]').click()
  await page.locator('[data-testid="cell-3"]').click()
  await page.locator('[data-testid="cell-1"]').click()
  await page.locator('[data-testid="cell-4"]').click()
  await page.locator('[data-testid="cell-2"]').click()

  await expect(page.locator('[data-testid="status"]')).toHaveText(/Player X wins!/i)
})
```

---

## Common Patterns

### Full Game Flow Test
```typescript
describe('complete game flow', () => {
  it('plays game from start to win', async () => {
    const user = userEvent.setup()
    render(<TicTacToe />)

    // Initial state
    expect(screen.getByText(/Player X's turn/i)).toBeInTheDocument()

    // Make moves to win
    const cells = screen.getAllByRole('button')
    await user.click(cells[0]) // X
    await user.click(cells[3]) // O
    await user.click(cells[1]) // X
    await user.click(cells[4]) // O
    await user.click(cells[2]) // X wins

    expect(screen.getByText(/Player X wins!/i)).toBeInTheDocument()

    // Game should be locked
    await user.click(cells[5])
    expect(cells[5]).toHaveTextContent('') // No move made
  })
})
```

### Testing Accessibility
```typescript
it('is keyboard navigable', async () => {
  render(<TicTacToe />)

  const cells = screen.getAllByRole('button')

  cells[0].focus()
  await userEvent.keyboard('{Enter}')

  expect(cells[0]).toHaveTextContent('X')
})

it('uses proper ARIA roles', () => {
  render(<TicTacToe />)

  expect(screen.getByRole('grid')).toBeInTheDocument()
  expect(screen.getAllByRole('button')).toHaveLength(9)
  expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
})
```

---

## Testing Checklist

### Before Writing Tests
- [ ] Install Vitest, @testing-library/react, Playwright
- [ ] Configure vitest.config.ts with happy-dom
- [ ] Create tests/setup.ts for global setup
- [ ] Add test scripts to package.json

### For Each Feature
- [ ] Test pure game logic functions (unit tests)
- [ ] Test custom hooks with renderHook
- [ ] Test component rendering and interactions
- [ ] Test localStorage/URL persistence
- [ ] Test accessibility (keyboard, ARIA)
- [ ] Add E2E test for critical paths

### Quality Gates
- [ ] Unit test coverage: 80%+ (95%+ for game logic)
- [ ] All tests pass in CI/CD
- [ ] No accessibility violations (axe-core)
- [ ] E2E tests pass in Chrome + Firefox
- [ ] No console errors/warnings during tests

---

## Running Tests

```bash
# Unit/Integration Tests
npm run test                    # Run all tests
npm run test -- --watch        # Watch mode
npm run test -- --coverage     # With coverage
npm run test -- --ui           # Visual UI mode

# E2E Tests
npx playwright test             # Run E2E tests
npx playwright test --headed   # See browser
npx playwright test --debug    # Debug mode
npx playwright show-report     # View report

# CI/CD
npm run test -- --run --coverage  # Single run with coverage
npx playwright test --reporter=json  # JSON output for CI
```

---

## Key Rules

1. **Use `act()`** when calling functions that update state in hooks
2. **Use `userEvent`** instead of `fireEvent` for interactions
3. **Don't destructure `result.current`** in hook tests
4. **Clear localStorage** in beforeEach/afterEach
5. **Use role-based queries** (`getByRole`) for accessibility
6. **Test behavior, not implementation**
7. **Use `waitFor`** for async, not `setTimeout`
8. **Mock on `Storage.prototype` with jsdom**, directly with happy-dom

---

## Troubleshooting

### Test fails with "not wrapped in act()"
```typescript
// Wrong
result.current.makeMove(0)

// Right
act(() => {
  result.current.makeMove(0)
})
```

### Can't spy on localStorage
```typescript
// With happy-dom (simple)
vi.spyOn(localStorage, 'getItem')

// With jsdom (must use prototype)
vi.spyOn(Storage.prototype, 'getItem')
```

### Async test timing out
```typescript
// Wrong
setTimeout(() => expect(something), 1000)

// Right
await waitFor(() => {
  expect(something).toBeTruthy()
}, { timeout: 5000 })
```

### Window.location not mocking
```typescript
// Works in most cases
delete window.location
window.location = new URL('http://localhost/game/123') as any

// For complex cases, use vitest-location-mock package
```

---

## Resources

- **Full Research**: See `react_testing_patterns_research.md` in this directory
- **Vitest Docs**: https://vitest.dev/guide/
- **React Testing Library**: https://testing-library.com/docs/react-testing-library/intro/
- **Playwright**: https://playwright.dev/docs/intro
- **Epic Web (Browser Mode)**: https://www.epicweb.dev/events/react-component-testing-with-vitest-browser-mode-02-2025

---

## Next Steps

1. Copy templates above into your test files
2. Start with game logic (pure functions) - easiest wins
3. Add hook tests for state management
4. Test components with user interactions
5. Add Playwright E2E for critical flows
6. Run coverage and aim for 80%+
7. Set up CI/CD to run tests automatically

**Remember**: Good tests give you confidence to refactor and ship faster!
