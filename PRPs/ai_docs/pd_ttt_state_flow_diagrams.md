# State Flow Diagrams: Prisoner's Dilemma vs Tic-Tac-Toe

**Purpose**: Visual understanding of game state transitions

---

## Prisoner's Dilemma State Flow

### Game State Structure
```
GameState {
  gameId: "uuid-abc123"
  gamePhase: "setup" | "playing" | "finished"
  currentRound: 0-4
  rounds: [
    Round {
      roundNumber: 1
      choices: { p1?: "silent"|"talk", p2?: "silent"|"talk" }
      results?: { p1Gold: 0-5, p2Gold: 0-5 }
      isComplete: boolean
    },
    ... 4 more rounds
  ]
  totals: { p1Gold: number, p2Gold: number }
}
```

### Turn Flow (Round 1 Example)
```
┌─────────────────────────────────────────────────────────────────┐
│                         ROUND 1 START                            │
│  currentRound: 0                                                 │
│  rounds[0]: { choices: {}, results: null, isComplete: false }   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    P1 MAKES CHOICE: "silent"                     │
│  rounds[0].choices.p1 = "silent"                                │
│  URL State: s=<encrypted_with_p1_choice>                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    P1 SHARES URL WITH P2                         │
│  P2 opens URL → sees round waiting for their choice             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    P2 MAKES CHOICE: "talk"                       │
│  rounds[0].choices.p2 = "talk"                                  │
│  BOTH CHOSE → CALCULATE RESULTS                                 │
│  rounds[0].results = { p1Gold: 0, p2Gold: 5 }                   │
│  rounds[0].isComplete = true                                    │
│  totals.p1Gold += 0, totals.p2Gold += 5                         │
│  currentRound = 1 (advance to round 2)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                      [REPEAT FOR ROUNDS 2-5]
```

### Simultaneous Choice Pattern
```
Round State Evolution:

T0: { choices: {}, results: null }
    ↓ P1 chooses
T1: { choices: { p1: "silent" }, results: null }
    ↓ P2 chooses
T2: { choices: { p1: "silent", p2: "talk" }, results: { p1Gold: 0, p2Gold: 5 } }
    ↓ Advance
T3: Next round starts
```

---

## Tic-Tac-Toe State Flow

### Game State Structure
```
GameState {
  gameId: "uuid-def456"
  gamePhase: "setup" | "playing" | "finished"
  currentTurn: number (increments each move)
  currentPlayer: "X" | "O"
  board: [
    ["X", "O", ""],
    ["", "X", ""],
    ["O", "", ""]
  ]
  moves: [
    { position: {row: 0, col: 0}, player: "X", timestamp: "..." },
    { position: {row: 0, col: 1}, player: "O", timestamp: "..." },
    ...
  ]
  winner: "X" | "O" | "draw" | null
  winningLine?: [Position, Position, Position]
}
```

### Turn Flow (First 3 Moves Example)
```
┌─────────────────────────────────────────────────────────────────┐
│                         GAME START                               │
│  currentTurn: 0                                                  │
│  currentPlayer: "X"                                              │
│  board: [["","",""],["","",""],["","",""]]                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    X MOVES TO (1,1) CENTER                       │
│  board[1][1] = "X"                                              │
│  moves.push({ position: {1,1}, player: "X" })                  │
│  checkWinner(board) → null                                       │
│  currentPlayer = "O"                                             │
│  currentTurn = 1                                                 │
│  URL State: s=<encrypted_with_move>                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    X SHARES URL WITH O                           │
│  O opens URL → sees board with X's move                         │
│  Board:                                                          │
│    [ ][ ][ ]                                                     │
│    [ ][X][ ]                                                     │
│    [ ][ ][ ]                                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    O MOVES TO (0,0) CORNER                       │
│  board[0][0] = "O"                                              │
│  moves.push({ position: {0,0}, player: "O" })                  │
│  checkWinner(board) → null                                       │
│  currentPlayer = "X"                                             │
│  currentTurn = 2                                                 │
│  Board:                                                          │
│    [O][ ][ ]                                                     │
│    [ ][X][ ]                                                     │
│    [ ][ ][ ]                                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    [CONTINUE UNTIL WIN/DRAW]
```

### Sequential Move Pattern
```
Board State Evolution:

T0: [["","",""],["","",""],["","",""]], currentPlayer: "X"
    ↓ X moves (1,1)
T1: [["","",""],["","X",""],["","",""]], currentPlayer: "O"
    ↓ O moves (0,0)
T2: [["O","",""],["","X",""],["","",""]], currentPlayer: "X"
    ↓ X moves (2,2)
T3: [["O","",""],["","X",""],["","","X"]], currentPlayer: "O"
    ↓ O moves (1,0)
T4: [["O","",""],["O","X",""],["","","X"]], currentPlayer: "X"
    ↓ X moves (0,2)
T5: [["O","","X"],["O","X",""],["","","X"]], checkWinner → "X" wins (diagonal)
    gamePhase = "finished"
    winner = "X"
    winningLine = [{0,2}, {1,1}, {2,0}]
```

