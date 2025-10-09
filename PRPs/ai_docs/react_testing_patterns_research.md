# React Testing Patterns for Game Logic - Research Findings

## TESTING_STRATEGY

**approach**: Modern testing pyramid with Vitest (unit/integration) + Playwright (E2E) in real browsers
**frameworks**: Vitest, @testing-library/react, Playwright, fast-check (optional property-based testing)
**source_url**: https://vitest.dev/guide/ and https://playwright.dev/docs/intro

### Key Strategic Decisions (2025)

1. **Browser Mode vs JSDOM**: Consider Vitest Browser Mode for more realistic testing over JSDOM
   - Browser Mode runs in actual browser (Playwright/WebDriver)
   - More accurate for UI interactions, CSS, layout
   - Currently experimental but recommended by Kent C. Dodds
   - Source: https://www.infoq.com/news/2025/06/vitest-browser-mode-jsdom/

2. **Environment Choice for Traditional Testing**:
   - **happy-dom**: Faster, simpler localStorage spying, good for most cases
   - **jsdom**: More complete API coverage, required for advanced browser APIs
   - Source: https://github.com/vitest-dev/vitest/discussions/1607

3. **Coverage Targets**:
   - Unit: 80-95% (critical game logic should be 95%+)
   - Integration: 70-80% (user flows, state transitions)
   - E2E: Key user journeys (game creation, move making, win conditions)
   - Source: https://testing.googleblog.com/2020/08/code-coverage-best-practices.html

---

## UNIT_TESTING_PATTERNS

### Game Logic Testing

#### Pattern 1: Testing Win Condition Functions
**description**: Test pure functions that calculate game outcomes
**code_example**:
```typescript
import { describe, it, expect } from 'vitest'
import { calculateWinner } from './gameLogic'

describe('calculateWinner', () => {
  it('returns winner for horizontal line', () => {
    const board = ['X', 'X', 'X', null, 'O', null, 'O', null, null]
    expect(calculateWinner(board)).toBe('X')
  })

  it('returns null when no winner', () => {
    const board = ['X', 'O', 'X', null, null, null, null, null, null]
    expect(calculateWinner(board)).toBeNull()
  })

  it('detects diagonal wins', () => {
    const board = ['X', 'O', null, 'O', 'X', null, null, null, 'X']
    expect(calculateWinner(board)).toBe('X')
  })
})
```
**source_url**: https://react.dev/learn/tutorial-tic-tac-toe

#### Pattern 2: Testing Game State Machines
**description**: Test state transitions and valid moves
**code_example**:
```typescript
import { describe, it, expect } from 'vitest'

describe('game state transitions', () => {
  it('only allows moves on empty squares', () => {
    const game = { board: ['X', null, null], currentPlayer: 'O' }
    expect(() => makeMove(game, 0)).toThrow('Square already occupied')
  })

  it('switches players after valid move', () => {
    const game = { board: [null, null, null], currentPlayer: 'X' }
    const newGame = makeMove(game, 0)
    expect(newGame.currentPlayer).toBe('O')
    expect(newGame.board[0]).toBe('X')
  })
})
```
**source_url**: https://github.com/athangk/my-tic-tac-toe-ReactJS

---

### State Management Testing

#### Pattern 1: Testing Custom Hooks with renderHook
**description**: Test hooks that manage game state
**code_example**:
```typescript
import { renderHook, act } from '@testing-library/react'
import { expect, it, describe } from 'vitest'
import { useGameState } from './useGameState'

describe('useGameState', () => {
  it('initializes with empty board', () => {
    const { result } = renderHook(() => useGameState())
    expect(result.current.board).toEqual(Array(9).fill(null))
    expect(result.current.currentPlayer).toBe('X')
  })

  it('makes a move and updates state', () => {
    const { result } = renderHook(() => useGameState())

    act(() => {
      result.current.makeMove(0)
    })

    expect(result.current.board[0]).toBe('X')
    expect(result.current.currentPlayer).toBe('O')
  })

  it('detects winner after winning move', () => {
    const { result } = renderHook(() => useGameState())

    act(() => {
      // Play winning sequence
      result.current.makeMove(0) // X
      result.current.makeMove(3) // O
      result.current.makeMove(1) // X
      result.current.makeMove(4) // O
      result.current.makeMove(2) // X wins
    })

    expect(result.current.winner).toBe('X')
    expect(result.current.isGameOver).toBe(true)
  })
})
```
**source_url**: https://mayashavin.com/articles/test-react-hooks-with-vitest
**key_gotcha**: Don't destructure `result.current` properties - they lose reactivity. Always access via `result.current.property`

