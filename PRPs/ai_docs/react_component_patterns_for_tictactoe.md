# React Component Patterns Analysis for Tic-Tac-Toe Implementation

**Analysis Date:** 2025-10-09
**Purpose:** Document React component patterns from existing codebase to guide Tic-Tac-Toe component implementation
**Source Files Analyzed:** 12 component files from `src/features/game/components/`, `src/shared/components/`, and `src/framework/components/`

---

## Table of Contents
1. [Component Structure Patterns](#component-structure-patterns)
2. [TypeScript Prop Patterns](#typescript-prop-patterns)
3. [State Management Patterns](#state-management-patterns)
4. [Styling Patterns](#styling-patterns)
5. [Event Handling Patterns](#event-handling-patterns)
6. [Conditional Rendering Patterns](#conditional-rendering-patterns)
7. [Grid/Board Rendering Patterns](#gridboard-rendering-patterns)
8. [Button Interaction Patterns](#button-interaction-patterns)
9. [Status Display Patterns](#status-display-patterns)
10. [Accessibility Patterns](#accessibility-patterns)
11. [Helper Function Patterns](#helper-function-patterns)
12. [Custom Hooks](#custom-hooks)
13. [Type Safety with Zod](#type-safety-with-zod)
14. [Error Handling](#error-handling)
15. [Tic-Tac-Toe Application Examples](#tic-tac-toe-application-examples)

---

## Component Structure Patterns

### Standard File Structure

**Pattern from:** `GameBoard.tsx` (lines 1-24), `GameResults.tsx` (lines 1-27)

All components follow this consistent structure:

```typescript
/**
 * @fileoverview Component description
 * @module path/to/component
 */

import { ReactElement, MouseEvent } from 'react';
import type { GameState } from '../schemas/gameSchema';
import { Button } from '../../../shared/components/Button';

/**
 * Props interface with comprehensive JSDoc comments
 */
interface ComponentProps {
  /** Description of what this prop does */
  propName: PropType;

  /** Optional prop with default value */
  disabled?: boolean;
}

/**
 * Component documentation with examples
 *
 * @component
 * @example
 * ```tsx
 * <Component prop="value" disabled={false} />
 * ```
 */
export const Component = ({ props }: ComponentProps): ReactElement => {
  // Component implementation
};
```

**Key Principles:**
- Always use functional components with TypeScript
- Return type is always `ReactElement` (explicit, not inferred)
- Props interface defined immediately before component
- Comprehensive JSDoc with `@component` and `@example` tags
- Named exports using `export const`

---

## TypeScript Prop Patterns

### Props Interface Pattern

**Pattern from:** `GameBoard.tsx` (lines 12-24), `PlayerNamePrompt.tsx` (lines 12-18)

```typescript
interface GameBoardProps {
  /** Callback function when a choice is made */
  onChoice: (choice: 'silent' | 'talk') => void;

  /** Whether the board is disabled (e.g., waiting for opponent) */
  disabled: boolean;

  /** Current round number (1-5) */
  currentRound: number;

  /** Optional scenario instruction text to display */
  scenarioText?: string;
}
```

### For Tic-Tac-Toe Board Component:

```typescript
type Cell = 'X' | 'O' | null;
type Board = Array<Array<Cell>>;  // 3x3 grid

interface TicTacToeBoardProps {
  /** Current board state - 3x3 array of 'X' | 'O' | null */
  board: Board;

  /** Callback when player clicks a cell */
  onCellClick: (row: number, col: number) => void;

  /** Whether the board is disabled (game over or not player's turn) */
  disabled: boolean;

  /** Current player ('X' or 'O') */
  currentPlayer: 'X' | 'O';

  /** Optional winning line coordinates for highlighting */
  winningLine?: Array<{ row: number; col: number }>;
}
```

**Best Practices:**
- Use union types for restricted values (`'X' | 'O'`)
- Mark optional props with `?`
- Use callback types with explicit signatures
- Document each prop with JSDoc comment

---

## State Management Patterns

### useState with TypeScript

**Pattern from:** `PlayerNamePrompt.tsx` (lines 40-41), `GameHistoryPanel.tsx` (lines 40-41)

```typescript
// Simple state
const [name, setName] = useState<string>('');
const [error, setError] = useState<string>('');

// Boolean state
const [isCollapsed, setIsCollapsed] = useState<boolean>(true);

// Complex state with Set
const [expandedGameIds, setExpandedGameIds] = useState<Set<string>>(new Set());
```

### For Tic-Tac-Toe Game State:

```typescript
// In parent component managing game
const [board, setBoard] = useState<Board>(() => {
  // Lazy initialization
  return Array(3).fill(null).map(() => Array(3).fill(null));
});

const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
const [winner, setWinner] = useState<'X' | 'O' | 'tie' | null>(null);
const [gamePhase, setGamePhase] = useState<'playing' | 'won' | 'draw'>('playing');
```

**Best Practices:**
- Always specify generic type parameter
- Use lazy initialization for complex initial state
- Use union types for restricted state values
- Keep state minimal - derive other values

---

## Styling Patterns

### Inline CSS-in-JS with React.CSSProperties

**Pattern from:** `GameBoard.tsx` (lines 79-148), `Button.tsx` (lines 70-107)

All components use inline `React.CSSProperties` objects:

```typescript
/**
 * Container styles for the game board.
 */
const containerStyles: React.CSSProperties = {
  padding: '32px',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '2px solid #e5e7eb',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  fontFamily: 'inherit',
  textAlign: 'center',
};

/**
 * Button styles with conditional logic.
 */
const buttonStyles: React.CSSProperties = {
  padding: '10px 20px',
  fontSize: '16px',
  fontWeight: 600,
  border: 'none',
  borderRadius: '6px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.2s ease-in-out',
  opacity: disabled ? 0.6 : 1,
  fontFamily: 'inherit',
};
```

### For Tic-Tac-Toe Grid:

```typescript
const containerStyles: React.CSSProperties = {
  padding: '32px',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '2px solid #e5e7eb',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  fontFamily: 'inherit',
  textAlign: 'center',
};

const gridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 100px)',
  gridTemplateRows: 'repeat(3, 100px)',
  gap: '4px',
  backgroundColor: '#1f2937',
  padding: '4px',
  borderRadius: '8px',
  margin: '0 auto',
};

const cellStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: 'none',
  fontSize: '48px',
  fontWeight: 700,
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.2s ease-in-out',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: disabled ? 0.6 : 1,
};

const winningCellStyles: React.CSSProperties = {
  backgroundColor: '#fef3c7',
  border: '2px solid #fbbf24',
};
```

**Best Practices:**
- Define style objects as constants with `React.CSSProperties` type
- Add JSDoc comments to describe style purpose
- Use conditional styling based on props/state
- Use `fontFamily: 'inherit'` to respect parent styles
- Consistent spacing units (px for precise control)

---

## Event Handling Patterns

### Typed Event Handlers

**Pattern from:** `GameBoard.tsx` (lines 61-74), `PlayerNamePrompt.tsx` (lines 46-54)

```typescript
/**
 * Handles the "Stay Silent" button click.
 *
 * @param event - The mouse click event
 */
const handleSilent = (event: MouseEvent<HTMLButtonElement>): void => {
  event.preventDefault();
  onChoice('silent');
};

/**
 * Handles name input changes with validation.
 */
const handleNameChange = (event: ChangeEvent<HTMLInputElement>): void => {
  const newName = event.target.value;
  if (newName.length <= MAX_NAME_LENGTH) {
    setName(newName);
    setError('');
  }
};
```

### For Tic-Tac-Toe Cell Click:

```typescript
/**
 * Handles cell click with validation.
 * Creates closure to capture row and column indices.
 */
const handleCellClick = (row: number, col: number) => (
  event: MouseEvent<HTMLButtonElement>
): void => {
  event.preventDefault();

  // Validation checks
  if (disabled || board[row][col] !== null) {
    return;
  }

  // Call parent callback
  onCellClick(row, col);
};
```

**Best Practices:**
- Always type event parameters (`MouseEvent<HTMLButtonElement>`)
- Return type is always `void` for event handlers
- Call `event.preventDefault()` when needed
- Add validation before calling callbacks
- Use currying/closures to pass additional parameters

---

## Conditional Rendering Patterns

### Early Return Pattern

**Pattern from:** `GameHistoryPanel.tsx` (lines 43-46), `RoundHistory.tsx` (lines 157-166)

```typescript
// Early return for empty state
if (games.length === 0) {
  return null;
}

// Early return with empty state UI
if (completedRounds.length === 0) {
  return (
    <div style={containerStyles} role="region" aria-label="Round history">
      <h3 style={headingStyles}>Round History</h3>
      <div style={emptyStateStyles} aria-live="polite">
        No completed rounds yet
      </div>
    </div>
  );
}
```

### Inline Conditional Rendering

**Pattern from:** `GameBoard.tsx` (lines 159-163, 193-197), `GameResults.tsx` (lines 271-280)

```typescript
{/* Conditional content with && */}
{scenarioText && (
  <p style={{ ...instructionStyles, marginBottom: '16px', fontWeight: 600 }}>
    {scenarioText}
  </p>
)}

{/* Disabled state message */}
{disabled && (
  <div style={disabledMessageStyles} role="status" aria-live="polite">
    Waiting for opponent to make their choice...
  </div>
)}

{/* Optional nested content */}
{gameState.socialFeatures?.finalMessage && (
  <div style={messageBoxStyles} role="region" aria-label="Message from opponent">
    <h3 style={messageHeadingStyles}>
      {gameState.socialFeatures.finalMessage.from === 'p1' ? 'Player 1' : 'Player 2'} says:
    </h3>
    <p style={messageTextStyles}>
      {gameState.socialFeatures.finalMessage.text}
    </p>
  </div>
)}
```

### For Tic-Tac-Toe Status Display:

```typescript
{/* Winner announcement */}
{winner && (
  <div style={winnerMessageStyles} role="status" aria-live="polite">
    {winner === 'tie'
      ? "It's a tie!"
      : `Player ${winner} wins!`
    }
  </div>
)}

{/* Current player indicator */}
{!winner && (
  <div style={statusStyles} role="status" aria-live="polite">
    Current player: {currentPlayer}
  </div>
)}

{/* Cell highlighting based on winning line */}
const getCellStyles = (row: number, col: number): React.CSSProperties => {
  const isWinningCell = winningLine?.some(
    cell => cell.row === row && cell.col === col
  );

  return {
    ...cellStyles,
    ...(isWinningCell ? winningCellStyles : {}),
  };
};
```

**Best Practices:**
- Use early returns for simple null/empty cases
- Use `&&` for showing/hiding single elements
- Use ternary for choosing between two elements
- Use optional chaining (`?.`) for deeply nested checks
- Spread operator for conditional style merging

---

## Grid/Board Rendering Patterns

### Dynamic Grid with map()

**Pattern from:** `DynamicChoiceBoard.tsx` (lines 149-169), `DynamicPayoffMatrix.tsx` (lines 122-186)

```typescript
// Single-level grid
<div style={gridStyles}>
  {config.choices.map((choice) => (
    <ChoiceButton
      key={choice.id}
      choice={choice}
      onClick={() => onChoiceSelected(choice.id)}
      disabled={disabled}
    />
  ))}
</div>

// Nested grid (table with rows and cells)
<tbody>
  {matrix.map((row, rowIndex) => {
    const p1Choice = config.choices[rowIndex];
    if (!p1Choice) return null;

    return (
      <tr key={p1Choice.id}>
        <th style={headerStyles}>{p1Choice.label}</th>
        {row.map((cell, colIndex) => (
          <td key={colIndex} style={cellStyles}>
            {/* Cell content */}
          </td>
        ))}
      </tr>
    );
  })}
</tbody>
```

### For Tic-Tac-Toe 3x3 Grid (Two Approaches):

#### Approach 1: Nested map with 2D array

```typescript
export const TicTacToeBoard = ({
  board,
  onCellClick,
  disabled,
  winningLine
}: TicTacToeBoardProps): ReactElement => {
  const handleCellClick = (row: number, col: number) => (
    event: MouseEvent<HTMLButtonElement>
  ): void => {
    event.preventDefault();
    if (disabled || board[row][col] !== null) {
      return;
    }
    onCellClick(row, col);
  };

  const isWinningCell = (row: number, col: number): boolean => {
    return winningLine?.some(
      cell => cell.row === row && cell.col === col
    ) ?? false;
  };

  return (
    <div style={containerStyles}>
      <div style={gridStyles}>
        {board.map((row, rowIndex) => (
          row.map((cell, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              onClick={handleCellClick(rowIndex, colIndex)}
              disabled={disabled || cell !== null}
              style={{
                ...cellStyles,
                ...(isWinningCell(rowIndex, colIndex) ? winningCellStyles : {}),
              }}
              role="gridcell"
              aria-label={`Row ${rowIndex + 1}, Column ${colIndex + 1}${
                cell ? `, contains ${cell}` : ', empty'
              }`}
              aria-pressed={cell !== null}
            >
              {cell || ''}
            </button>
          ))
        ))}
      </div>
    </div>
  );
};
```

#### Approach 2: Flat array with index calculation (like React tutorial)

```typescript
// Convert 2D array to flat array for easier indexing
const flatBoard = board.flat();

return (
  <div style={gridStyles}>
    {flatBoard.map((cell, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;

      return (
        <button
          key={index}
          onClick={handleCellClick(row, col)}
          disabled={disabled || cell !== null}
          style={{
            ...cellStyles,
            ...(isWinningCell(row, col) ? winningCellStyles : {}),
          }}
        >
          {cell || ''}
        </button>
      );
    })}
  </div>
);
```

**Best Practices:**
- Always use unique `key` prop (prefer IDs over indices when possible)
- For 2D grids, use `${row}-${col}` as key
- Extract render logic into helper functions for complex cells
- Use CSS Grid for layout (not nested divs)
- Handle null/undefined cases in map predicates

---

## Button Interaction Patterns

### Reusable Button Component

**Pattern from:** `Button.tsx` (lines 59-153)

```typescript
interface ButtonProps {
  /** Visual style variant of the button */
  variant: 'primary' | 'secondary';

  /** Click handler for the button */
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;

  /** Content to be rendered inside the button */
  children: React.ReactNode;

  /** Whether the button is disabled @default false */
  disabled?: boolean;

  /** Button type attribute @default 'button' */
  type?: 'button' | 'submit' | 'reset';

  /** ARIA label for accessibility (optional, falls back to children text) */
  ariaLabel?: string;
}

export const Button = ({
  variant,
  onClick,
  children,
  disabled = false,
  type = 'button',
  ariaLabel,
}: ButtonProps): ReactElement => {
  // Style objects
  const baseStyles: React.CSSProperties = { /* ... */ };
  const variantStyles: Record<'primary' | 'secondary', React.CSSProperties> = {
    primary: { /* ... */ },
    secondary: { /* ... */ },
  };
  const hoverStyles: Record<'primary' | 'secondary', React.CSSProperties> = {
    primary: { /* ... */ },
    secondary: { /* ... */ },
  };

  // Hover handlers
  const handleMouseEnter = (event: MouseEvent<HTMLButtonElement>): void => {
    if (!disabled) {
      Object.assign(event.currentTarget.style, hoverStyles[variant]);
    }
  };

  const handleMouseLeave = (event: MouseEvent<HTMLButtonElement>): void => {
    if (!disabled) {
      Object.assign(event.currentTarget.style, variantStyles[variant]);
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...baseStyles, ...variantStyles[variant] }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={ariaLabel}
      aria-disabled={disabled}
    >
      {children}
    </button>
  );
};
```

### Using Button in Tic-Tac-Toe:

```typescript
import { Button } from '../../../shared/components/Button';

// New game button
<Button
  variant="primary"
  onClick={handleNewGame}
  ariaLabel="Start a new game"
>
  New Game
</Button>

// Reset button
<Button
  variant="secondary"
  onClick={handleReset}
  disabled={gamePhase !== 'won' && gamePhase !== 'draw'}
  ariaLabel="Reset current game"
>
  Reset
</Button>
```

**Best Practices:**
- Use the shared `Button` component (don't reinvent)
- Provide meaningful `ariaLabel` for accessibility
- Set `disabled` based on game state
- Use `variant` to distinguish primary/secondary actions

---

## Status Display Patterns

### Status Messages with ARIA

**Pattern from:** `GameBoard.tsx` (lines 193-197), `GameResults.tsx` (lines 234-237), `LoadingSpinner.tsx` (lines 84-105)

```typescript
{/* Waiting state */}
{disabled && (
  <div style={disabledMessageStyles} role="status" aria-live="polite">
    Waiting for opponent to make their choice...
  </div>
)}

{/* Winner announcement */}
<div style={winnerStyles} role="status" aria-live="polite" aria-atomic="true">
  {determineWinner()}
</div>

{/* Loading spinner */}
<div
  role="status"
  aria-live="polite"
  aria-busy="true"
  style={containerStyles}
>
  <div style={spinnerStyles} aria-hidden="true" />
  <span style={messageStyles} aria-label={message}>
    {message}
  </span>
</div>
```

### For Tic-Tac-Toe Status:

```typescript
const statusStyles: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 600,
  marginBottom: '16px',
  color: '#1f2937',
  textAlign: 'center',
};

const winnerMessageStyles: React.CSSProperties = {
  fontSize: '32px',
  fontWeight: 700,
  marginBottom: '24px',
  color: '#4f46e5',
  textAlign: 'center',
};

{/* Game status display */}
<div style={statusStyles} role="status" aria-live="polite">
  {winner
    ? winner === 'tie'
      ? "It's a tie!"
      : `Player ${winner} wins!`
    : `Current player: ${currentPlayer}`
  }
</div>

{/* Waiting for turn */}
{!isMyTurn && gamePhase === 'playing' && (
  <div style={waitingMessageStyles} role="status" aria-live="polite">
    Waiting for opponent's move...
  </div>
)}
```

**Best Practices:**
- Always use `role="status"` for dynamic status messages
- Use `aria-live="polite"` for non-urgent updates
- Use `aria-atomic="true"` when entire message should be announced
- Use `aria-busy="true"` for loading states
- Hide decorative elements with `aria-hidden="true"`

---

## Accessibility Patterns

### ARIA Attributes

**Pattern from:** `GameBoard.tsx` (lines 150-187), `PayoffMatrix.tsx` (lines 119-144)

```typescript
{/* Container with region role */}
<div
  style={containerStyles}
  role="region"
  aria-label="Game board"
  aria-live="polite"
  aria-atomic="true"
>
  <h2 style={headingStyles}>Round {currentRound}</h2>

  {/* Button group */}
  <div style={buttonContainerStyles} role="group" aria-label="Choice buttons">
    <Button
      variant="primary"
      onClick={handleSilent}
      disabled={disabled}
      ariaLabel="Choose to stay silent and cooperate"
    >
      Stay Silent
    </Button>
  </div>
</div>

{/* Table with scope attributes */}
<table style={tableStyles} role="table" aria-label="Prisoner's Dilemma payoff outcomes">
  <thead>
    <tr>
      <th style={headerCellStyles} scope="col" aria-label="Choice combinations">
        Your Choice / Their Choice
      </th>
    </tr>
  </thead>
</table>
```

### For Tic-Tac-Toe Accessibility:

```typescript
<div role="region" aria-label="Tic-Tac-Toe game board">
  {/* Game status */}
  <div style={statusStyles} role="status" aria-live="polite">
    {getStatusMessage()}
  </div>

  {/* 3x3 Grid */}
  <div style={gridStyles} role="grid" aria-label="3x3 game grid">
    {board.map((row, rowIndex) => (
      row.map((cell, colIndex) => (
        <button
          key={`${rowIndex}-${colIndex}`}
          role="gridcell"
          aria-label={`Row ${rowIndex + 1}, Column ${colIndex + 1}${
            cell ? `, contains ${cell}` : ', empty'
          }${isWinningCell(rowIndex, colIndex) ? ', winning position' : ''}`}
          aria-pressed={cell !== null}
          aria-disabled={disabled || cell !== null}
          disabled={disabled || cell !== null}
          onClick={handleCellClick(rowIndex, colIndex)}
          style={getCellStyles(rowIndex, colIndex)}
        >
          {cell || ''}
        </button>
      ))
    ))}
  </div>

  {/* Action buttons */}
  <div style={buttonContainerStyles} role="group" aria-label="Game actions">
    <Button variant="primary" onClick={handleNewGame} ariaLabel="Start new game">
      New Game
    </Button>
  </div>
</div>
```

**Accessibility Checklist:**
- [ ] Use semantic HTML elements (`<button>`, `<table>`, etc.)
- [ ] Provide `role` attributes for custom elements
- [ ] Add `aria-label` for all interactive elements
- [ ] Use `aria-live` for dynamic content
- [ ] Include `aria-pressed` for toggle buttons
- [ ] Add `aria-disabled` in addition to `disabled`
- [ ] Use `scope` on table headers
- [ ] Ensure keyboard navigation works (Tab, Enter, Space)

---

## Helper Function Patterns

### Utility Functions Inside Components

**Pattern from:** `GameResults.tsx` (lines 88-99), `RoundHistory.tsx` (lines 113-145)

```typescript
/**
 * Determines the game winner based on final totals.
 *
 * @returns Winner description string
 */
const determineWinner = (): string => {
  const p1Gold = gameState.totals.p1Gold;
  const p2Gold = gameState.totals.p2Gold;

  if (p1Gold > p2Gold) {
    return `${gameState.players.p1.name || 'Player 1'} wins!`;
  } else if (p2Gold > p1Gold) {
    return `${gameState.players.p2.name || 'Player 2'} wins!`;
  } else {
    return "It's a tie!";
  }
};

/**
 * Styles for highlighting the latest round.
 *
 * @param isLatest - Whether this is the most recent round
 * @returns Cell styles with optional highlight
 */
const getRowStyles = (isLatest: boolean): React.CSSProperties => ({
  backgroundColor: isLatest ? '#fef3c7' : '#ffffff',
});

/**
 * Formats choice text for display.
 *
 * @param choice - The choice value ('silent' or 'talk')
 * @returns Formatted choice text
 */
const formatChoice = (choice: 'silent' | 'talk'): string => {
  return choice === 'silent' ? 'Silent' : 'Talk';
};
```

### For Tic-Tac-Toe Game Logic:

```typescript
/**
 * Checks if there's a winner on the current board.
 *
 * @param board - Current board state
 * @returns Winner info or null
 */
const checkWinner = (board: Board): {
  winner: 'X' | 'O' | 'tie' | null;
  winningLine?: Array<{ row: number; col: number }>;
} => {
  // Check rows
  for (let row = 0; row < 3; row++) {
    if (
      board[row][0] &&
      board[row][0] === board[row][1] &&
      board[row][0] === board[row][2]
    ) {
      return {
        winner: board[row][0],
        winningLine: [
          { row, col: 0 },
          { row, col: 1 },
          { row, col: 2 },
        ],
      };
    }
  }

  // Check columns
  for (let col = 0; col < 3; col++) {
    if (
      board[0][col] &&
      board[0][col] === board[1][col] &&
      board[0][col] === board[2][col]
    ) {
      return {
        winner: board[0][col],
        winningLine: [
          { row: 0, col },
          { row: 1, col },
          { row: 2, col },
        ],
      };
    }
  }

  // Check diagonals
  if (
    board[0][0] &&
    board[0][0] === board[1][1] &&
    board[0][0] === board[2][2]
  ) {
    return {
      winner: board[0][0],
      winningLine: [
        { row: 0, col: 0 },
        { row: 1, col: 1 },
        { row: 2, col: 2 },
      ],
    };
  }

  if (
    board[0][2] &&
    board[0][2] === board[1][1] &&
    board[0][2] === board[2][0]
  ) {
    return {
      winner: board[0][2],
      winningLine: [
        { row: 0, col: 2 },
        { row: 1, col: 1 },
        { row: 2, col: 0 },
      ],
    };
  }

  // Check for tie (board full, no winner)
  const isBoardFull = board.every(row => row.every(cell => cell !== null));
  if (isBoardFull) {
    return { winner: 'tie' };
  }

  return { winner: null };
};

/**
 * Checks if board is full (all cells occupied).
 */
const isBoardFull = (board: Board): boolean => {
  return board.every(row => row.every(cell => cell !== null));
};

/**
 * Creates an empty 3x3 board.
 */
const createEmptyBoard = (): Board => {
  return Array(3).fill(null).map(() => Array(3).fill(null));
};
```

**Best Practices:**
- Define helper functions inside component for access to props/state
- Add comprehensive JSDoc comments
- Type all parameters and return values explicitly
- Use pure functions for calculations (no side effects)
- Extract complex logic into named functions

---

## Custom Hooks

### useClipboard Hook Example

**Pattern from:** `useClipboard.ts` (lines 42-93)

```typescript
/**
 * Result type for useClipboard hook
 */
export interface UseClipboardResult {
  /** Function to copy text to clipboard */
  copyToClipboard: (text: string) => Promise<void>;
  /** Whether the text was recently copied */
  isCopied: boolean;
  /** Error if copy failed */
  error: Error | null;
}

/**
 * Custom hook for copying text to clipboard
 *
 * Provides clipboard functionality with success/error states
 * Auto-resets isCopied state after specified delay
 *
 * @param resetDelay - Time in ms before resetting isCopied state (default: 2000)
 * @returns Clipboard utilities
 */
export function useClipboard(resetDelay = 2000): UseClipboardResult {
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const copyToClipboard = useCallback(
    async (text: string): Promise<void> => {
      try {
        // Use modern Clipboard API if available
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();

          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);

          if (!successful) {
            throw new Error('Failed to copy text using fallback method');
          }
        }

        setIsCopied(true);
        setError(null);

        // Reset copied state after delay
        setTimeout(() => {
          setIsCopied(false);
        }, resetDelay);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to copy to clipboard');
        setError(error);
        setIsCopied(false);
        console.error('Clipboard copy failed:', error);
      }
    },
    [resetDelay]
  );

  return {
    copyToClipboard,
    isCopied,
    error,
  };
}
```

### Custom Hook for Tic-Tac-Toe Game Logic:

```typescript
/**
 * Result type for useTicTacToe hook
 */
export interface UseTicTacToeResult {
  board: Board;
  currentPlayer: 'X' | 'O';
  gamePhase: 'playing' | 'won' | 'draw';
  winner: 'X' | 'O' | 'tie' | null;
  winningLine?: Array<{ row: number; col: number }>;
  makeMove: (row: number, col: number) => boolean;
  resetGame: () => void;
}

/**
 * Custom hook for Tic-Tac-Toe game logic
 *
 * Encapsulates all game state and logic
 *
 * @returns Game state and control functions
 */
export function useTicTacToe(): UseTicTacToeResult {
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [gamePhase, setGamePhase] = useState<'playing' | 'won' | 'draw'>('playing');
  const [winner, setWinner] = useState<'X' | 'O' | 'tie' | null>(null);
  const [winningLine, setWinningLine] = useState<Array<{ row: number; col: number }>>();

  /**
   * Makes a move on the board if valid
   *
   * @param row - Row index (0-2)
   * @param col - Column index (0-2)
   * @returns true if move was successful, false otherwise
   */
  const makeMove = useCallback((row: number, col: number): boolean => {
    // Validate move
    if (gamePhase !== 'playing' || board[row][col] !== null) {
      return false;
    }

    // Update board
    const newBoard = board.map((r, rIdx) =>
      r.map((cell, cIdx) =>
        rIdx === row && cIdx === col ? currentPlayer : cell
      )
    );
    setBoard(newBoard);

    // Check for winner or draw
    const result = checkWinner(newBoard);

    if (result.winner) {
      setWinner(result.winner);
      setWinningLine(result.winningLine);
      setGamePhase(result.winner === 'tie' ? 'draw' : 'won');
    } else {
      // Switch player
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }

    return true;
  }, [board, currentPlayer, gamePhase]);

  /**
   * Resets game to initial state
   */
  const resetGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setCurrentPlayer('X');
    setGamePhase('playing');
    setWinner(null);
    setWinningLine(undefined);
  }, []);

  return {
    board,
    currentPlayer,
    gamePhase,
    winner,
    winningLine,
    makeMove,
    resetGame,
  };
}
```

**Best Practices:**
- Define result interface with explicit types
- Use `useCallback` for functions that may be passed as props
- Document all parameters and return values
- Handle errors gracefully
- Provide cleanup/reset functionality

---

## Type Safety with Zod

### Schema Definition Pattern

**Pattern from:** `gameSchema.ts` (lines 13-194)

```typescript
import { z } from 'zod';

/**
 * Choice type - either 'silent' (cooperate) or 'talk' (defect)
 */
export const ChoiceSchema = z.enum(['silent', 'talk']);
export type Choice = z.infer<typeof ChoiceSchema>;

/**
 * Player information schema
 */
export const PlayerInfoSchema = z.object({
  /** Unique identifier for the player */
  id: z.string().min(1),
  /** Optional display name for the player */
  name: z.string().optional(),
  /** Whether this player is currently active */
  isActive: z.boolean(),
});
export type PlayerInfo = z.infer<typeof PlayerInfoSchema>;

/**
 * Complete game state schema
 */
export const GameStateSchema = z.object({
  version: z.literal('1.0.0'),
  gameId: z.string().uuid(),
  players: z.object({
    p1: PlayerInfoSchema,
    p2: PlayerInfoSchema,
  }),
  currentRound: z.number().int().min(0).max(4),
  // ... more fields
});

export type GameState = z.infer<typeof GameStateSchema>;

/**
 * Validates unknown data as a valid game state
 */
export function validateGameState(data: unknown): GameState {
  return GameStateSchema.parse(data);
}

/**
 * Safely validates game state without throwing
 */
export function safeValidateGameState(data: unknown): z.SafeParseReturnType<unknown, GameState> {
  return GameStateSchema.safeParse(data);
}
```

### For Tic-Tac-Toe State Schema:

```typescript
import { z } from 'zod';

/**
 * Cell value schema - 'X', 'O', or null
 */
export const CellSchema = z.enum(['X', 'O']).nullable();
export type Cell = z.infer<typeof CellSchema>;

/**
 * Board schema - 3x3 array of cells
 */
export const BoardSchema = z.array(
  z.array(CellSchema).length(3)
).length(3);
export type Board = z.infer<typeof BoardSchema>;

/**
 * Winning line coordinate
 */
export const CoordinateSchema = z.object({
  row: z.number().int().min(0).max(2),
  col: z.number().int().min(0).max(2),
});
export type Coordinate = z.infer<typeof CoordinateSchema>;

/**
 * Game phase enum
 */
export const GamePhaseSchema = z.enum(['playing', 'won', 'draw']);
export type GamePhase = z.infer<typeof GamePhaseSchema>;

/**
 * Complete Tic-Tac-Toe game state schema
 */
export const TicTacToeStateSchema = z.object({
  /** Schema version for backward compatibility */
  version: z.literal('1.0.0'),

  /** Unique game identifier */
  gameId: z.string().uuid(),

  /** 3x3 board state */
  board: BoardSchema,

  /** Current player */
  currentPlayer: z.enum(['X', 'O']),

  /** Game phase */
  gamePhase: GamePhaseSchema,

  /** Winner (if game is over) */
  winner: z.enum(['X', 'O', 'tie']).nullable(),

  /** Winning line coordinates (if winner exists) */
  winningLine: z.array(CoordinateSchema).optional(),

  /** Number of moves made */
  moveCount: z.number().int().min(0).max(9),

  /** Timestamp of last move */
  lastMoveAt: z.string().datetime(),
});

export type TicTacToeState = z.infer<typeof TicTacToeStateSchema>;

/**
 * Validates unknown data as valid Tic-Tac-Toe state
 */
export function validateTicTacToeState(data: unknown): TicTacToeState {
  return TicTacToeStateSchema.parse(data);
}

/**
 * Safely validates Tic-Tac-Toe state without throwing
 */
export function safeValidateTicTacToeState(
  data: unknown
): z.SafeParseReturnType<unknown, TicTacToeState> {
  return TicTacToeStateSchema.safeParse(data);
}
```

**Best Practices:**
- Define schema first, then infer TypeScript type
- Use `.parse()` when you want errors to throw
- Use `.safeParse()` when you want to handle errors
- Add JSDoc comments to schemas
- Use `.length()` for fixed-size arrays
- Use `.min()` and `.max()` for validation
- Use branded types for extra type safety

---

## Error Handling

### ErrorBoundary Class Component

**Pattern from:** `ErrorBoundary.tsx` (lines 61-234)

```typescript
import React, { ReactElement, ReactNode, ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactElement;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error component stack:', errorInfo.componentStack);

    this.setState({ errorInfo });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div role="alert" aria-live="assertive" style={{ /* ... */ }}>
          <h2>Something went wrong</h2>
          <p>We encountered an unexpected error.</p>
          {this.state.error && (
            <details>
              <summary>Error details</summary>
              <pre>{this.state.error.toString()}</pre>
            </details>
          )}
          <button onClick={this.handleReset}>Try Again</button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Using ErrorBoundary:

```typescript
import { ErrorBoundary } from '../../../shared/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <TicTacToeGame />
    </ErrorBoundary>
  );
}

// Or with custom fallback
<ErrorBoundary
  fallback={<div>Game encountered an error. Please refresh.</div>}
  onError={(error, errorInfo) => {
    // Log to error tracking service
    console.error('Game error:', error, errorInfo);
  }}
>
  <TicTacToeGame />
</ErrorBoundary>
```

---

## Tic-Tac-Toe Application Examples

### Complete Component Implementation

```typescript
/**
 * @fileoverview Tic-Tac-Toe game board component
 * @module games/tic-tac-toe/components/TicTacToeBoard
 */

import { ReactElement, MouseEvent } from 'react';
import { Button } from '../../../shared/components/Button';

type Cell = 'X' | 'O' | null;
type Board = Array<Array<Cell>>;

interface TicTacToeBoardProps {
  /** Current board state - 3x3 array */
  board: Board;

  /** Callback when player clicks a cell */
  onCellClick: (row: number, col: number) => void;

  /** Whether the board is disabled */
  disabled: boolean;

  /** Current player */
  currentPlayer: 'X' | 'O';

  /** Winner if game is over */
  winner: 'X' | 'O' | 'tie' | null;

  /** Winning line coordinates */
  winningLine?: Array<{ row: number; col: number }>;

  /** Callback to reset game */
  onReset: () => void;
}

/**
 * Tic-Tac-Toe game board component
 *
 * @component
 * @example
 * ```tsx
 * <TicTacToeBoard
 *   board={board}
 *   onCellClick={handleCellClick}
 *   disabled={false}
 *   currentPlayer="X"
 *   winner={null}
 *   onReset={handleReset}
 * />
 * ```
 */
export const TicTacToeBoard = ({
  board,
  onCellClick,
  disabled,
  currentPlayer,
  winner,
  winningLine,
  onReset,
}: TicTacToeBoardProps): ReactElement => {
  /**
   * Container styles
   */
  const containerStyles: React.CSSProperties = {
    padding: '32px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '2px solid #e5e7eb',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    fontFamily: 'inherit',
    textAlign: 'center',
    maxWidth: '500px',
    margin: '0 auto',
  };

  /**
   * Grid styles
   */
  const gridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 100px)',
    gridTemplateRows: 'repeat(3, 100px)',
    gap: '4px',
    backgroundColor: '#1f2937',
    padding: '4px',
    borderRadius: '8px',
    margin: '24px auto',
  };

  /**
   * Cell button styles
   */
  const cellStyles: React.CSSProperties = {
    backgroundColor: '#ffffff',
    border: 'none',
    fontSize: '48px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#1f2937',
  };

  /**
   * Winning cell styles
   */
  const winningCellStyles: React.CSSProperties = {
    backgroundColor: '#fef3c7',
    border: '2px solid #fbbf24',
  };

  /**
   * Status message styles
   */
  const statusStyles: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 600,
    marginBottom: '16px',
    color: '#1f2937',
  };

  /**
   * Winner message styles
   */
  const winnerMessageStyles: React.CSSProperties = {
    fontSize: '32px',
    fontWeight: 700,
    marginBottom: '24px',
    color: '#4f46e5',
  };

  /**
   * Handles cell click with validation
   */
  const handleCellClick = (row: number, col: number) => (
    event: MouseEvent<HTMLButtonElement>
  ): void => {
    event.preventDefault();

    if (disabled || board[row][col] !== null || winner) {
      return;
    }

    onCellClick(row, col);
  };

  /**
   * Checks if cell is part of winning line
   */
  const isWinningCell = (row: number, col: number): boolean => {
    return winningLine?.some(
      cell => cell.row === row && cell.col === col
    ) ?? false;
  };

  /**
   * Gets status message based on game state
   */
  const getStatusMessage = (): string => {
    if (winner === 'tie') {
      return "It's a tie!";
    }
    if (winner) {
      return `Player ${winner} wins!`;
    }
    return `Current player: ${currentPlayer}`;
  };

  return (
    <div style={containerStyles} role="region" aria-label="Tic-Tac-Toe game">
      <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '24px' }}>
        Tic-Tac-Toe
      </h2>

      {/* Game status */}
      <div
        style={winner ? winnerMessageStyles : statusStyles}
        role="status"
        aria-live="polite"
      >
        {getStatusMessage()}
      </div>

      {/* Game grid */}
      <div style={gridStyles} role="grid" aria-label="3x3 game grid">
        {board.map((row, rowIndex) => (
          row.map((cell, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              onClick={handleCellClick(rowIndex, colIndex)}
              disabled={disabled || cell !== null || winner !== null}
              style={{
                ...cellStyles,
                ...(isWinningCell(rowIndex, colIndex) ? winningCellStyles : {}),
                cursor: disabled || cell !== null || winner ? 'not-allowed' : 'pointer',
                opacity: disabled || cell !== null ? 0.6 : 1,
              }}
              role="gridcell"
              aria-label={`Row ${rowIndex + 1}, Column ${colIndex + 1}${
                cell ? `, contains ${cell}` : ', empty'
              }${isWinningCell(rowIndex, colIndex) ? ', winning position' : ''}`}
              aria-pressed={cell !== null}
              aria-disabled={disabled || cell !== null || winner !== null}
            >
              {cell || ''}
            </button>
          ))
        ))}
      </div>

      {/* Action buttons */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          marginTop: '24px',
        }}
        role="group"
        aria-label="Game actions"
      >
        <Button
          variant="primary"
          onClick={onReset}
          ariaLabel="Start new game"
        >
          New Game
        </Button>
      </div>
    </div>
  );
};
```

---

## Summary: Key Patterns for Tic-Tac-Toe

### Component Structure
- ✅ Functional components with TypeScript
- ✅ Return type: `ReactElement`
- ✅ Comprehensive JSDoc comments
- ✅ Named exports with `export const`

### Props & State
- ✅ Interface with JSDoc for each prop
- ✅ Use `useState` with explicit types
- ✅ Union types for restricted values
- ✅ Keep state minimal, derive other values

### Styling
- ✅ Inline `React.CSSProperties` objects
- ✅ Style objects as constants with JSDoc
- ✅ Conditional styling based on state
- ✅ CSS Grid for 3x3 layout

### Events & Interactions
- ✅ Type all event handlers
- ✅ Call `event.preventDefault()` when needed
- ✅ Validate before state updates
- ✅ Use currying for parameterized handlers

### Rendering
- ✅ Early returns for null/empty cases
- ✅ `&&` for conditional elements
- ✅ Ternary for binary choices
- ✅ `map()` for lists/grids with unique keys

### Accessibility
- ✅ ARIA attributes on all elements
- ✅ `role="status"` for dynamic messages
- ✅ `aria-live="polite"` for updates
- ✅ Semantic HTML (`<button>`, not `<div>`)

### Helper Functions
- ✅ Define inside component
- ✅ Type parameters and returns
- ✅ Add JSDoc comments
- ✅ Pure functions when possible

### Custom Hooks
- ✅ Encapsulate game logic
- ✅ Return interface with explicit types
- ✅ Use `useCallback` for functions
- ✅ Handle errors gracefully

### Type Safety
- ✅ Zod schemas for validation
- ✅ Infer TypeScript types from schemas
- ✅ Use `.parse()` or `.safeParse()`
- ✅ Validate external data

### Error Handling
- ✅ Wrap in `ErrorBoundary`
- ✅ Custom fallback UI
- ✅ Log errors appropriately
- ✅ Provide recovery options

---

## Recommended File Structure

```
src/games/tic-tac-toe/
├── components/
│   ├── TicTacToeBoard.tsx        # Main game board component
│   ├── TicTacToeCell.tsx         # Individual cell (if needed)
│   ├── TicTacToeStatus.tsx       # Status/winner display
│   └── TicTacToeControls.tsx     # Reset/new game buttons
├── hooks/
│   └── useTicTacToe.ts           # Game logic hook
├── schemas/
│   └── ticTacToeSchema.ts        # Zod schemas
├── utils/
│   ├── gameLogic.ts              # Win detection, etc.
│   └── boardHelpers.ts           # Board manipulation
└── types/
    └── index.ts                  # TypeScript types
```

---

**Analysis Complete**
**Total Patterns Documented:** 15 major categories
**Source Files Analyzed:** 12 React components
**Ready for Implementation:** ✅