---

## Key Differences Visualization

### Prisoner's Dilemma: WAIT Pattern
```
P1's View:
  Make Choice → Generate URL → Wait for P2 → See Results

P2's View:
  Receive URL → See P1 Waiting → Make Choice → See Results

Timeline:
  T0 ─── P1 chooses ─── URL shared ─── P2 chooses ─── Results shown
         (hidden)                       (both revealed)
```

### Tic-Tac-Toe: PASS Pattern
```
X's View:
  Make Move → Generate URL → Wait for O

O's View:
  Receive URL → See X's Move → Make Move → Generate URL → Wait for X

Timeline:
  T0 ─── X moves ─── URL shared ─── O moves ─── URL shared ─── X moves
         (visible)                  (visible)                  (visible)
```

---

## URL State Transitions

### Prisoner's Dilemma URL States

```
State 1: "Both players need to choose"
URL: ?s=<encrypted>
Decrypted: {
  currentRound: 0,
  rounds: [
    { choices: {}, results: null, isComplete: false }
  ]
}

State 2: "P1 chose, waiting for P2"
URL: ?s=<encrypted>
Decrypted: {
  currentRound: 0,
  rounds: [
    { choices: { p1: "silent" }, results: null, isComplete: false }
  ]
}

State 3: "Both chose, results ready, advance to round 2"
URL: ?s=<encrypted>
Decrypted: {
  currentRound: 1,
  rounds: [
    { choices: { p1: "silent", p2: "talk" }, results: { p1Gold: 0, p2Gold: 5 }, isComplete: true },
    { choices: {}, results: null, isComplete: false }
  ],
  totals: { p1Gold: 0, p2Gold: 5 }
}
```

### Tic-Tac-Toe URL States

```
State 1: "Fresh game"
URL: ?s=<encrypted>
Decrypted: {
  currentTurn: 0,
  currentPlayer: "X",
  board: [["","",""],["","",""],["","",""]],
  moves: []
}

State 2: "After X's first move"
URL: ?s=<encrypted>
Decrypted: {
  currentTurn: 1,
  currentPlayer: "O",
  board: [["","",""],["","X",""],["","",""]],
  moves: [{ position: {1,1}, player: "X", timestamp: "..." }]
}

State 3: "After O's move"
URL: ?s=<encrypted>
Decrypted: {
  currentTurn: 2,
  currentPlayer: "X",
  board: [["O","",""],["","X",""],["","",""]],
  moves: [
    { position: {1,1}, player: "X", timestamp: "..." },
    { position: {0,0}, player: "O", timestamp: "..." }
  ]
}
```

---

## Choice Lock Comparison

### Prisoner's Dilemma Lock
```
Lock Key: "choice-lock-{gameId}-r{round}-p{player}"
Example:  "choice-lock-abc123-r1-p1"

Lock Data: {
  gameId: "abc123",
  round: 1,
  player: 1,
  choiceId: "silent",
  timestamp: "2025-10-09T...",
  locked: true
}

Scenario:
  1. P1 chooses "silent" in round 1
  2. Lock created: choice-lock-abc123-r1-p1 = "silent"
  3. P1 refreshes page
  4. P1 tries to choose "talk"
  5. validateChoice throws: "Choice locked for round 1. You already chose 'silent'."
```

### Tic-Tac-Toe Lock
```
Lock Key: "choice-lock-{gameId}-t{turn}-p{player}"
Example:  "choice-lock-def456-t3-p1"

Lock Data: {
  gameId: "def456",
  round: 3,  // Really "turn" but reusing same structure
  player: 1,
  choiceId: "1,1",  // Position as string
  timestamp: "2025-10-09T...",
  locked: true
}

Scenario:
  1. X (player 1) moves to position (1,1) on turn 3
  2. Lock created: choice-lock-def456-t3-p1 = "1,1"
  3. X refreshes page
  4. X tries to move to position (0,0)
  5. validateChoice throws: "Choice locked for turn 3. You already chose '1,1'."
```

---

## Component Rendering Logic

### Prisoner's Dilemma Decision Tree
```
if (gamePhase === 'finished') {
  → Show GameResults
} else if (waitingForP1 && waitingForP2) {
  if (isP1FirstRound) {
    → Show P1's GameBoard (P1's turn to go first)
  } else {
    → Show P2's GameBoard (P2's turn to go first)
  }
} else if (!waitingForP1 && waitingForP2) {
  if (isLocalChoice) {
    → Show URLSharer (P1 just chose)
  } else {
    → Show P2's GameBoard (P2 viewing P1's choice)
  }
} else if (waitingForP1 && !waitingForP2) {
  if (isLocalChoice) {
    → Show URLSharer (P2 just chose)
  } else {
    → Show P1's GameBoard (P1 viewing P2's choice)
  }
} else {
  → Show URLSharer (both chose, ready to advance)
}
```

