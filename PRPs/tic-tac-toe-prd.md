# PRD: Tic-Tac-Toe Correspondence Game

## Executive Summary

### Problem Statement

The correspondence games framework currently supports simultaneous-choice games (Prisoner's Dilemma, Rock-Paper-Scissors) but lacks support for sequential turn-based games where players alternate moves and build upon a shared game state. Tic-Tac-Toe is a perfect candidate to validate the framework's extensibility to sequential games.

### Solution Overview

Implement Tic-Tac-Toe as a correspondence game using the existing YAML configuration framework. Players take turns placing X's and O's on a 3x3 board, sharing game state via URL. The implementation will leverage the framework's localStorage-first architecture with choice-locking to prevent cheating, while extending it to support:

- **Sequential turns** instead of simultaneous rounds
- **Board state visualization** instead of hidden choices
- **Win detection** mid-game instead of only at end
- **9 position choices** instead of 2-3 fixed options
- **Delta-based URLs** with checksum verification for 70-80% smaller URLs and state integrity

### Success Metrics

- **Framework Evolution**: Breaking changes are acceptable - must update and verify existing games work:
  - `correspondence-games-framework/games/dilemma/` (Prisoner's Dilemma)
  - `correspondence-games-framework/games/rock-paper-scissors/`
- **Game Completeness**: Players can complete full games with proper win/draw detection
- **Anti-Cheat**: Choice locking prevents players from changing moves after seeing opponent's response
- **State Integrity**: Checksum verification ensures both players have identical board state between moves
- **URL Efficiency**: Delta-based URLs are 70-80% smaller than full state encoding
- **UX Quality**: Board visualization is intuitive, game flow is clear
- **Performance**: Game loads and transitions within 500ms
- **Regression Testing**: All existing games (Prisoner's Dilemma, RPS) continue to work after framework changes

---

## Problem Space Analysis

### Game Theory Fundamentals

Tic-Tac-Toe is a **solved game** with well-understood properties:

- **Perfect Information**: Both players see entire board state
- **Zero-Sum**: One player's gain is other's loss
- **Finite Game Tree**: 255,168 possible games (accounting for symmetries: 26,830)
- **Nash Equilibrium**: With optimal play, game always ends in draw
- **Minimax Solvable**: Optimal move can be computed for any board state

This makes it an excellent test case for sequential turn-based correspondence games.

### Key Differences from Existing Games

| Aspect | Prisoner's Dilemma / RPS | Tic-Tac-Toe |
|--------|-------------------------|-------------|
| Turn Structure | Simultaneous rounds | Alternating turns |
| Choice Visibility | Hidden until reveal | Fully visible after made |
| State Accumulation | Independent rounds | Cumulative board state |
| Win Condition | After N rounds | When 3-in-a-row achieved |
| Choice Set | Fixed 2-3 options | 9 positions (dynamic) |
| Game Length | Predetermined rounds | 5-9 turns (variable) |

---

## User Stories & Acceptance Criteria

### Story 1: Start New Game

**As a player**, I want to start a new Tic-Tac-Toe game so that I can challenge an opponent.

**Acceptance Criteria:**
- [ ] Player sees empty 3x3 board
- [ ] Player is assigned X (first player)
- [ ] All 9 positions are clickable
- [ ] Game ID is generated and stored in localStorage
- [ ] URL is empty (no hash) on initial load

**Edge Cases:**
- Player refreshes page → Game state persists from localStorage
- Player opens in new tab → New game starts (different gameId)

### Story 2: Make First Move

**As Player 1 (X)**, I want to place my X on an empty position so that I can start the game.

**Acceptance Criteria:**
- [ ] Clicking position places X icon
- [ ] Position becomes locked and unclickable
- [ ] Choice is locked in localStorage (anti-cheat)
- [ ] URL is generated with board state
- [ ] "Copy URL" button appears
- [ ] Helpful message: "Share this URL with your opponent"

**Edge Cases:**
- Player clicks same position twice → No error (idempotent)
- Player refreshes → Sees placed X and URL copy button
- Player tries to click different position → Browser alert with locked choice error

### Story 3: Receive Opponent's Move

**As Player 2 (O)**, I want to open Player 1's URL so that I can see their move and make mine.

**Acceptance Criteria:**
- [ ] URL loads and displays board with X placed
- [ ] Player sees they are O (second player)
- [ ] Empty positions are clickable
- [ ] Occupied position (X) is not clickable
- [ ] Turn indicator shows "Your turn (O)"

**Edge Cases:**
- URL is tampered → HMAC validation fails, show error
- URL is missing data → Show "Invalid game link" error
- Player opens own sent URL → Shows locked choice, not opponent's view

### Story 4: Alternate Turns Until Win

**As a player**, I want to continue taking turns until someone wins or draws so that the game reaches conclusion.

**Acceptance Criteria:**
- [ ] Players alternate X and O placements
- [ ] After each move, new URL is generated for opponent
- [ ] Win detection: 3-in-a-row (horizontal, vertical, diagonal)
- [ ] Winner sees victory message with winning line highlighted
- [ ] Loser sees defeat message when opening winning URL

**Edge Cases:**
- Player makes winning move → URL shows final state, no more moves allowed
- Both players refresh mid-game → Correct board state persists
- Player tries to make move out of turn → Error message

### Story 5: Draw Detection

**As a player**, I want the game to detect draws so that we know when to start a new game.

**Acceptance Criteria:**
- [ ] When all 9 positions filled with no winner → Draw declared
- [ ] Both players see "It's a draw!" message
- [ ] "Start New Game" button appears
- [ ] Board is not clickable after draw

**Edge Cases:**
- Last move is winning move → Win takes precedence over draw

---

## User Flow Diagram

```mermaid
graph TB
    Start([Player 1 Opens App]) --> EmptyBoard[See Empty 3x3 Board]
    EmptyBoard --> P1Move[P1 Clicks Position<br/>Places X]
    P1Move --> LockChoice1[Lock Choice in localStorage]
    LockChoice1 --> GenURL1[Generate URL with Board State]
    GenURL1 --> ShareURL1[Copy URL to Share]

    ShareURL1 --> P2Opens[Player 2 Opens URL]
    P2Opens --> ValidateURL{HMAC Valid?}
    ValidateURL -->|No| Error[Show Invalid Link Error]
    ValidateURL -->|Yes| ShowBoard2[Show Board with X]

    ShowBoard2 --> P2Move[P2 Clicks Empty Position<br/>Places O]
    P2Move --> LockChoice2[Lock Choice in localStorage]
    LockChoice2 --> CheckWin1{3-in-a-row?}

    CheckWin1 -->|Yes| WinP2[P2 Wins - Show Victory]
    CheckWin1 -->|No| CheckDraw1{Board Full?}
    CheckDraw1 -->|Yes| Draw[Draw - Show Message]
    CheckDraw1 -->|No| GenURL2[Generate URL for P1]

    GenURL2 --> ShareURL2[P2 Shares URL]
    ShareURL2 --> P1Opens2[P1 Opens New URL]
    P1Opens2 --> ShowBoard3[Show Board with X and O]
    ShowBoard3 --> P1Move2[P1 Makes Next Move]

    P1Move2 --> CheckWin2{3-in-a-row?}
    CheckWin2 -->|Yes| WinP1[P1 Wins - Show Victory]
    CheckWin2 -->|No| CheckDraw2{Board Full?}
    CheckDraw2 -->|Yes| Draw
    CheckDraw2 -->|No| ContinueGame[Continue Alternating...]

    WinP1 --> NewGame[Start New Game Button]
    WinP2 --> NewGame
    Draw --> NewGame
    NewGame --> EmptyBoard

    Error --> End([End])

    style LockChoice1 fill:#ffcccc
    style LockChoice2 fill:#ffcccc
    style ValidateURL fill:#ffffcc
    style CheckWin1 fill:#ccffcc
    style CheckWin2 fill:#ccffcc
```

---

## Game Configuration Design

### Tic-Tac-Toe YAML Structure

```yaml
id: "tic-tac-toe"
version: "1.0.0"

metadata:
  name: "Tic-Tac-Toe"
  shortName: "TTT"
  description: "Classic 3x3 grid game - get three in a row to win!"
  emoji: "⭕"
  category: "classic"
  playerCount: 2
  estimatedTime: "2-5 minutes"
  difficulty: "easy"

choices:
  - id: "pos-0"
    label: "Top Left"
    icon: "⬜"
    description: "Row 1, Column 1"
    position: { row: 0, col: 0 }

  - id: "pos-1"
    label: "Top Center"
    icon: "⬜"
    description: "Row 1, Column 2"
    position: { row: 0, col: 1 }

  - id: "pos-2"
    label: "Top Right"
    icon: "⬜"
    description: "Row 1, Column 3"
    position: { row: 0, col: 2 }

  - id: "pos-3"
    label: "Middle Left"
    icon: "⬜"
    description: "Row 2, Column 1"
    position: { row: 1, col: 0 }

  - id: "pos-4"
    label: "Center"
    icon: "⬜"
    description: "Row 2, Column 2"
    position: { row: 1, col: 1 }

  - id: "pos-5"
    label: "Middle Right"
    icon: "⬜"
    description: "Row 2, Column 3"
    position: { row: 1, col: 2 }

  - id: "pos-6"
    label: "Bottom Left"
    icon: "⬜"
    description: "Row 3, Column 1"
    position: { row: 2, col: 0 }

  - id: "pos-7"
    label: "Bottom Center"
    icon: "⬜"
    description: "Row 3, Column 2"
    position: { row: 2, col: 1 }

  - id: "pos-8"
    label: "Bottom Right"
    icon: "⬜"
    description: "Row 3, Column 3"
    position: { row: 2, col: 2 }

# Player symbols
players:
  - id: 1
    symbol: "❌"
    name: "X"
    color: "#e74c3c"

  - id: 2
    symbol: "⭕"
    name: "O"
    color: "#3498db"

# Win conditions (all 3-in-a-row patterns)
winConditions:
  # Rows
  - pattern: ["pos-0", "pos-1", "pos-2"]
    name: "Top Row"
  - pattern: ["pos-3", "pos-4", "pos-5"]
    name: "Middle Row"
  - pattern: ["pos-6", "pos-7", "pos-8"]
    name: "Bottom Row"

  # Columns
  - pattern: ["pos-0", "pos-3", "pos-6"]
    name: "Left Column"
  - pattern: ["pos-1", "pos-4", "pos-7"]
    name: "Center Column"
  - pattern: ["pos-2", "pos-5", "pos-8"]
    name: "Right Column"

  # Diagonals
  - pattern: ["pos-0", "pos-4", "pos-8"]
    name: "Top-left to Bottom-right"
  - pattern: ["pos-2", "pos-4", "pos-6"]
    name: "Top-right to Bottom-left"

# Game progression (sequential turns, not simultaneous rounds)
progression:
  type: "sequential"  # NEW: different from "simultaneous"
  turnOrder: "alternating"  # Player 1, then Player 2, then Player 1...
  maxTurns: 9  # Maximum possible moves
  firstPlayer: 1  # X always goes first

  # Win detection runs after each turn
  winDetection:
    checkAfterTurn: true
    drawCondition: "board-full-no-winner"

# UI Configuration
ui:
  theme:
    primary: "#2c3e50"
    secondary: "#ecf0f1"
    accent: "#3498db"
    success: "#27ae60"
    danger: "#e74c3c"

  boardLayout:
    type: "grid"
    rows: 3
    cols: 3
    cellSize: "100px"
    gap: "4px"
    borderRadius: "8px"

  animations:
    placementDuration: "200ms"
    winHighlight: "pulse 0.5s ease-in-out 3"

  labels:
    yourTurn: "Your turn ({symbol})"
    opponentTurn: "Waiting for opponent ({symbol})"
    youWin: "🎉 You win with {winPattern}!"
    youLose: "😔 Opponent wins with {winPattern}"
    draw: "🤝 It's a draw!"
    sharePrompt: "Share this URL with your opponent to continue the game"
    locked: "🔒 Position locked"

# Storage & Security
storage:
  storeIn: "localStorage"
  keyPrefix: "ttt-game-"

  encryption:
    enabled: true
    algorithm: "AES-GCM"

  integrity:
    checksumAlgorithm: "SHA-256"
    hmacAlgorithm: "HMAC-SHA256"

  choiceLocking:
    enabled: true
    lockAfterMove: true
    validateOnLoad: true

# State Structure
stateSchema:
  gameId: "string"
  currentTurn: "number"  # 1-9
  currentPlayer: "1 | 2"  # Whose turn it is
  board: "array[9]"  # ['X', null, 'O', null, null, null, null, null, null]
  moves: "array"  # [{player: 1, position: 'pos-4', turn: 1}, ...]
  winner: "1 | 2 | null"
  winningPattern: "array | null"  # ['pos-0', 'pos-1', 'pos-2']
  status: "in-progress | won | draw"
  createdAt: "ISO8601"
  lastMove: "ISO8601"
  checksum: "string"  # SHA-256 hash for state integrity verification
```

---

## System Architecture

### High-Level Component Structure

```mermaid
graph TB
    subgraph "React Frontend"
        App[App.tsx<br/>Game Orchestrator]
        Board[TicTacToeBoard.tsx<br/>Grid Visualization]
        Cell[BoardCell.tsx<br/>Individual Position]
        Status[GameStatus.tsx<br/>Turn/Win Display]
        Config[YAML Config Loader]
    end

    subgraph "Framework Hooks"
        GameState[useGameState<br/>Board & Turn Management]
        ChoiceLock[useChoiceLock<br/>Move Locking]
        URLState[useURLState<br/>URL Parsing]
    end

    subgraph "Storage Layer"
        LocalStorage[(localStorage<br/>Game State)]
        LockManager[choiceLockManager<br/>Anti-Cheat]
        Checksum[checksumManager<br/>Integrity]
        HMAC[hmacManager<br/>Tamper Detection]
    end

    subgraph "Game Logic"
        WinDetector[winDetector.ts<br/>3-in-a-row Check]
        TurnManager[turnManager.ts<br/>Sequential Turns]
        BoardValidator[boardValidator.ts<br/>Valid Move Check]
    end

    App --> Board
    App --> Status
    App --> Config
    Board --> Cell

    App --> GameState
    App --> ChoiceLock
    App --> URLState

    GameState --> LocalStorage
    ChoiceLock --> LockManager
    URLState --> HMAC
    URLState --> Checksum

    GameState --> WinDetector
    GameState --> TurnManager
    Cell --> BoardValidator

    LockManager --> LocalStorage
    Checksum --> LocalStorage

    style GameState fill:#3498db,color:#fff
    style ChoiceLock fill:#e74c3c,color:#fff
    style WinDetector fill:#27ae60,color:#fff
    style LocalStorage fill:#f39c12,color:#fff
```

### Data Flow Sequence

```mermaid
sequenceDiagram
    participant P1 as Player 1 (X)
    participant App1 as App Instance 1
    participant LS1 as localStorage (P1)
    participant URL as URL State
    participant P2 as Player 2 (O)
    participant App2 as App Instance 2
    participant LS2 as localStorage (P2)

    Note over P1,LS1: Game Start
    P1->>App1: Opens app
    App1->>LS1: Check for existing game
    LS1-->>App1: None found
    App1->>LS1: Create new game (ID: abc123)
    App1-->>P1: Show empty board

    Note over P1,URL: Player 1 First Move
    P1->>App1: Clicks position 4 (center)
    App1->>LS1: Verify current checksum
    App1->>LS1: Lock choice (pos-4)
    App1->>LS1: Update board [null, null, null, null, 'X', ...]
    App1->>App1: Calculate new checksum
    App1->>LS1: Store state with checksum
    App1->>URL: Generate URL (delta: move + prev/new checksums + HMAC)
    App1-->>P1: Show URL copy button

    P1->>P2: Shares URL

    Note over P2,LS2: Player 2 Receives Turn
    P2->>App2: Opens URL
    App2->>URL: Parse delta from hash
    App2->>App2: Validate HMAC
    App2->>LS2: Load current state
    App2->>App2: Verify prevChecksum matches current state
    App2->>LS2: Apply move to board
    App2->>App2: Verify newChecksum matches result
    App2->>LS2: Store updated state with checksum
    App2-->>P2: Show board with X in center
    App2-->>P2: "Your turn (O)"

    Note over P2,URL: Player 2 Response
    P2->>App2: Clicks position 0 (top-left)
    App2->>LS2: Verify current checksum
    App2->>LS2: Lock choice (pos-0)
    App2->>LS2: Update board ['O', null, null, null, 'X', ...]
    App2->>App2: Calculate new checksum
    App2->>App2: Check win conditions
    App2->>App2: No winner yet
    App2->>URL: Generate URL (delta: move + prev/new checksums + HMAC)
    App2-->>P2: Show URL copy button

    P2->>P1: Shares URL

    Note over P1,LS1: Player 1 Next Move
    P1->>App1: Opens new URL
    App1->>URL: Parse delta from hash
    App1->>App1: Validate HMAC
    App1->>LS1: Load current state
    App1->>App1: Verify prevChecksum matches current state
    App1->>LS1: Apply move to board
    App1->>App1: Verify newChecksum matches result
    App1->>LS1: Store updated state with checksum
    App1-->>P1: Show board with O and X
    P1->>App1: Clicks position 8 (bottom-right)
    App1->>LS1: Verify current checksum
    App1->>LS1: Lock choice (pos-8)
    App1->>LS1: Update board ['O', null, null, null, 'X', null, null, null, 'X']
    App1->>App1: Calculate new checksum

    Note over P1,App1: Continue until...

    Note over P1,App1: Winning Move
    P1->>App1: Clicks position 2
    App1->>LS1: Lock choice (pos-2)
    App1->>LS1: Update board
    App1->>App1: Check win conditions
    App1->>App1: WINNER! Pattern: [pos-2, pos-4, pos-8]
    App1->>LS1: Set winner=1, status=won
    App1->>URL: Generate final URL
    App1-->>P1: "🎉 You win with Top-right to Bottom-left diagonal!"

    P1->>P2: Shares winning URL

    P2->>App2: Opens URL
    App2->>URL: Parse hash
    App2->>LS2: Load final state
    App2-->>P2: "😔 Opponent wins with diagonal"
    App2-->>P2: Highlight winning line
    App2-->>P2: "Start New Game" button
```

---

## Technical Specifications

### Game State Structure

```typescript
interface TicTacToeState {
  gameId: string;
  currentTurn: number;  // 1-9
  currentPlayer: 1 | 2;  // Whose turn it is
  board: (string | null)[];  // 9 elements: ['X', null, 'O', ...]
  moves: Move[];
  winner: 1 | 2 | null;
  winningPattern: string[] | null;  // ['pos-0', 'pos-4', 'pos-8']
  status: 'in-progress' | 'won' | 'draw';
  createdAt: string;  // ISO8601
  lastMove: string;  // ISO8601
  checksum: string;  // SHA-256 hash of board state for verification
}

interface Move {
  player: 1 | 2;
  position: string;  // 'pos-0' through 'pos-8'
  turn: number;
  timestamp: string;
}
```

### Win Detection Algorithm

```typescript
function checkWinCondition(
  board: (string | null)[],
  player: 1 | 2,
  config: GameConfig
): WinResult {
  const playerSymbol = config.players[player - 1].symbol;

  for (const condition of config.winConditions) {
    const positions = condition.pattern.map(posId => {
      const index = parseInt(posId.split('-')[1]);
      return board[index];
    });

    if (positions.every(pos => pos === playerSymbol)) {
      return {
        won: true,
        pattern: condition.pattern,
        name: condition.name
      };
    }
  }

  return { won: false, pattern: null, name: null };
}

function checkDrawCondition(board: (string | null)[]): boolean {
  return board.every(cell => cell !== null);
}
```

### Board Validation

```typescript
function validateMove(
  position: string,
  board: (string | null)[],
  currentPlayer: 1 | 2
): ValidationResult {
  const index = parseInt(position.split('-')[1]);

  // Position must be empty
  if (board[index] !== null) {
    return {
      valid: false,
      error: `Position already occupied by ${board[index]}`
    };
  }

  // Position must be in range
  if (index < 0 || index > 8) {
    return {
      valid: false,
      error: 'Invalid position index'
    };
  }

  return { valid: true, error: null };
}
```

### Turn Management

```typescript
function getNextPlayer(currentPlayer: 1 | 2): 1 | 2 {
  return currentPlayer === 1 ? 2 : 1;
}

function getPlayerFromURL(urlState: URLState | null): 1 | 2 {
  // If opening URL from opponent, you're the next player
  if (urlState && urlState.currentPlayer) {
    return getNextPlayer(urlState.currentPlayer);
  }
  // If starting new game, you're player 1
  return 1;
}
```

### Browser Storage + Checksum Verification Strategy

**Core Principle**: localStorage holds the authoritative game state, URLs only carry deltas (individual moves) with checksum verification to ensure state consistency.

#### State Storage Architecture

```typescript
interface StoredGameState {
  gameId: string;
  board: (string | null)[];
  moves: Move[];
  currentTurn: number;
  currentPlayer: 1 | 2;
  winner: 1 | 2 | null;
  winningPattern: string[] | null;
  status: 'in-progress' | 'won' | 'draw';
  createdAt: string;
  lastMove: string;
  checksum: string;  // SHA-256 hash of canonical board state
}

interface URLDelta {
  gameId: string;              // Link this move to a game
  move: {
    player: 1 | 2;
    position: string;          // e.g., 'pos-4'
    turn: number;
  };
  prevChecksum: string;        // Expected checksum BEFORE this move
  newChecksum: string;         // Expected checksum AFTER this move
  hmac: string;                // HMAC of entire delta for tamper detection
}
```

#### Checksum Calculation

```typescript
import { checksumManager } from '@/framework/storage/checksumManager';

/**
 * Generate canonical checksum of board state
 * CRITICAL: Must be deterministic - same board always produces same checksum
 */
function calculateBoardChecksum(board: (string | null)[]): string {
  // Create canonical representation
  const canonical = JSON.stringify({
    board: board,  // ['X', null, 'O', ...]
    // Only include data that affects game validity
    // DO NOT include timestamps, UI state, or player names
  });

  return checksumManager.generate(canonical);
}

/**
 * Verify board state hasn't been tampered with
 */
function verifyBoardChecksum(
  board: (string | null)[],
  expectedChecksum: string
): boolean {
  const actualChecksum = calculateBoardChecksum(board);
  return actualChecksum === expectedChecksum;
}
```

#### Move Flow with Checksum Verification

```typescript
// Player 1 makes a move
async function makeMove(position: string): Promise<void> {
  // 1. Load current state from localStorage
  const currentState = loadGameState(gameId);

  // 2. Verify current state checksum (detect local tampering)
  if (!verifyBoardChecksum(currentState.board, currentState.checksum)) {
    throw new Error('Local game state corrupted - checksum mismatch');
  }

  const prevChecksum = currentState.checksum;

  // 3. Validate move
  const validation = validateMove(position, currentState.board, currentPlayer);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // 4. Lock choice (anti-cheat)
  choiceLockManager.lock(gameId, currentTurn, currentPlayer, position);

  // 5. Apply move to board
  const newBoard = [...currentState.board];
  const index = parseInt(position.split('-')[1]);
  newBoard[index] = currentPlayer === 1 ? 'X' : 'O';

  // 6. Calculate NEW checksum
  const newChecksum = calculateBoardChecksum(newBoard);

  // 7. Update localStorage with new state
  const newState: StoredGameState = {
    ...currentState,
    board: newBoard,
    moves: [...currentState.moves, { player: currentPlayer, position, turn: currentTurn }],
    currentTurn: currentTurn + 1,
    currentPlayer: getNextPlayer(currentPlayer),
    checksum: newChecksum,
    lastMove: new Date().toISOString()
  };

  saveGameState(gameId, newState);

  // 8. Generate URL with DELTA only (not full state)
  const urlDelta: URLDelta = {
    gameId,
    move: {
      player: currentPlayer,
      position,
      turn: currentTurn
    },
    prevChecksum,  // What board state should be BEFORE this move
    newChecksum,   // What board state should be AFTER this move
    hmac: ''       // Calculated below
  };

  // 9. Add HMAC for tamper detection
  urlDelta.hmac = hmacManager.generate(JSON.stringify({
    gameId: urlDelta.gameId,
    move: urlDelta.move,
    prevChecksum: urlDelta.prevChecksum,
    newChecksum: urlDelta.newChecksum
  }));

  // 10. Encode delta to URL
  const compressedDelta = LZString.compressToEncodedURIComponent(
    JSON.stringify(urlDelta)
  );

  window.location.hash = compressedDelta;
}
```

#### Receiving Opponent's Move

```typescript
// Player 2 opens URL with delta
async function loadURLDelta(): Promise<void> {
  // 1. Parse URL hash
  const hash = window.location.hash.slice(1);
  const decompressed = LZString.decompressFromEncodedURIComponent(hash);
  const delta: URLDelta = JSON.parse(decompressed);

  // 2. Verify HMAC (tamper detection)
  const expectedHmac = hmacManager.generate(JSON.stringify({
    gameId: delta.gameId,
    move: delta.move,
    prevChecksum: delta.prevChecksum,
    newChecksum: delta.newChecksum
  }));

  if (delta.hmac !== expectedHmac) {
    throw new Error('URL has been tampered with - HMAC mismatch');
  }

  // 3. Load current state from localStorage (if exists)
  let currentState = loadGameState(delta.gameId);

  if (!currentState) {
    // New game - initialize from URL
    currentState = initializeGameFromDelta(delta);
  }

  // 4. CRITICAL: Verify prevChecksum matches current state
  if (!verifyBoardChecksum(currentState.board, delta.prevChecksum)) {
    throw new Error(
      `Board state mismatch!\n` +
      `Expected checksum: ${delta.prevChecksum}\n` +
      `Actual checksum: ${calculateBoardChecksum(currentState.board)}\n\n` +
      `This means your local game state is out of sync with your opponent's move.\n` +
      `Possible causes:\n` +
      `- You're viewing an old URL (opponent made moves you haven't seen)\n` +
      `- localStorage was cleared mid-game\n` +
      `- Local tampering detected`
    );
  }

  // 5. Apply opponent's move
  const newBoard = [...currentState.board];
  const index = parseInt(delta.move.position.split('-')[1]);
  newBoard[index] = delta.move.player === 1 ? 'X' : 'O';

  // 6. Verify newChecksum matches after applying move
  if (!verifyBoardChecksum(newBoard, delta.newChecksum)) {
    throw new Error(
      'Move application failed - resulting board checksum mismatch'
    );
  }

  // 7. Update localStorage
  const newState: StoredGameState = {
    ...currentState,
    board: newBoard,
    moves: [...currentState.moves, delta.move],
    currentTurn: delta.move.turn + 1,
    currentPlayer: getNextPlayer(delta.move.player),
    checksum: delta.newChecksum,
    lastMove: new Date().toISOString()
  };

  saveGameState(delta.gameId, newState);

  // 8. Render updated board - it's now your turn
  renderGameState(newState);
}
```

#### Edge Case: Out-of-Sync States

**Scenario**: Player 2 makes move, but Player 1 opens an OLD URL (from 2 moves ago)

```typescript
function handleChecksumMismatch(
  delta: URLDelta,
  currentState: StoredGameState
): void {
  const currentChecksum = calculateBoardChecksum(currentState.board);

  // Check if current state is AHEAD of delta
  if (currentState.currentTurn > delta.move.turn) {
    // Player is viewing an old URL
    showWarning({
      title: 'Old Game Link',
      message: `This link is from turn ${delta.move.turn}, but you're already on turn ${currentState.currentTurn}. Please use the latest link from your opponent.`,
      actions: ['View Current Game', 'Ignore']
    });
    return;
  }

  // Check if we need to rebuild from scratch
  if (currentState.currentTurn < delta.move.turn - 1) {
    // We're missing intermediate moves - cannot safely apply delta
    showError({
      title: 'Missing Game History',
      message: `Cannot apply this move - you're missing ${delta.move.turn - currentState.currentTurn - 1} previous moves. Ask your opponent to share the latest link.`,
      actions: ['Start New Game']
    });
    return;
  }

  // Otherwise, genuine tampering or corruption
  showError({
    title: 'Game State Corrupted',
    message: 'Local game state does not match the expected state for this move. This could indicate tampering or data corruption.',
    actions: ['Clear Local State', 'Cancel']
  });
}
```

#### Benefits of This Approach

1. **Minimal URL Size**: URLs only contain single move delta (~100 bytes compressed) instead of full board state
   - Example: `#N4IgdghgtgpiBcIDaBDAzmAwgNgFwE8AKABzAHd4BnAAgBM8AbAeyIBoQA7AEwDsBfIA==`

