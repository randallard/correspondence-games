# Prisoner's Dilemma vs Tic-Tac-Toe: Quick Reference

**Purpose**: Fast comparison for AI agents implementing Tic-Tac-Toe PRP

---

## Core Differences Table

| Feature | Prisoner's Dilemma | Tic-Tac-Toe |
|---------|-------------------|-------------|
| **Game Type** | Simultaneous choice | Sequential turns |
| **State Core** | `rounds[]` with choices | `board[][]` with marks |
| **Progress** | `currentRound: 0-4` | `currentTurn: number` |
| **Players** | p1, p2 (both choose each round) | X, O (alternating) |
| **Length** | Fixed 5 rounds | Variable 5-9 moves |
| **End Condition** | After round 5 | Win pattern or draw |
| **Scoring** | Points accumulation | Win/Loss/Draw |
| **Lock Target** | Round choice | Board position |

---

## Schema Transformation

### Remove from GameState:
```typescript
rounds: z.array(RoundSchema).length(5)
currentRound: z.number().int().min(0).max(4)
totals: z.object({ p1Gold, p2Gold })
```

### Add to GameState:
```typescript
board: z.array(z.array(z.enum(['X', 'O', '']).nullable())).length(3)
moves: z.array(MoveSchema)
currentTurn: z.number().int().min(0)
currentPlayer: z.enum(['X', 'O'])
winner: z.enum(['X', 'O', 'draw']).nullable()
winningLine: z.array(PositionSchema).optional()
```

---

## Hook Logic Changes

### makeChoice → makeMove

**Prisoner's Dilemma:**
```typescript
makeChoice(playerId: 'p1' | 'p2', choice: Choice) {
  updateRound(choice)
  if (bothChosen) {
    calculateResults()
    updateTotals()
    advanceRound()
  }
}
```

**Tic-Tac-Toe:**
```typescript
makeMove(position: Position) {
  board[row][col] = currentPlayer
  moves.push({ position, player: currentPlayer })

  winner = checkWinner(board)
  if (winner || moves.length === 9) {
    gamePhase = 'finished'
  } else {
    currentPlayer = toggle(currentPlayer)
  }
}
```

---

## Component Changes

### GameBoard

**PD:** 2 buttons (Silent/Talk)
**TTT:** 3x3 grid of cells

```tsx
// PD GameBoard
<Button onClick={() => onChoice('silent')}>Silent</Button>
<Button onClick={() => onChoice('talk')}>Talk</Button>

// TTT GameBoard
{board.map((row, r) => (
  row.map((cell, c) => (
    <Cell onClick={() => onMove({row: r, col: c})}>
      {cell}
    </Cell>
  ))
))}
```

---

## Rendering Logic

### Prisoner's Dilemma (Complex):
```typescript
// Multiple branches for simultaneous choices
if (waitingForP1 && waitingForP2) {
  // Show first player's interface based on round
} else if (!waitingForP1 && waitingForP2) {
  // P1 chose, show P2's interface
} else if (waitingForP1 && !waitingForP2) {
  // P2 chose, show P1's interface
}
```

### Tic-Tac-Toe (Simple):
```typescript
// Just show whose turn it is
<h2>Current Turn: {currentPlayer}</h2>
<GameBoard
  disabled={!isYourTurn}
  onMove={handleMove}
/>
```

---

## Reusable Framework Code

### Use As-Is:
- ✅ `encryption.ts` (entire file)
- ✅ `urlGeneration.ts` (entire file)
- ✅ `hmacManager.ts` (entire file)
- ✅ `useURLState.ts` (entire hook)
- ✅ `useGameHistory.ts` (change storage key only)
- ✅ `choiceLockManager.ts` (adapt "round" → "turn")

### Must Rebuild:
- ❌ `gameSchema.ts` (completely different structure)
- ❌ `payoffCalculation.ts` → `ticTacToeLogic.ts`
- ❌ `useGameState.ts` (adapt makeChoice → makeMove)
- ❌ `GameBoard.tsx` (2 buttons → 3x3 grid)

---

## Critical Patterns to Keep

### 1. URL State Flow
```typescript
// Mount → Load URL → Parse → Validate → Load Game
useEffect(() => {
  const state = parseGameStateFromURL()
  if (state) loadGame(state)
}, [])
```

### 2. Save on Finish
```typescript
useEffect(() => {
  if (gamePhase === 'finished' && !savedGamesRef.current.has(gameId)) {
    addCompletedGame(convertToCompleted(gameState))
    savedGamesRef.current.add(gameId)
  }
}, [gameState, gamePhase])
```