### Tic-Tac-Toe Decision Tree (SIMPLER!)
```
if (gamePhase === 'finished') {
  → Show GameResults with winner/draw
} else {
  const isMyTurn = (
    (currentPlayer === 'X' && isPlayer1) ||
    (currentPlayer === 'O' && isPlayer2)
  )

  → Show TicTacToeBoard
    - disabled={!isMyTurn}
    - currentPlayer={currentPlayer}

  if (justMadeMove) {
    → Show URLSharer (send to opponent)
  }
}
```

---

## Win Detection Flow (TTT Only)

### After Each Move
```
┌─────────────────────────────────────────┐
│       Player makes move (x, y)          │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│    Update board[x][y] = currentPlayer   │
│    Add to moves array                   │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│         checkWinner(board)              │
│  ┌────────────────────────────────┐    │
│  │ Check 3 rows                   │    │
│  │ Check 3 columns                │    │
│  │ Check 2 diagonals              │    │
│  │ Check for draw (board full)    │    │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘
              │
        ┌─────┴─────┐
        ▼           ▼
   ┌────────┐  ┌────────────┐
   │ Winner │  │ No Winner  │
   └────────┘  └────────────┘
        │           │
        ▼           ▼
   ┌──────────────────────┐  ┌──────────────────────┐
   │ gamePhase='finished' │  │ Toggle currentPlayer │
   │ winner = 'X'|'O'|'draw'  │ Continue game        │
   │ winningLine = [...]  │  └──────────────────────┘
   └──────────────────────┘
```

### Winning Pattern Examples
```
Row Win:                Column Win:           Diagonal Win:
[X][X][X]               [X][ ][ ]             [X][ ][ ]
[ ][ ][ ]               [X][ ][ ]             [ ][X][ ]
[ ][ ][ ]               [X][ ][ ]             [ ][ ][X]

winningLine:            winningLine:          winningLine:
[{0,0},{0,1},{0,2}]    [{0,0},{1,0},{2,0}]  [{0,0},{1,1},{2,2}]
```

---

## Data Flow Summary

### Prisoner's Dilemma
```
User Action → makeChoice(player, choice)
            → Update round.choices[player]
            → Check if bothChosen
            → If yes: Calculate results → Update totals → Advance round
            → Update metadata
            → Generate URL
            → Show URL Sharer
```

### Tic-Tac-Toe
```
User Action → makeMove(position)
            → Update board[row][col]
            → Add to moves array
            → Check winner
            → If winner/draw: Set gamePhase='finished'
            → Else: Toggle currentPlayer
            → Update metadata
            → Generate URL
            → Show URL Sharer
```

---

## State Size Comparison

### URL Length Impact

**Prisoner's Dilemma (After Round 3):**
```json
{
  "gameId": "...",
  "currentRound": 2,
  "rounds": [
    {"roundNumber":1,"choices":{"p1":"silent","p2":"talk"},"results":{"p1Gold":0,"p2Gold":5},"isComplete":true},
    {"roundNumber":2,"choices":{"p1":"talk","p2":"silent"},"results":{"p1Gold":5,"p2Gold":0},"isComplete":true},
    {"roundNumber":3,"choices":{"p1":"talk","p2":"talk"},"results":{"p1Gold":1,"p2Gold":1},"isComplete":true},
    {"roundNumber":4,"choices":{},"isComplete":false},
    {"roundNumber":5,"choices":{},"isComplete":false}
  ],
  "totals": {"p1Gold":6,"p2Gold":6},
  ...
}
```
**Compressed & Encrypted: ~800-1000 chars**

**Tic-Tac-Toe (After 5 Moves):**
```json
{
  "gameId": "...",
  "currentTurn": 5,
  "currentPlayer": "O",
  "board": [
    ["X","O","X"],
    ["","X",""],
    ["O","",""]
  ],
  "moves": [
    {"position":{"row":0,"col":0},"player":"X","timestamp":"..."},
    {"position":{"row":0,"col":1},"player":"O","timestamp":"..."},
    {"position":{"row":1,"col":1},"player":"X","timestamp":"..."},
    {"position":{"row":2,"col":0},"player":"O","timestamp":"..."},
    {"position":{"row":0,"col":2},"player":"X","timestamp":"..."}
  ],
  ...
}
```
**Compressed & Encrypted: ~700-900 chars**

Both fit comfortably under 1500 char limit.

---

## Rematch Flow Comparison

### Both Games Use Same Pattern
```
Game Finishes
    ↓
convertGameStateToCompletedGame()
    ↓
Save to localStorage (P2's history)
    ↓
createRematchGame() - Generate new gameId, reverse roles
    ↓
Embed previousGameResults in new game state
    ↓
Generate URL with embedded results
    ↓
P1 receives URL, extracts previousGameResults
    ↓
Save to localStorage (P1's history)
    ↓
Clean previousGameResults from state
    ↓
Both players now have previous game in history
    ↓
Start fresh rematch with reversed first player
```

**Pattern is identical for both games!**

---

**End of State Flow Diagrams**

Visual supplement to `prisoners_dilemma_analysis.md`