2. **Checksum Verification**: Both players verify board state consistency before/after each move
   - Detects local tampering
   - Detects out-of-sync states
   - Ensures both players see identical board

3. **localStorage Authority**: localStorage is source of truth, URLs are just transport
   - Survives page refreshes
   - Works offline (until sharing URL)
   - No backend needed

4. **Tamper Detection Layers**:
   - **HMAC**: Prevents URL modification
   - **Checksum (prev)**: Ensures starting state matches
   - **Checksum (new)**: Ensures move was applied correctly
   - **Choice Lock**: Prevents player from changing own move

5. **Error Recovery**: Clear error messages help players understand sync issues
   - "You're viewing an old link"
   - "Missing game history"
   - "Board state corrupted"

#### URL Format Comparison

**Old Approach (Full State)**:
```
#eyJnYW1lSWQiOiJhYmMxMjMiLCJib2FyZCI6WyJYIixudWxsLCJPIixudWxsLCJYIixudWxsLG51bGwsbnVsbCxudWxsXSwiY3VycmVudFR1cm4iOjMsImN1cnJlbnRQbGF5ZXIiOjIsIm1vdmVzIjpbeyJwbGF5ZXIiOjEsInBvc2l0aW9uIjoicG9zLTQiLCJ0dXJuIjoxfSx7InBsYXllciI6Miwicm9zaXRpb24iOiJwb3MtMiIsInR1cm4iOjJ9LHsicGxheWVyIjoxLCJwb3NpdGlvbiI6InBvcy0wIiwidHVybiI6M31dLCJ3aW5uZXIiOm51bGwsInN0YXR1cyI6ImluLXByb2dyZXNzIn0=
(~350+ characters)
```