### 3. Choice Lock Pattern
```typescript
// Before accepting move:
validateChoice(gameId, turn, player, position)
// Then lock it:
lockChoice(gameId, turn, player, position)
```

### 4. Validation Layer
```typescript
// ALL external data through Zod:
const gameState = validateGameState(decryptedData)
```

---

## Win Detection Algorithm (Required New Logic)

```typescript
export function checkWinner(board: Board): 'X' | 'O' | 'draw' | null {
  // Check rows
  for (let r = 0; r < 3; r++) {
    if (board[r][0] && board[r][0] === board[r][1] && board[r][1] === board[r][2]) {
      return board[r][0]
    }
  }

  // Check columns
  for (let c = 0; c < 3; c++) {
    if (board[0][c] && board[0][c] === board[1][c] && board[1][c] === board[2][c]) {
      return board[0][c]
    }
  }

  // Check diagonals
  if (board[0][0] && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
    return board[0][0]
  }
  if (board[0][2] && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
    return board[0][2]
  }

  // Check draw
  if (board.every(row => row.every(cell => cell !== null))) {
    return 'draw'
  }

  return null
}
```

---

## localStorage Changes

**Change:**
```typescript
// PD
const STORAGE_KEY = 'prisoners-dilemma-history'

// TTT
const STORAGE_KEY = 'tic-tac-toe-history'
```

**CompletedGame Structure:**
```typescript
// Remove:
rounds: Round[]
totals: { p1Gold, p2Gold }

// Add:
moves: Move[]
winner: 'X' | 'O' | 'draw'
winningLine?: Position[]
finalBoard: Board
```

---

## Implementation Priority

### Phase 1: Core (Critical)
1. Board schema + validation
2. Win detection logic
3. Move validation
4. Game state creation

### Phase 2: UI (Important)
5. TicTacToeBoard component (3x3 grid)
6. Adapt GameResults
7. Update App.tsx rendering

### Phase 3: Integration (Polish)
8. Choice locking for positions
9. localStorage with new schema
10. URL state (works automatically)
11. Rematch flow

---

## Common Pitfalls

### 1. Don't Mix Game Logic
❌ Trying to reuse `payoffCalculation.ts` logic
✅ Create new `ticTacToeLogic.ts` with board operations

### 2. Don't Overcomplicate Rendering
❌ Using PD's complex simultaneous choice logic
✅ Simple sequential turn logic (simpler than PD!)

### 3. Don't Skip Validation
❌ Trusting URL/localStorage data
✅ Always validate through Zod schemas

### 4. Don't Rebuild Framework
❌ Rewriting encryption/URL/localStorage code
✅ Reuse framework, only change game-specific parts

---

## File Structure Mirror

```
src/features/
  tictactoe/              # NEW - mirror prisoners-dilemma structure
    schemas/
      gameSchema.ts       # REBUILD - board-based state
    hooks/
      useGameState.ts     # ADAPT - makeMove logic
      useURLState.ts      # REUSE - no changes
      useLocalStorage.ts  # ADAPT - change STORAGE_KEY
      useGameHistory.ts   # REUSE - no changes
    utils/
      ticTacToeLogic.ts   # NEW - win detection, move validation
      urlGeneration.ts    # REUSE - generic functions work
      encryption.ts       # REUSE - no changes needed
    components/
      TicTacToeBoard.tsx  # NEW - 3x3 grid
      GameResults.tsx     # ADAPT - show winner differently
      MoveHistory.tsx     # NEW - optional move list
```

---

## Testing Checklist

- [ ] All 8 winning patterns (3 rows, 3 cols, 2 diags)
- [ ] Draw detection (full board, no winner)
- [ ] Invalid move rejection (occupied cell)
- [ ] URL encryption/decryption with board state
- [ ] localStorage save/load
- [ ] Choice locking prevents replay attacks
- [ ] Rematch flow with role reversal
- [ ] Cross-browser URL length < 1500 chars

---

## Quick Decision Tree

**Q: Can I reuse this PD file?**

1. Is it in `framework/`? → ✅ YES, reuse
2. Is it `encryption.ts` or `urlGeneration.ts`? → ✅ YES, reuse
3. Is it a schema or game logic? → ❌ NO, rebuild
4. Is it a component? → ❌ NO, rebuild
5. Is it a hook? → ⚠️ ADAPT, keep pattern

---

**End of Quick Reference**

See `prisoners_dilemma_analysis.md` for detailed line-by-line documentation.