#### Pattern 2: Testing Async State Updates
**description**: Test hooks with async operations (e.g., loading game from URL)
**code_example**:
```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

describe('useGameLoader', () => {
  it('loads game state from URL', async () => {
    const { result } = renderHook(() => useGameLoader('abc123'))

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.gameState).toEqual({
      board: expect.any(Array),
      currentPlayer: expect.stringMatching(/X|O/)
    })
  })
})
```
**source_url**: https://poly4.hashnode.dev/efficiently-testing-asynchronous-react-hooks-with-vitest

---

### Hook Testing

#### Pattern 1: Using act() for State Updates
**description**: Wrap state-changing operations in act()
**code_example**:
```typescript
import { renderHook, act } from '@testing-library/react'

it('resets game state', () => {
  const { result } = renderHook(() => useGameState())

  // Make some moves first
  act(() => {
    result.current.makeMove(0)
    result.current.makeMove(1)
  })

  // Reset game
  act(() => {
    result.current.reset()
  })

  expect(result.current.board).toEqual(Array(9).fill(null))
  expect(result.current.currentPlayer).toBe('X')
})
```
**source_url**: https://www.builder.io/blog/test-custom-hooks-react-testing-library
**why_act**: Ensures all state updates are flushed before assertions run

#### Pattern 2: Testing Hook Dependencies
**description**: Verify hooks re-run when dependencies change
**code_example**:
```typescript
it('recalculates winner when board changes', () => {
  const { result, rerender } = renderHook(
    ({ board }) => useWinnerCalculation(board),
    { initialProps: { board: Array(9).fill(null) } }
  )

  expect(result.current.winner).toBeNull()

  // Update props to trigger re-render
  rerender({ board: ['X', 'X', 'X', null, null, null, null, null, null] })

  expect(result.current.winner).toBe('X')
})
```
**source_url**: https://react-hooks-testing-library.com/usage/advanced-hooks/

---

## INTEGRATION_TESTING

### URL State Testing

#### Pattern 1: Mocking window.location
**description**: Test URL-based state persistence
**approach**: Use vi.stubGlobal or delete/reassign window.location
**code_example**:
```typescript
import { vi, beforeEach, afterEach } from 'vitest'

describe('URL state management', () => {
  beforeEach(() => {
    // Method 1: Using URL object (recommended)
    delete window.location
    window.location = new URL('http://localhost:3000/game/abc123') as any
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads game from URL parameter', () => {
    render(<Game />)

    expect(screen.getByText(/Game ID: abc123/i)).toBeInTheDocument()
  })

  it('updates URL when creating new game', () => {
    const assignSpy = vi.fn()
    delete window.location
    window.location = { assign: assignSpy } as any

    render(<Game />)
    fireEvent.click(screen.getByText(/New Game/i))

    expect(assignSpy).toHaveBeenCalledWith(expect.stringContaining('/game/'))
  })
})
```
**mocking_strategy**:
  - Simple cases: `window.location = new URL(...)`
  - Complex cases: Use `vitest-location-mock` package
  - Browser mode: Avoid mocking, test real navigation
**source_url**: https://github.com/vitest-dev/vitest/discussions/2213

#### Pattern 2: Testing URL Generation/Parsing
**description**: Test URL encoding/decoding of game state
**code_example**:
```typescript
describe('game URL utilities', () => {
  it('encodes game state into shareable URL', () => {
    const gameState = { board: ['X', 'O', null, ...], moves: 2 }
    const url = generateGameURL(gameState)

    expect(url).toMatch(/^http:\/\/localhost\/game\/[a-zA-Z0-9]+$/)
    expect(parseGameURL(url)).toEqual(gameState)
  })

  it('handles invalid URL gracefully', () => {
    expect(() => parseGameURL('invalid')).toThrow('Invalid game URL')
  })
})
```
**source_url**: https://runthatline.com/how-to-mock-window-with-vitest/