**New Approach (Delta Only)**:
```
#N4IgdghgtgpiBcIDaBDAzmAwgNgFwE8AKABQCMAXVAFQBNUA7AEwBsBfIA
(~60-100 characters)
```

**Size Reduction**: ~70-80% smaller URLs

#### Integration with Existing Framework

The checksum + delta approach integrates seamlessly with existing anti-cheat mechanisms:

```typescript
// Layer 1: HMAC (URL tamper detection)
const hmac = hmacManager.generate(deltaPayload);
if (receivedHmac !== hmac) throw new Error('URL tampered');

// Layer 2: Checksum (state consistency verification)
const prevChecksum = calculateBoardChecksum(currentBoard);
if (delta.prevChecksum !== prevChecksum) throw new Error('State mismatch');

// Layer 3: Choice Lock (prevent move changes)
choiceLockManager.lock(gameId, turn, player, position);

// Layer 4: Checksum (result verification)
const newChecksum = calculateBoardChecksum(newBoard);
if (delta.newChecksum !== newChecksum) throw new Error('Move application failed');
```

**Result**: Four independent verification layers ensure game integrity without backend.

---

## Breaking Changes & Migration Strategy

### Philosophy: Evolution Over Preservation

**Breaking changes are acceptable and encouraged** when they improve the framework architecture. The delta-based URL + checksum verification approach benefits all games, not just Tic-Tac-Toe.