---

### localStorage Testing

#### Pattern 1: Spying on localStorage (happy-dom)
**description**: Verify localStorage interactions with happy-dom
**setup**:
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts']
  }
})

// tests/setup.ts
import { beforeEach, afterEach, vi } from 'vitest'

let getItemSpy: any
let setItemSpy: any

beforeEach(() => {
  // With happy-dom, can spy directly on localStorage
  getItemSpy = vi.spyOn(localStorage, 'getItem')
  setItemSpy = vi.spyOn(localStorage, 'setItem')
})

afterEach(() => {
  getItemSpy.mockClear()
  setItemSpy.mockClear()
  localStorage.clear()
})

export { getItemSpy, setItemSpy }
```
**code_example**:
```typescript
import { getItemSpy, setItemSpy } from './tests/setup'

describe('game persistence', () => {
  it('saves game state to localStorage', () => {
    const { result } = renderHook(() => useGameState())

    act(() => {
      result.current.makeMove(0)
    })

    expect(setItemSpy).toHaveBeenCalledWith(
      'gameState',
      expect.stringContaining('"board"')
    )
  })

  it('restores game from localStorage', () => {
    localStorage.setItem('gameState', JSON.stringify({
      board: ['X', null, null, null, null, null, null, null, null],
      currentPlayer: 'O'
    }))

    const { result } = renderHook(() => useGameState())

    expect(getItemSpy).toHaveBeenCalledWith('gameState')
    expect(result.current.board[0]).toBe('X')
    expect(result.current.currentPlayer).toBe('O')
  })
})
```
**source_url**: https://dylanbritz.dev/writing/mocking-local-storage-vitest/

#### Pattern 2: Using vitest-localstorage-mock
**description**: Alternative approach using dedicated package
**setup**:
```bash
npm install --save-dev vitest-localstorage-mock
```
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    setupFiles: ['vitest-localstorage-mock']
  }
})
```
**code_example**:
```typescript
describe('with vitest-localstorage-mock', () => {
  it('automatically mocks localStorage', () => {
    localStorage.setItem('key', 'value')
    expect(localStorage.getItem('key')).toBe('value')

    // Spy methods available automatically
    expect(localStorage.setItem).toHaveBeenCalled()
  })
})
```
**source_url**: https://www.npmjs.com/package/vitest-localstorage-mock

#### Pattern 3: jsdom Approach (if needed)
**description**: Testing localStorage with jsdom (requires different spy setup)
**gotcha**: Must spy on Storage.prototype, not localStorage directly
**code_example**:
```typescript
// With jsdom environment
const getItemSpy = vi.spyOn(Storage.prototype, 'getItem')
const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
```
**source_url**: https://runthatline.com/vitest-mock-localstorage/

---

### User Flows Testing