### Affected Components

1. **`useURLState` hook** - Changes from full state to delta encoding
2. **`useGameState` hook** - Adds checksum field to state
3. **URL format** - New delta structure (not backward compatible)
4. **localStorage schema** - Adds checksum to stored state

### Migration Checklist

#### Phase A: Framework Changes (Breaking)
- [ ] Implement delta-based URL encoding in `useURLState`
- [ ] Add checksum field to game state types
- [ ] Create `checksumDelta.ts` utility module
- [ ] Update `urlGeneration.ts` to use delta format
- [ ] Update HMAC to work with delta payloads

#### Phase B: Update Existing Games
- [ ] **Prisoner's Dilemma** (`correspondence-games-framework/games/dilemma/`)
  - [ ] Update to use delta URLs (single choice per round)
  - [ ] Add checksum to round state
  - [ ] Update choice lock keys to include checksum
  - [ ] Test full game flow (5 rounds)
  - [ ] Verify rematch functionality works
  - [ ] Test game history integration

- [ ] **Rock-Paper-Scissors** (`correspondence-games-framework/games/rock-paper-scissors/`)
  - [ ] Update to use delta URLs (single choice per round)
  - [ ] Add checksum to round state
  - [ ] Test full game flow
  - [ ] Verify all RPS-specific features

#### Phase C: Validation
- [ ] Run full test suite: `npm run validate`
- [ ] Manual testing protocol:
  ```bash
  # Test each game end-to-end
  npm run dev

  # 1. Prisoner's Dilemma
  - Start new game
  - Make choice → copy URL
  - Open in incognito → opponent view
  - Complete all 5 rounds
  - Verify rematch works

  # 2. Rock-Paper-Scissors
  - Start new game
  - Make choice → copy URL
  - Open in incognito → opponent view
  - Complete game

  # 3. Tic-Tac-Toe (new)
  - Start new game
  - Play full game to win/draw
  - Verify checksum errors work
  ```

#### Phase D: Migration Path for Old URLs

**Problem**: Existing shared URLs use old format and will break

**Solution**: Graceful degradation with migration message

```typescript
function parseURL(hash: string): GameState | URLDelta | null {
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(hash);
    const parsed = JSON.parse(decompressed);

    // Detect old format (has 'rounds' or 'board' at top level)
    if ('rounds' in parsed || 'board' in parsed) {
      showMigrationMessage({
        title: 'Outdated Game Link',
        message: `This link uses an older format and is no longer compatible.
                  Please start a new game - we've improved the system with:
                  • Smaller, faster URLs
                  • Better security with checksums
                  • Improved state verification`,
        action: 'Start New Game'
      });
      return null;
    }

    // New delta format
    if ('move' in parsed && 'prevChecksum' in parsed) {
      return parsed as URLDelta;
    }

    return null;
  } catch (error) {
    console.error('Failed to parse URL:', error);
    return null;
  }
}
```

### Testing Protocol

```bash
# 1. Unit tests (all must pass)
npm run test

# 2. Type checking (strict mode)
npm run type-check

# 3. Linting (zero warnings)
npm run lint

# 4. Build verification
npm run build

# 5. E2E tests (if available)
npm run test:e2e

# 6. Manual regression testing (see Phase C above)
```

### Rollback Plan

If critical issues found after merge:

1. **Immediate**: Revert commit with breaking changes
2. **Document**: Log issue in GitHub Issues
3. **Fix Forward**: Create hotfix branch
4. **Re-test**: Full validation protocol
5. **Re-merge**: Only when all games verified

### Success Criteria for Migration