#### Pattern 1: Complete Game Flow
**flow**: User creates game, makes moves, wins/draws, shares URL
**testing_approach**:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('complete game flow', () => {
  it('allows playing a full game to completion', async () => {
    const user = userEvent.setup()
    render(<TicTacToe />)

    // Initial state
    expect(screen.getByText(/Player X's turn/i)).toBeInTheDocument()

    // Make moves
    const cells = screen.getAllByRole('button', { name: '' })
    await user.click(cells[0]) // X
    expect(screen.getByText(/Player O's turn/i)).toBeInTheDocument()

    await user.click(cells[3]) // O
    await user.click(cells[1]) // X
    await user.click(cells[4]) // O
    await user.click(cells[2]) // X wins!

    // Verify winner
    await waitFor(() => {
      expect(screen.getByText(/Player X wins!/i)).toBeInTheDocument()
    })

    // Verify game is locked
    await user.click(cells[5])
    expect(cells[5]).toHaveTextContent('') // No move made
  })

  it('handles draw scenario', async () => {
    const user = userEvent.setup()
    render(<TicTacToe />)

    // Play to draw: X,X,O,O,O,X,X,O,X
    const moves = [0, 2, 1, 3, 4, 5, 6, 7, 8]
    const cells = screen.getAllByRole('button', { name: '' })

    for (const move of moves) {
      await user.click(cells[move])
    }

    expect(screen.getByText(/It's a draw!/i)).toBeInTheDocument()
  })
})
```
**source_url**: https://vaskort.medium.com/bulletproof-react-testing-with-vitest-rtl-deeaabce9fef

#### Pattern 2: URL Sharing Flow
**flow**: Create game → Make moves → Get shareable URL → Load from URL
**testing_approach**:
```typescript
describe('URL sharing flow', () => {
  it('allows sharing game state via URL', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Game />)

    // Make some moves
    const cells = screen.getAllByRole('button', { name: '' })
    await user.click(cells[0])
    await user.click(cells[1])

    // Get share URL
    const shareButton = screen.getByRole('button', { name: /Share/i })
    await user.click(shareButton)

    const shareURL = screen.getByRole('textbox', { name: /Share URL/i }).value

    // Simulate loading in new session
    delete window.location
    window.location = new URL(shareURL) as any

    rerender(<Game />)

    // Verify state restored
    expect(cells[0]).toHaveTextContent('X')
    expect(cells[1]).toHaveTextContent('O')
  })
})
```
**source_url**: https://testing-library.com/docs/dom-testing-library/api-events/

---

## E2E_TESTING

### Playwright Patterns

#### Pattern 1: Page Object Model for Games
**description**: Encapsulate game interactions in reusable page objects
**code_example**:
```typescript
// pages/TicTacToePage.ts
import { Page, Locator } from '@playwright/test'

export class TicTacToePage {
  readonly page: Page
  readonly cells: Locator
  readonly statusMessage: Locator
  readonly resetButton: Locator

  constructor(page: Page) {
    this.page = page
    this.cells = page.locator('[data-testid="cell"]')
    this.statusMessage = page.locator('[data-testid="status"]')
    this.resetButton = page.getByRole('button', { name: /New Game/i })
  }

  async goto() {
    await this.page.goto('/game')
  }

  async clickCell(index: number) {
    await this.cells.nth(index).click()
  }

  async getCellText(index: number) {
    return await this.cells.nth(index).textContent()
  }

  async getStatus() {
    return await this.statusMessage.textContent()
  }

  async resetGame() {
    await this.resetButton.click()
  }

  async playWinningSequence() {
    // X wins with top row
    await this.clickCell(0) // X
    await this.clickCell(3) // O
    await this.clickCell(1) // X
    await this.clickCell(4) // O
    await this.clickCell(2) // X wins
  }
}

// tests/ticTacToe.e2e.spec.ts
import { test, expect } from '@playwright/test'
import { TicTacToePage } from './pages/TicTacToePage'

test.describe('Tic Tac Toe E2E', () => {
  test('player X can win the game', async ({ page }) => {
    const game = new TicTacToePage(page)
    await game.goto()

    await game.playWinningSequence()

    await expect(game.statusMessage).toHaveText(/Player X wins!/i)
  })

  test('game state persists in URL', async ({ page, context }) => {
    const game = new TicTacToePage(page)
    await game.goto()

    await game.clickCell(0)
    await game.clickCell(1)

    const url = page.url()

    // Open in new tab/page
    const newPage = await context.newPage()
    await newPage.goto(url)
    const newGame = new TicTacToePage(newPage)

    expect(await newGame.getCellText(0)).toBe('X')
    expect(await newGame.getCellText(1)).toBe('O')
  })
})
```
**source_url**: https://playwright.dev/docs/pom

#### Pattern 2: Cross-Browser Testing
**description**: Test game across different browsers
**code_example**:
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:5173',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 5173,
  },
})
```
**source_url**: https://playwright.dev/docs/test-projects

#### Pattern 3: Testing Accessibility in E2E
**description**: Verify game is keyboard-navigable and screen-reader friendly
**code_example**:
```typescript
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('game meets accessibility standards', async ({ page }) => {
  await page.goto('/game')

  // Run axe accessibility checks
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
  expect(accessibilityScanResults.violations).toEqual([])
})

test('game is keyboard navigable', async ({ page }) => {
  await page.goto('/game')

  // Tab through cells
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter') // Make move

  const firstCell = page.locator('[data-testid="cell"]').first()
  await expect(firstCell).toHaveText('X')

  // Continue with keyboard
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')

  const secondCell = page.locator('[data-testid="cell"]').nth(1)
  await expect(secondCell).toHaveText('O')
})
```
**source_url**: https://playwright.dev/docs/accessibility-testing

---

### Coverage Targets

**unit**: 80-95%
  - Critical game logic (win detection, move validation): 95%+
  - UI components: 80%+
  - Utility functions: 90%+

**integration**: 70-80%
  - State management flows: 80%+
  - URL/localStorage persistence: 75%+
  - Component integration: 70%+

**e2e**: Key scenarios (not percentage-based)
  - Happy path: Complete game to win
  - Alternative paths: Draw, reset, share URL
  - Error cases: Invalid moves, network issues
  - Cross-browser: At least Chrome + Firefox
  - Accessibility: Keyboard navigation, screen reader

**source_url**: https://testing.googleblog.com/2020/08/code-coverage-best-practices.html

---

## COMPONENT_INTERACTION_TESTING

### User Interaction Patterns

#### Pattern 1: Using userEvent (Recommended)
**description**: Simulate realistic user interactions
**code_example**:
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('game interactions', () => {
  it('handles cell clicks with userEvent', async () => {
    const user = userEvent.setup()
    render(<TicTacToe />)

    const cell = screen.getByRole('button', { name: /Cell 0/i })

    await user.click(cell)

    expect(cell).toHaveTextContent('X')
  })

  it('handles double-click prevention', async () => {
    const user = userEvent.setup()
    render(<TicTacToe />)

    const cell = screen.getByRole('button', { name: /Cell 0/i })

    await user.click(cell) // First click - X
    await user.click(cell) // Second click - should be ignored

    expect(cell).toHaveTextContent('X') // Still X, not changed
  })
})
```
**source_url**: https://vitest.dev/guide/browser/interactivity-api
**note**: In Vitest Browser Mode, use `userEvent` from `@vitest/browser/context` for real CDP-based interactions

#### Pattern 2: Testing Hover States (for UI feedback)
**description**: Test hover effects and tooltips
**code_example**:
```typescript
it('shows hover state on empty cells', async () => {
  const user = userEvent.setup()
  render(<TicTacToe />)

  const cell = screen.getByRole('button', { name: /Cell 0/i })

  await user.hover(cell)

  expect(cell).toHaveClass('cell-hover')
})
```
**source_url**: https://testing-library.com/docs/user-event/convenience/

---

### Accessibility Testing

#### Pattern 1: Role-Based Queries
**description**: Test using accessibility tree (how screen readers see app)
**code_example**:
```typescript
describe('accessibility', () => {
  it('provides accessible roles for game elements', () => {
    render(<TicTacToe />)

    // Game board is a grid
    const board = screen.getByRole('grid')
    expect(board).toBeInTheDocument()

    // Cells are buttons
    const cells = screen.getAllByRole('button')
    expect(cells).toHaveLength(9)

    // Status is live region for screen readers
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent(/Player X's turn/i)
  })

  it('announces game state changes to screen readers', async () => {
    const user = userEvent.setup()
    render(<TicTacToe />)

    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')

    await user.click(screen.getAllByRole('button')[0])

    expect(status).toHaveTextContent(/Player O's turn/i)
  })
})
```
**source_url**: https://testing-library.com/docs/dom-testing-library/api-accessibility/

#### Pattern 2: Keyboard Navigation
**description**: Ensure game is fully keyboard-accessible
**code_example**:
```typescript
it('supports keyboard navigation', async () => {
  render(<TicTacToe />)

  const cells = screen.getAllByRole('button')

  // Focus first cell
  cells[0].focus()
  expect(cells[0]).toHaveFocus()

  // Navigate with arrow keys
  await userEvent.keyboard('{ArrowRight}')
  expect(cells[1]).toHaveFocus()

  // Make move with Enter/Space
  await userEvent.keyboard('{Enter}')
  expect(cells[1]).toHaveTextContent('X')
})
```
**source_url**: https://medium.com/@ignatovich.dm/accessibility-testing-in-react-tools-and-best-practices-119f3c0aee6e

#### Pattern 3: ARIA Labels and Descriptions
**description**: Test screen reader announcements
**code_example**:
```typescript
it('provides descriptive labels for cells', () => {
  render(<TicTacToe />)

  const cell = screen.getByRole('button', { name: /Cell 0, empty/i })
  expect(cell).toBeInTheDocument()

  // After move
  fireEvent.click(cell)

  expect(screen.getByRole('button', { name: /Cell 0, X/i })).toBeInTheDocument()
})
```
**source_url**: https://react-spectrum.adobe.com/react-aria/testing.html

---

## ADVANCED_TESTING_PATTERNS

### Property-Based Testing

#### Pattern 1: Game Invariants with fast-check
**description**: Test properties that should always hold true
**setup**:
```bash
npm install --save-dev fast-check
```
**code_example**:
```typescript
import { test } from 'vitest'
import * as fc from 'fast-check'

test('game invariants', () => {
  // Property: Board always has exactly 9 cells
  fc.assert(
    fc.property(
      fc.array(fc.constantFrom('X', 'O', null), { minLength: 9, maxLength: 9 }),
      (board) => {
        const game = createGame(board)
        expect(game.board).toHaveLength(9)
      }
    )
  )

  // Property: Winner only declared when 3 in a row exist
  fc.assert(
    fc.property(
      fc.array(fc.constantFrom('X', 'O', null), { minLength: 9, maxLength: 9 }),
      (board) => {
        const winner = calculateWinner(board)
        if (winner) {
          // If there's a winner, verify they have 3 in a row
          const hasThreeInRow = winningLines.some(([a, b, c]) =>
            board[a] === winner && board[b] === winner && board[c] === winner
          )
          expect(hasThreeInRow).toBe(true)
        }
      }
    )
  )
})
```
**source_url**: https://fast-check.dev/
**benefits**: Discovers edge cases you wouldn't think to test manually

#### Pattern 2: URL Encoding/Decoding Properties
**description**: Test that encode/decode are inverses
**code_example**:
```typescript
import * as fc from 'fast-check'

test('URL encoding is reversible', () => {
  const gameStateArb = fc.record({
    board: fc.array(fc.constantFrom('X', 'O', null), { minLength: 9, maxLength: 9 }),
    currentPlayer: fc.constantFrom('X', 'O'),
    moves: fc.nat()
  })

  fc.assert(
    fc.property(gameStateArb, (gameState) => {
      const encoded = encodeGameState(gameState)
      const decoded = decodeGameState(encoded)
      expect(decoded).toEqual(gameState)
    })
  )
})
```
**source_url**: https://dev.to/tobiastimm/property-based-testing-with-react-and-fast-check-3dce

---

### Testing Animation & Transitions

#### Pattern 1: Waiting for Animations
**description**: Test UI that includes animations
**code_example**:
```typescript
import { waitFor } from '@testing-library/react'

it('shows winning animation', async () => {
  const user = userEvent.setup()
  render(<TicTacToe />)

  // Play winning sequence
  const cells = screen.getAllByRole('button')
  await user.click(cells[0])
  await user.click(cells[3])
  await user.click(cells[1])
  await user.click(cells[4])
  await user.click(cells[2]) // X wins

  // Wait for animation to complete
  await waitFor(() => {
    expect(screen.getByTestId('winning-line')).toHaveClass('animate-complete')
  }, { timeout: 1000 })
})
```
**source_url**: https://testing-library.com/docs/dom-testing-library/api-async/

#### Pattern 2: Mocking Animations in Tests
**description**: Skip animations to speed up tests
**code_example**:
```typescript
// tests/setup.ts
beforeEach(() => {
  // Disable CSS animations and transitions
  const style = document.createElement('style')
  style.innerHTML = `
    *, *::before, *::after {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
    }
  `
  document.head.appendChild(style)
})
```
**source_url**: https://www.epicweb.dev/why-i-won-t-use-jsdom

---

## CRITICAL_RESOURCES

### 1. Vitest Official Documentation
- **title**: Vitest Testing Guide
- **url**: https://vitest.dev/guide/
- **why_critical**: Primary testing framework, essential for configuration, API reference, and best practices
- **sections_to_read**:
  - Getting Started
  - Testing Hooks (if using Browser Mode)
  - Mocking Guide
  - Browser Mode (for modern testing approach)

### 2. React Testing Library
- **title**: Testing Library React Documentation
- **url**: https://testing-library.com/docs/react-testing-library/intro/
- **why_critical**: Core library for testing React components, defines testing philosophy
- **sections_to_read**:
  - Guiding Principles
  - Example (for patterns)
  - Queries (especially Role-based queries)
  - User Interactions (userEvent)
  - Async Methods (waitFor, etc.)

### 3. Playwright Documentation
- **title**: Playwright E2E Testing
- **url**: https://playwright.dev/docs/intro
- **why_critical**: E2E testing framework for cross-browser testing
- **sections_to_read**:
  - Writing Tests
  - Page Object Models
  - Test Configuration
  - Accessibility Testing

### 4. Epic Web Dev - Vitest Browser Mode
- **title**: React Component Testing with Vitest Browser Mode
- **url**: https://www.epicweb.dev/events/react-component-testing-with-vitest-browser-mode-02-2025
- **why_critical**: Modern approach to testing React (2025 recommendation), practical examples
- **sections_to_read**: All sections (workshop format)
- **note**: Kent C. Dodds (creator of RTL) recommends this approach

### 5. Testing Hooks with Vitest
- **title**: Test your React hooks with Vitest efficiently
- **url**: https://mayashavin.com/articles/test-react-hooks-with-vitest
- **why_critical**: Specific patterns for testing custom hooks with game state
- **sections_to_read**:
  - Testing State Updates
  - Using renderHook
  - Testing Async Hooks

### 6. localStorage Testing
- **title**: How to mock and spy on local storage in Vitest
- **url**: https://dylanbritz.dev/writing/mocking-local-storage-vitest/
- **why_critical**: Essential for testing game persistence
- **sections_to_read**: All sections (concise guide)

### 7. Google Testing Blog - Coverage
- **title**: Code Coverage Best Practices
- **url**: https://testing.googleblog.com/2020/08/code-coverage-best-practices.html
- **why_critical**: Defines coverage targets and quality standards
- **sections_to_read**:
  - What is a Good Coverage Target?
  - Coverage and Confidence

### 8. fast-check Documentation
- **title**: fast-check Property Based Testing
- **url**: https://fast-check.dev/
- **why_critical**: Optional but powerful for testing game invariants
- **sections_to_read**:
  - Introduction
  - Getting Started
  - Arbitraries (for generating test data)

### 9. Accessibility Testing in React
- **title**: Testing Library Accessibility API
- **url**: https://testing-library.com/docs/dom-testing-library/api-accessibility/
- **why_critical**: Ensure games are accessible to all users
- **sections_to_read**:
  - Queries by Role
  - ARIA Roles and Attributes
  - Best Practices

### 10. GitHub Example - React Tic-Tac-Toe with Tests
- **title**: Epic Web Dev - React Testing with Vitest
- **url**: https://github.com/epicweb-dev/react-component-testing-with-vitest
- **why_critical**: Real-world example of testing tic-tac-toe with Vitest
- **sections_to_read**: exercises/04.debugging/src/tic-tac-toe.browser.test.tsx

---

## QUICK REFERENCE

### Test File Structure
```typescript
// GameComponent.test.tsx
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderHook, act } from '@testing-library/react'

describe('GameComponent', () => {
  beforeEach(() => {
    // Setup (e.g., clear localStorage, reset mocks)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('rendering', () => {
    it('displays initial game state', () => {
      // Rendering tests
    })
  })

  describe('user interactions', () => {
    it('handles move clicks', async () => {
      // Interaction tests with userEvent
    })
  })

  describe('game logic', () => {
    it('detects winner', () => {
      // Logic tests (can test hooks or pure functions)
    })
  })
})
```

### Common Testing Gotchas

1. **Don't destructure `result.current`** in hook tests - loses reactivity
2. **Use `act()`** when calling functions that update state
3. **Prefer `userEvent` over `fireEvent`** for realistic interactions
4. **Use `waitFor`** for async operations, not arbitrary timeouts
5. **Mock localStorage on `Storage.prototype` with jsdom**, directly with happy-dom
6. **Test behavior, not implementation** - focus on what users see/do
7. **Use role-based queries** (`getByRole`) for better accessibility
8. **Clear mocks and storage** in `afterEach` to avoid test pollution

### Environment Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom', // or 'jsdom' or 'browser'
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    }
  }
})
```

### Running Tests

```bash
# Run all tests
npm run test

# Run with coverage
npm run test -- --coverage

# Run in watch mode
npm run test -- --watch

# Run specific test file
npm run test src/components/Game.test.tsx

# Run tests in UI mode (Vitest UI)
npm run test -- --ui

# Run E2E tests
npx playwright test

# Run E2E in headed mode (see browser)
npx playwright test --headed
```

---

## RECOMMENDED TESTING STACK FOR CORRESPONDENCE GAMES

### Primary Stack
- **Unit/Integration**: Vitest + @testing-library/react + happy-dom
- **E2E**: Playwright
- **Optional**: fast-check for property-based testing of game logic

### Why This Stack?
1. **Vitest**: Fast, Vite-native, great DX, familiar Jest API
2. **happy-dom**: Faster than jsdom, simpler localStorage testing
3. **@testing-library/react**: User-centric testing, excellent documentation
4. **Playwright**: Best-in-class E2E, cross-browser, great developer experience
5. **fast-check**: Catches edge cases in complex game logic

### Migration Path (if needed)
1. Start with traditional Vitest + happy-dom + RTL
2. Write comprehensive unit and integration tests
3. Add Playwright E2E for critical flows
4. Consider Vitest Browser Mode for complex UI interactions (experimental)
5. Add property-based testing for complex game algorithms

---

## TESTING PHILOSOPHY FOR GAMES

### What to Test
✅ **Game logic**: Win conditions, move validation, state transitions
✅ **User interactions**: Clicks, keyboard navigation, accessibility
✅ **State persistence**: localStorage, URL state
✅ **Edge cases**: Invalid moves, boundary conditions, concurrent actions
✅ **Integration**: Component communication, data flow
✅ **Critical paths**: Creating game, making moves, sharing, winning

### What NOT to Test
❌ **Implementation details**: Internal state variable names, component structure
❌ **Third-party libraries**: Assume React, router, etc. work
❌ **Exact styling**: Colors, fonts (unless accessibility concern)
❌ **Animation timing**: Test presence, not duration
❌ **Browser quirks**: Let E2E catch browser-specific issues

### Test Naming Convention
```typescript
// Good
it('prevents moves on occupied cells')
it('declares winner when X gets three in a row')
it('persists game state to URL for sharing')

// Bad
it('should work')
it('tests the game')
it('checks if winner is not null')
```

---

## NEXT STEPS FOR IMPLEMENTATION

1. **Setup Vitest** with happy-dom environment
2. **Configure coverage thresholds** (80% minimum)
3. **Write unit tests** for game logic (pure functions first)
4. **Test custom hooks** (useGameState, etc.)
5. **Test components** (user interactions, accessibility)
6. **Setup Playwright** for E2E tests
7. **Create Page Objects** for game interactions
8. **Add CI/CD integration** (run tests on every PR)
9. **Consider property-based testing** for complex logic
10. **Document testing patterns** in project README

---

## CONCLUSION

This research provides a comprehensive foundation for testing React-based correspondence games. The recommended approach combines:

- **Vitest + happy-dom** for fast, reliable unit/integration testing
- **@testing-library/react** for user-centric component testing
- **Playwright** for realistic E2E testing across browsers
- **Property-based testing** (optional) for discovering edge cases

Focus on testing user-visible behavior, maintain high coverage for game logic, and ensure accessibility throughout. The testing pyramid should emphasize unit tests (80%) with strategic integration (15%) and E2E tests (5%) for critical user journeys.

**Key Success Factors**:
1. Test behavior, not implementation
2. Use real browsers for E2E (Playwright)
3. Prioritize accessibility (role-based queries, keyboard navigation)
4. Test state persistence (URL, localStorage)
5. Maintain high coverage for game logic (95%+)
6. Keep tests fast and reliable