- ✅ All 3 games (Prisoner's Dilemma, RPS, Tic-Tac-Toe) work end-to-end
- ✅ `npm run validate` passes with zero errors
- ✅ No TypeScript errors in strict mode
- ✅ Old URLs show helpful migration message (not crash)
- ✅ URL sizes reduced by 70-80% for all games
- ✅ Checksum verification working for all games
- ✅ Documentation updated with new architecture

---

## Implementation Phases

### Phase 1: Foundation (Choice Locking Already Complete ✅)

**Status**: Already implemented in previous task

- [x] `choiceLockManager.ts` - localStorage-based locking
- [x] `useChoiceLock.ts` - React hook for choice locking
- [x] Integration in RPS and Prisoner's Dilemma

**Reuse for TTT**: Same anti-cheat mechanism works for board positions

---

### Phase 2: Framework Changes (Breaking) + Delta/Checksum Core

**Files to Create**:

1. **`src/framework/utils/checksumDelta.ts`** (150 lines) - **CRITICAL FIRST**
   - `calculateBoardChecksum(board)` - SHA-256 checksum generation
   - `verifyBoardChecksum(board, expectedChecksum)` - Validation
   - `createURLDelta(gameState, move)` - Build delta with checksums
   - `applyURLDelta(currentState, delta)` - Apply with verification
   - `handleChecksumMismatch(delta, currentState)` - Error recovery
   - Unit tests for all functions

2. **`src/framework/hooks/useURLState.ts`** (modifications) - **BREAKING**
   - Change from full state encoding to delta encoding
   - Parse `URLDelta` format instead of `GameState`
   - Add checksum verification on URL load
   - Detect old URL format and show migration message
   - Handle checksum mismatch errors with clear messages

3. **`src/framework/hooks/useGameState.ts`** (modifications) - **BREAKING**
   - Add `checksum` field to state type
   - Calculate checksum on every state update
   - Verify checksum before applying moves

**Files to Update (Existing Games)**:

4. **Prisoner's Dilemma Migration**
   - Update `src/features/game/utils/urlGeneration.ts` to use deltas
   - Add checksum to `GameState` schema
   - Update round completion to calculate checksums
   - Test full 5-round flow

5. **Rock-Paper-Scissors Migration** (if exists)
   - Same delta-based URL updates
   - Add checksum verification
   - Test full game flow

**Tic-Tac-Toe Logic Files**:

6. **`src/game-logic/winDetector.ts`** (150 lines)
   - `checkWinCondition(board, player, config)`
   - `checkDrawCondition(board)`
   - `getWinningPattern(board, player, config)`
   - Unit tests for all 8 win patterns

7. **`src/game-logic/turnManager.ts`** (100 lines)
   - `getNextPlayer(currentPlayer)`
   - `getPlayerFromURL(urlState)`
   - `isValidTurn(gameState, player)`
   - Turn sequence validation

8. **`src/game-logic/boardValidator.ts`** (80 lines)
   - `validateMove(position, board, player)`
   - `getAvailablePositions(board)`
   - `isBoardFull(board)`

9. **`games/configs/tic-tac-toe.yaml`** (300 lines)
   - Full game configuration as designed above
   - 9 position choices with row/col metadata
   - 8 win condition patterns
   - Sequential progression settings

**Success Criteria**:
```bash
# 1. Framework tests pass
npm run test -- framework/utils/checksumDelta.test.ts
npm run test -- framework/hooks/useURLState.test.ts

# 2. Existing games still work
npm run test -- features/game/

# 3. New game logic tests pass
npm run test -- game-logic/
# All tests pass
# Win detection covers all 8 patterns
# Draw detection verified

# 4. Type checking passes
npm run type-check

# 5. Manual verification of ALL games
npm run dev
# Test Prisoner's Dilemma full flow
# Test Rock-Paper-Scissors (if exists)
# Test Tic-Tac-Toe basic flow
```

---

### Phase 3: React Components

**Files to Create**:

1. **`src/components/TicTacToeBoard.tsx`** (200 lines)
   - Renders 3x3 grid of cells
   - Props: `board`, `onCellClick`, `winningPattern`, `disabled`
   - Highlights winning pattern with animation
   - Uses config for styling

2. **`src/components/BoardCell.tsx`** (120 lines)
   - Individual cell component
   - Shows X, O, or empty
   - Click handler with validation
   - Locked state visualization
   - Hover effects for available moves

3. **`src/components/GameStatus.tsx`** (100 lines)
   - Turn indicator: "Your turn (X)" / "Opponent's turn (O)"
   - Win/loss/draw messages
   - "Start New Game" button
   - URL copy section

**Success Criteria**:
```bash
npm run dev
# Visual inspection: board renders correctly
# Clicking cells updates UI
# Winning pattern highlights
# Responsive on mobile
```

---

### Phase 4: State Management Integration

**Files to Modify**:

1. **`src/framework/hooks/useGameState.ts`** (modifications)
   - Add support for `board` array in state
   - Add `currentPlayer` tracking (different from simultaneous rounds)
   - Add `moves` array for history
   - Add `winningPattern` field
   - Add `checksum` field for state verification

2. **`src/framework/hooks/useURLState.ts`** (modifications)
   - Change from full state encoding to delta encoding
   - Parse URLDelta format instead of full GameState
   - Add checksum verification on URL load
   - Handle checksum mismatch errors with clear messages

3. **`src/framework/utils/checksumDelta.ts`** (new file ~150 lines)
   - `calculateBoardChecksum(board)` - Generate SHA-256 checksum
   - `verifyBoardChecksum(board, expectedChecksum)` - Validate checksum
   - `createURLDelta(gameState, move)` - Build delta object with checksums
   - `applyURLDelta(currentState, delta)` - Apply delta with verification
   - `handleChecksumMismatch(delta, currentState)` - Error recovery logic

4. **`src/App.tsx`** (new game implementation)
   - Load `tic-tac-toe.yaml` config
   - Initialize board state (9 nulls) with initial checksum
   - Integrate `useChoiceLock` for positions
   - Handle cell clicks → validate → update board → calculate checksums → generate delta URL
   - On URL load: verify checksums → apply delta → update localStorage
   - Conditional rendering: board → status → new game

**Key Logic**:
```typescript
const makeMove = useCallback((position: string) => {
  if (!gameState || !config) return;

  // Verify current state checksum (detect local tampering)
  if (!verifyBoardChecksum(gameState.board, gameState.checksum)) {
    alert('Local game state corrupted - checksum mismatch');
    return;
  }

  const prevChecksum = gameState.checksum;

  // Validate move
  const validation = validateMove(position, gameState.board, currentPlayer);
  if (!validation.valid) {
    alert(validation.error);
    return;
  }

  // Lock choice (anti-cheat)
  try {
    validateAndLock(position);
  } catch (error) {
    alert(`Cannot change move: ${error.message}`);
    return;
  }

  // Update board
  const newBoard = [...gameState.board];
  const index = parseInt(position.split('-')[1]);
  newBoard[index] = config.players[currentPlayer - 1].symbol;

  // Calculate NEW checksum
  const newChecksum = calculateBoardChecksum(newBoard);

  // Check win
  const winResult = checkWinCondition(newBoard, currentPlayer, config);

  // Check draw
  const isDraw = !winResult.won && checkDrawCondition(newBoard);

  // Update state
  const newState = {
    ...gameState,
    board: newBoard,
    currentTurn: gameState.currentTurn + 1,
    currentPlayer: getNextPlayer(currentPlayer),
    moves: [...gameState.moves, { player: currentPlayer, position, turn: gameState.currentTurn }],
    winner: winResult.won ? currentPlayer : null,
    winningPattern: winResult.pattern,
    status: winResult.won ? 'won' : isDraw ? 'draw' : 'in-progress',
    lastMove: new Date().toISOString(),
    checksum: newChecksum  // NEW: Store checksum with state
  };

  setGameState(newState);

  // Generate URL delta (not full state)
  if (newState.status === 'in-progress') {
    const delta = createURLDelta({
      gameId: gameState.gameId,
      move: { player: currentPlayer, position, turn: gameState.currentTurn },
      prevChecksum,
      newChecksum
    });

    setUrlState(delta);
  }
}, [gameState, config, currentPlayer, validateAndLock]);
```

**Success Criteria**:
```bash
# Manual test:
# 1. Start new game
# 2. Make move → see locked position
# 3. Copy URL
# 4. Open in incognito → see opponent view
# 5. Make move → check win detection
# 6. Complete game → verify final state
```

---

### Phase 5: Polish & Edge Cases

**Enhancements**:

1. **Move History Display** (optional)
   - Show list of moves: "Turn 1: X → Center", "Turn 2: O → Top Left"
   - Helps players understand game progression

2. **Undo Last Move** (considered but rejected)
   - ❌ Conflicts with choice locking anti-cheat
   - Would require opponent approval mechanism
   - Out of scope for MVP

3. **AI Opponent** (future enhancement)
   - Implement minimax algorithm for single-player mode
   - Not needed for correspondence game validation

4. **Board Animation**
   - Smooth placement animations (200ms)
   - Winning line pulse effect
   - Confetti on win (optional)

5. **Error Handling**
   - Invalid URL → clear error message
   - HMAC mismatch → "Link has been tampered with"
   - localStorage full → graceful degradation
   - Network issues (future: if adding sync)

**Success Criteria**:
```bash
# Edge case testing:
# - Refresh mid-game → state persists
# - Back button → choice lock prevents cheating
# - Tampered URL → validation fails
# - Full localStorage → game continues
# - Multiple tabs → cross-tab sync works
```

---

### Phase 6: Testing & Documentation

**Test Coverage**:

1. **Unit Tests** (`tests/game-logic/`)
   - Win detection: All 8 patterns
   - Draw detection: Full board scenarios
   - Move validation: Occupied, out-of-bounds
   - Turn management: Alternating players

2. **Integration Tests** (`tests/integration/`)
   - Full game playthrough
   - URL generation and parsing
   - Choice locking across turns
   - Win/draw state transitions

3. **Manual Test Cases** (`tests/manual/tic-tac-toe-manual-tests.md`)
   - Cross-browser testing (Chrome, Firefox, Safari)
   - Mobile responsiveness
   - Accessibility (keyboard navigation)
   - Performance (load times, animation smoothness)

**Documentation**:

1. **User Guide** (`docs/games/tic-tac-toe.md`)
   - How to play
   - How to share moves
   - Understanding game state

2. **Developer Guide** (`docs/development/sequential-games.md`)
   - Extending framework for sequential games
   - Differences from simultaneous games
   - Adding new sequential games (e.g., Connect Four)

**Success Criteria**:
```bash
npm run test
# > 80% code coverage
# All tests passing

npm run build
# No TypeScript errors
# Bundle size < 500KB
```

---

## Challenge & Risk Analysis

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Framework doesn't support sequential turns | Medium | High | Add `progression.type: 'sequential'` to config schema, modify `useGameState` to handle alternating players instead of simultaneous rounds. **Breaking changes OK** - update Prisoner's Dilemma and RPS to use new architecture |
| Board state too large for URL | Low | Medium | Use delta encoding (only send changed positions), compress JSON before base64. Checksum verification ensures integrity |
| Choice locking conflicts with multi-turn state | Medium | Medium | Lock at turn-level not round-level: `choice-lock-{gameId}-t{turn}-p{player}`. May require updates to existing games |
| Win detection performance | Low | Low | 8 patterns check is O(1), runs only after moves (max 9 times) |
| Breaking changes break existing games | Medium | High | **Mitigation Plan**: <br/>1. Create feature branch<br/>2. Implement changes<br/>3. Update Prisoner's Dilemma to new API<br/>4. Update Rock-Paper-Scissors to new API<br/>5. Run full test suite on all games<br/>6. Manual testing of all game flows<br/>7. Only merge when all games verified |

### UX Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Players confused by turn order | Medium | Medium | Clear "Your turn (X)" indicator, disable board when not your turn |
| Players don't understand why move is locked | High | Low | Show helpful message: "You already chose this position" with lock icon |
| Players try to undo moves | High | Low | Clear messaging: "Moves are final to prevent cheating" |
| Board not responsive on mobile | Low | High | Use CSS Grid with responsive cell sizes, test on small screens |

### Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Tic-Tac-Toe too simple to validate framework | Low | Medium | Focus on framework extensibility proof, not game complexity |
| Players abandon before completion | Medium | Low | Add game ID to localStorage, allow resuming interrupted games |
| Framework requires significant changes | Medium | High | **Breaking changes are acceptable** - this is the right time to improve architecture. Delta-based URLs benefit all games. Update existing games as part of implementation |
| Regression in existing games | Medium | High | Comprehensive testing protocol: update games → test suite → manual verification before merge |

---

## Edge Cases & Handling

### Edge Case 1: Player Refreshes Mid-Game

**Scenario**: Player makes move, refreshes page before copying URL

**Expected Behavior**:
- localStorage persists game state
- Locked choice persists
- UI shows locked position and URL copy button
- Player can re-copy URL without re-making move

**Implementation**:
```typescript
useEffect(() => {
  // On mount, check for locked choice
  const lock = getChoiceLock(gameId, currentTurn, currentPlayer);
  if (lock && gameState.status === 'in-progress') {
    // Show URL copy screen, not choice screen
    setShowUrlCopy(true);
  }
}, [gameId, currentTurn, currentPlayer, gameState]);
```

### Edge Case 2: Back Button After Making Move

**Scenario**: Player makes move, clicks back button to try different position

**Expected Behavior**:
- Choice lock in localStorage prevents different choice
- Attempting to click different position → error alert
- Original choice still visible and locked

**Validation**: Choice locking already handles this (implemented in Phase 1)

### Edge Case 3: Player Opens Own URL

**Scenario**: Player 1 makes move, accidentally opens their own shared URL instead of waiting for Player 2

**Expected Behavior**:
- Detect that current player matches URL state player
- Show locked choice view (not opponent's turn view)
- Message: "Waiting for opponent to make their move"

**Implementation**:
```typescript
const isOwnUrl = urlState && urlState.currentPlayer === currentPlayer;

if (isOwnUrl) {
  return <LockedChoiceView
    position={lockedChoice.choiceId}
    message="Waiting for opponent's move"
  />;
}
```

### Edge Case 4: Winning Move on Final Turn

**Scenario**: Turn 9 creates 3-in-a-row (win and full board simultaneously)

**Expected Behavior**:
- Win takes precedence over draw
- Show "You win!" message, not "It's a draw"

**Implementation**:
```typescript
// Check win BEFORE checking draw
const winResult = checkWinCondition(newBoard, currentPlayer, config);
if (winResult.won) {
  return { status: 'won', winner: currentPlayer };
}

// Only then check draw
if (checkDrawCondition(newBoard)) {
  return { status: 'draw', winner: null };
}
```

### Edge Case 5: Tampered URL (Changed Board State)

**Scenario**: Player modifies URL hash to change opponent's move

**Expected Behavior**:
- HMAC validation fails
- Show error: "Invalid game link - link may have been tampered with"
- Do not update game state

**Validation**: HMAC already implemented in framework (`hmacManager.ts`)

### Edge Case 6: localStorage Disabled or Full

**Scenario**: Browser has localStorage disabled or quota exceeded

**Expected Behavior**:
- Game continues in memory-only mode
- Choice locking gracefully degrades (console warning)
- URL state still works for sharing
- User warned: "Browser storage disabled - anti-cheat features reduced"

**Implementation**: Already handled in `choiceLockManager.ts` (try/catch with console.warn)

---

## Success Criteria & Definition of Done

### Functional Requirements

- [ ] Player 1 (X) can make first move
- [ ] Move is locked in localStorage (anti-cheat)
- [ ] URL is generated with board state and HMAC
- [ ] Player 2 (O) can open URL and see Player 1's move
- [ ] Players alternate turns (X → O → X → O...)
- [ ] Win detection works for all 8 patterns (3 rows, 3 cols, 2 diagonals)
- [ ] Draw detection works when board full with no winner
- [ ] Winning player sees victory message and share url button
- [ ] Losing player sees defeat message (when opening final URL)
- [ ] Both players can start new game after completion
- [ ] Choice locking prevents changing moves after submission

### Non-Functional Requirements

- [ ] Page load time < 500ms
- [ ] Move submission latency < 200ms
- [ ] Works on Chrome, Firefox, Safari
- [ ] Responsive on mobile (min 320px width)
- [ ] Accessible (keyboard navigation, screen reader friendly)
- [ ] No console errors or warnings
- [ ] TypeScript strict mode (no `any` types)
- [ ] Test coverage > 80%

### Framework Validation

- [ ] Tic-Tac-Toe loads from YAML config (no hardcoding)
- [ ] `progression.type: 'sequential'` is respected
- [ ] Existing hooks (`useGameState`, `useChoiceLock`, `useURLState`) work with modifications
- [ ] **Breaking changes are OK**: Update existing games to new architecture
  - [ ] Prisoner's Dilemma updated to delta-based URLs with checksums
  - [ ] Rock-Paper-Scissors updated to delta-based URLs with checksums
  - [ ] Both games tested end-to-end after framework changes
  - [ ] URL format migration tested (old URLs show helpful migration message)
- [ ] Framework documentation updated with sequential game pattern
- [ ] Migration guide created for delta-based URL architecture

### Documentation

- [ ] User guide: How to play Tic-Tac-Toe
- [ ] Developer guide: Adding sequential games
- [ ] Code comments: Complex logic explained
- [ ] README updated: Add Tic-Tac-Toe to game list

### Deployment Readiness

- [ ] `npm run build` succeeds with no errors
- [ ] Bundle size within acceptable limits (< 500KB)
- [ ] Lighthouse score > 90 (performance, accessibility)
- [ ] Manual testing complete (checklist in `tests/manual/`)
- [ ] No known critical bugs

---

## Alternative Approaches Considered

### Alternative 1: Server-Based Turn Management

**Approach**: Use backend API to manage turns and validate moves

**Pros**:
- Authoritative game state (no cheating possible)
- Real-time notifications
- Persistent game history

**Cons**:
- Requires backend infrastructure
- Not in scope for "correspondence game" concept
- Defeats purpose of URL-based sharing

**Decision**: ❌ Rejected - Stay with localStorage-first architecture

---

### Alternative 2: Minimax AI for Validation

**Approach**: Implement minimax algorithm to detect if player is cheating by playing optimally

**Pros**:
- Could detect suspiciously perfect play
- Educational value

**Cons**:
- Overly complex for anti-cheat
- False positives (good players look like AI)
- Doesn't prevent URL manipulation

**Decision**: ❌ Rejected - Choice locking is sufficient

---

### Alternative 3: Full Game State in URL (No localStorage)

**Approach**: Encode entire board state in URL, no localStorage caching

**Pros**:
- Stateless (works across devices)
- No localStorage quota issues

**Cons**:
- URLs become very long (9 positions + metadata)
- Higher tampering risk
- Slower parsing on every load

**Decision**: ❌ Rejected - localStorage-first is core framework principle

---

### Alternative 4: Move History Instead of Board State

**Approach**: URL contains list of moves, board is reconstructed

**Pros**:
- Smaller URL size
- Move history preserved naturally

**Cons**:
- Requires replaying moves on load (slower)
- More complex state reconstruction
- Same final board state, just different representation

**Decision**: ⚠️ Consider for optimization if URL size becomes issue

---

## Measurable Outcomes & KPIs

### Development Metrics

- **Implementation Time**: Target 8-12 hours (2 dev days)
- **Lines of Code**: Estimate 1500 lines (YAML + TS + tests)
- **Test Coverage**: Target 85%+
- **Bug Count**: < 5 critical bugs in testing phase

### User Experience Metrics

- **Time to First Move**: < 5 seconds (including reading rules)
- **Time to Complete Game**: 2-5 minutes (average)
- **Error Rate**: < 2% (invalid moves attempted)
- **Mobile Usage**: 40%+ of games played on mobile

### Technical Performance

- **Lighthouse Performance Score**: > 90
- **Bundle Size Increase**: < 100KB
- **Memory Usage**: < 50MB for full game
- **Win Detection Speed**: < 10ms

### Framework Validation Metrics

- **Config Reusability**: 90%+ of RPS config patterns reused
- **Hook Modifications**: < 5 new hook parameters
- **Breaking Changes**: 0 (backward compatible)

---

## Appendices

### Appendix A: Win Pattern Visualization

```
Rows:
0 | 1 | 2     3 | 4 | 5     6 | 7 | 8
---------     ---------     ---------

Columns:
0 | . | .     . | 1 | .     . | . | 2
---------     ---------     ---------
3 | . | .     . | 4 | .     . | . | 5
---------     ---------     ---------
6 | . | .     . | 7 | .     . | . | 8

Diagonals:
0 | . | .     . | . | 2
---------     ---------
. | 4 | .     . | 4 | .
---------     ---------
. | . | 8     6 | . | .
```

### Appendix B: State Transition Diagram

```mermaid
stateDiagram-v2
    [*] --> NewGame: Player opens app
    NewGame --> PlayerTurn: Initialize board

    PlayerTurn --> MoveValidation: Click position
    MoveValidation --> PlayerTurn: Invalid (show error)
    MoveValidation --> ChoiceLocking: Valid move

    ChoiceLocking --> BoardUpdate: Lock position in localStorage
    BoardUpdate --> WinCheck: Update board array

    WinCheck --> GameWon: 3-in-a-row detected
    WinCheck --> GameDraw: Board full, no winner
    WinCheck --> URLGeneration: Game continues

    URLGeneration --> WaitingForOpponent: Player shares URL
    WaitingForOpponent --> OpponentTurn: Opponent opens URL
    OpponentTurn --> MoveValidation: Opponent clicks position

    GameWon --> GameOver: Show winner/loser
    GameDraw --> GameOver: Show draw message
    GameOver --> NewGame: Start new game
    GameOver --> [*]: Player leaves
```

### Appendix C: Research References

- **Game Theory**: https://en.wikipedia.org/wiki/Tic-tac-toe (solved game analysis)
- **Minimax Algorithm**: https://www.neverstopbuilding.com/blog/minimax
- **Win Detection**: https://stackoverflow.com/questions/1056316/algorithm-for-determining-tic-tac-toe-game-over
- **React Patterns**: Existing RPS and Prisoner's Dilemma implementations
- **Framework Docs**: `correspondence-games-framework/framework-considerations.md`

---

## Next Steps

### Immediate Actions (After PRD Approval)

1. **Review with Stakeholders**
   - Confirm sequential game support is desired
   - Validate YAML config structure matches framework patterns
   - Approve implementation timeline

2. **Create Implementation PRP**
   - Use this PRD as input to `/prp-commands:prp-story-create`
   - Generate detailed implementation tasks
   - Break down into testable increments

3. **Set Up Development Environment**
   - Create `games/tic-tac-toe/` directory
   - Copy framework structure from RPS
   - Initialize config file

### Long-Term Considerations

- **Framework Evolution**: Document sequential game patterns for future games (Connect Four, Battleship, Chess)
- **Performance Monitoring**: Add analytics to track game completion rates
- **User Feedback**: Implement feedback form for game experience
- **Accessibility Audit**: Ensure WCAG 2.1 AA compliance

---

**Document Status**: Draft for Review
**Created**: 2025-10-05
**Author**: Claude Code (AI Assistant)
**Next Review**: After stakeholder feedback
