# Prisoner's Dilemma Implementation Analysis
## Comprehensive Pattern Analysis for Tic-Tac-Toe PRP Creation

**Generated**: 2025-10-09
**Purpose**: Document all implementation patterns from Prisoner's Dilemma to guide Tic-Tac-Toe PRP creation
**Target Audience**: AI agents implementing Tic-Tac-Toe using PRP methodology

---

## Table of Contents
1. [Game State Structure](#game-state-structure)
2. [URL State Management](#url-state-management)
3. [Choice Locking (Anti-Cheat)](#choice-locking-anti-cheat)
4. [localStorage Patterns](#localstorage-patterns)
5. [Hooks Integration](#hooks-integration)
6. [Component Patterns](#component-patterns)
7. [Validation Patterns](#validation-patterns)
8. [Breaking Changes for Tic-Tac-Toe](#breaking-changes-for-tic-tac-toe)

---

## 1. Game State Structure

### File: `src/features/game/schemas/gameSchema.ts`

**Core Schema Architecture:**
```typescript
// Lines 163-200
export const GameStateSchema = z.object({
  version: z.literal('1.0.0'),           // Schema version for backward compatibility
  gameId: GameIdSchema,                   // UUID, branded type for safety
  players: z.object({
    p1: PlayerInfoSchema,
    p2: PlayerInfoSchema,
  }),
  rounds: z.array(RoundSchema).length(5), // EXACTLY 5 rounds (fixed game length)
  currentRound: z.number().int().min(0).max(4), // 0-indexed (0-4 for 5 rounds)
  gamePhase: GamePhaseSchema,             // 'setup' | 'playing' | 'finished'
  totals: z.object({                      // Cumulative scores
    p1Gold: z.number().int().min(0),
    p2Gold: z.number().int().min(0),
  }),
  metadata: GameMetadataSchema,           // Timestamps, turn count
  socialFeatures: SocialFeaturesSchema.optional(), // Messages, rematch
  previousGameId: z.string().optional(),  // Rematch chain linking
  toastNotifications: z.array(ToastNotificationSchema).optional(),
  previousGameResults: z.any().optional(), // TEMPORARY - for rematch handoff
});
```

**Key Patterns:**

1. **Branded Types for Safety** (Lines 22-34):
```typescript
export const PlayerIdSchema = z.string().min(1).brand<'PlayerId'>();
export const GameIdSchema = z.string().uuid().brand<'GameId'>();
```
- Prevents accidental mixing of string types
- TypeScript enforces correct usage at compile time

2. **Round Structure** (Lines 77-90):
```typescript
export const RoundSchema = z.object({
  roundNumber: z.number().int().min(1).max(5),
  choices: RoundChoicesSchema,    // { p1?: Choice, p2?: Choice }
  results: RoundResultsSchema.optional(),  // Only set when both chose
  isComplete: z.boolean(),
  completedAt: z.string().datetime().optional(),
});
```

3. **Short Property Names** (Line 154 comment):
> "CRITICAL: All properties use short names to minimize URL length"

**Prisoner's Dilemma Specific:**
- **Simultaneous Rounds**: Both players choose in same round, then reveal together
- **Fixed 5 Rounds**: `z.array(RoundSchema).length(5)` enforces exactly 5
- **Round-Based Results**: Each round has `results` calculated after both chose

**Tic-Tac-Toe Needs:**
- **Sequential Turns**: One player per turn, not simultaneous
- **Board State**: 3x3 grid instead of round-based choices
- **Variable Game Length**: Games can end in 5-9 moves (win detection)
- **Turn Tracking**: Need `currentTurn` instead of `currentRound`
- **Win Condition**: Check board for winner after each move

---

## 2. URL State Management

### Files:
- `src/features/game/utils/urlGeneration.ts` (URL operations)
- `src/features/game/utils/encryption.ts` (Encryption pipeline)
- `src/framework/storage/hmacManager.ts` (Integrity verification)

### Encryption Pipeline (Lines 48-91 in encryption.ts)

**Flow: GameState → JSON → Compress → Encrypt → Base64 → HMAC Sign**

```typescript
export function encryptGameState(gameState: GameState): string {
  // Step 1: JSON stringify
  const json = JSON.stringify(gameState);

  // Step 2: Compress using LZ-String
  const compressed = LZString.compressToEncodedURIComponent(json);

  // Step 3: Encrypt using AES-256
  const encrypted = CryptoJS.AES.encrypt(compressed, GAME_SECRET).toString();

  // Step 4: Base64 encode
  const encoded = btoa(encrypted);

  // Step 5: Add HMAC signature
  const signed = signData(encoded);
  const signedString = encodeSignedData(signed);

  return signedString; // Format: "data.signature"
}
```

**Key Security Patterns:**

1. **Dual Protection** (hmacManager.ts, Lines 7-23):
   - **AES-256 Encryption**: Confidentiality (URLs unreadable)
   - **HMAC-SHA256**: Integrity (tampering detected)
   - Both required - encryption alone doesn't prevent tampering

2. **HMAC Verification BEFORE Decryption** (encryption.ts, Lines 124-167):
```typescript
export function decryptGameState(encoded: string): GameState {
  // Step 0: Verify HMAC signature FIRST
  const verified = decodeSignedData(encoded);

  // Then decrypt...
  const encrypted = atob(verified);
  const decrypted = CryptoJS.AES.decrypt(encrypted, GAME_SECRET)
    .toString(CryptoJS.enc.Utf8);
  const json = LZString.decompressFromEncodedURIComponent(decrypted);
  const parsed = JSON.parse(json);

  // Step 5: ALWAYS validate with Zod
  const validatedState = validateGameState(parsed);
  return validatedState;
}
```

3. **URL Generation** (urlGeneration.ts, Lines 37-61):
```typescript
export function generateShareableURL(
  gameState: GameState,
  baseURL?: string
): string {
  const encrypted = encryptGameState(gameState);
  const base = baseURL || `${window.location.origin}${window.location.pathname}`;
  const url = `${base}?s=${encrypted}`;

  // Warn if exceeding browser limits
  if (url.length > MAX_URL_LENGTH) {
    console.warn(`URL length (${url.length}) exceeds max (${MAX_URL_LENGTH})`);
  }

  return url;
}
```

### Hook: useURLState (Lines 54-131)

**Pattern: Load on mount, generate on demand**

```typescript
export function useURLState(): UseURLStateResult {
  const [urlGameState, setURLGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load from URL on mount
  useEffect(() => {
    const state = parseGameStateFromURL();
    setURLGameState(state);
    setIsLoading(false);
  }, []); // ONLY run on mount

  // Generate URL from state
  const generateURL = useCallback((gameState: GameState): string => {
    return generateShareableURL(gameState);
  }, []);

  // Update browser URL without reload
  const updateURL = useCallback((gameState: GameState): void => {
    updateURLWithState(gameState); // Uses window.history.replaceState
  }, []);

  return { urlGameState, isLoading, error, generateURL, updateURL };
}
```

**URL Update Pattern** (App.tsx, Lines 182-188):
```typescript
// Update URL whenever game state changes (but not on initial load)
useEffect(() => {
  if (gameState && gameState.gamePhase !== 'setup' && !urlGameState) {
    console.log('🔗 Updating browser URL with new state');
    updateURLWithState(gameState);
  }
}, [gameState, urlGameState]);
```

**Critical Pattern: Prevent Update Loops**
- Only update URL when `gameState` exists but `urlGameState` is null
- Prevents infinite loops of URL → state → URL → state...

**Tic-Tac-Toe Needs:**
- Same encryption pipeline (reuse framework code)
- Same URL generation pattern
- Board state might be larger than round choices - monitor URL size
- Consider delta encoding if full board state too large

---

## 3. Choice Locking (Anti-Cheat)

### Files:
- `src/framework/storage/choiceLockManager.ts` (Core locking logic)
- `src/framework/hooks/useChoiceLock.ts` (React integration)

### Pattern: localStorage-based Lock System

**Lock Structure** (choiceLockManager.ts, Lines 17-24):
```typescript
export interface ChoiceLock {
  gameId: string;
  round: number;      // For PD: round number (1-5)
  player: 1 | 2;
  choiceId: string;   // The actual choice made
  timestamp: string;
  locked: true;       // Always true - existence = locked
}
```

**Storage Key Format** (Line 52):
```typescript
const key = `choice-lock-${gameId}-r${round}-p${player}`;
// Example: "choice-lock-abc123-r1-p1"
```

**Lock Flow** (Lines 37-60, 109-130):
```typescript
// 1. Lock a choice
export function lockChoice(
  gameId: string,
  round: number,
  player: 1 | 2,
  choiceId: string
): void {
  const lock: ChoiceLock = { gameId, round, player, choiceId, timestamp: ..., locked: true };
  localStorage.setItem(key, JSON.stringify(lock));
}

// 2. Validate before accepting choice
export function validateChoice(
  gameId: string,
  round: number,
  player: 1 | 2,
  attemptedChoice: string
): void {
  const lock = getChoiceLock(gameId, round, player);

  if (!lock) {
    // First choice - allow it
    return;
  }

  if (lock.choiceId !== attemptedChoice) {
    throw new Error(
      `Choice locked for round ${round}. You already chose "${lock.choiceId}".`
    );
  }

  // Choice matches lock - allow (idempotent)
}
```

**React Hook Integration** (useChoiceLock.ts, Lines 65-129):
```typescript
export function useChoiceLock(
  gameId: string,
  round: number,
  player: 1 | 2
): UseChoiceLockResult {
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [lockedChoice, setLockedChoice] = useState<ChoiceLock | null>(null);

  // Check lock on mount
  useEffect(() => {
    const lock = getChoiceLock(gameId, round, player);
    setIsLocked(lock !== null);
    setLockedChoice(lock);
  }, [gameId, round, player]);

  // Cross-tab synchronization via storage events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      const key = `choice-lock-${gameId}-r${round}-p${player}`;
      if (e.key === key) {
        const lock = getChoiceLock(gameId, round, player);
        setIsLocked(lock !== null);
        setLockedChoice(lock);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [gameId, round, player]);

  const validateAndLock = useCallback((choiceId: string) => {
    validateChoice(gameId, round, player, choiceId);
    lockPlayerChoice(choiceId);
  }, [gameId, round, player]);

  return { isLocked, lockedChoice, validateAndLock, ... };
}
```

**Security Level** (Lines 8-12):
> "SECURITY LEVEL: 'Middle of the road' deterrent
> - Prevents casual cheating (page refresh to change choice)
> - Does NOT prevent determined attackers (localStorage is client-controlled)
> - Relies on localStorage availability (fails gracefully if disabled)"

**Cleanup Utilities** (Lines 135-176):
```typescript
// Clear all locks for a game (when starting new game)
export function clearGameLocks(gameId: string): void;

// Clear locks older than N days (maintenance)
export function clearOldLocks(maxAgeDays: number = 7): void;
```

**Tic-Tac-Toe Needs:**
- **Turn-based locking**: Lock position on board, not round choice
- **Lock key format**: `choice-lock-${gameId}-t${turn}-p${player}`
- **Position locking**: `choiceId` = board position (e.g., "0,0", "1,2")
- **Same validation pattern**: Check lock before accepting move

**Key Difference:**
```typescript
// Prisoner's Dilemma: Lock CHOICE for a ROUND
lockChoice(gameId, round: 1-5, player, choice: 'silent' | 'talk')

// Tic-Tac-Toe: Lock POSITION for a TURN
lockChoice(gameId, turn: number, player, position: string)
```

---

## 4. localStorage Patterns

### File: `src/features/game/hooks/useLocalStorage.ts`

**Storage Key** (Line 9):
```typescript
const STORAGE_KEY = 'prisoners-dilemma-history';
```

**Data Structure** (types/history.ts, Lines 64-72):
```typescript
export interface GameHistory {
  playerName: string;
  sessionId: string;  // For fingerprinting (detect name changes vs new player)
  games: CompletedGame[];
}

export interface CompletedGame {
  gameId: string;
  startTime: string;
  endTime: string;
  playerNames: { p1: string; p2: string; };
  totals: { p1Gold: number; p2Gold: number; };
  rounds: Round[];
  finalMessage?: PlayerMessage;
  winner: 'p1' | 'p2' | 'tie';
}
```

**Key Operations:**

1. **Session ID Generation** (Lines 19-21):
```typescript
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
```

2. **Get or Create History** (Lines 43-76):
```typescript
export function getGameHistory(): GameHistory {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const newHistory: GameHistory = {
      playerName: '',
      sessionId: generateSessionId(),
      games: [],
    };
    saveGameHistory(newHistory);
    return newHistory;
  }

  const parsed = JSON.parse(stored) as GameHistory;

  // Backward compatibility: ensure sessionId exists
  if (!parsed.sessionId) {
    parsed.sessionId = generateSessionId();
    saveGameHistory(parsed);
  }

  return parsed;
}
```

3. **Player Name Management** (Lines 84-100):
```typescript
export function setPlayerName(name: string): void {
  const history = getGameHistory();
  const trimmedName = name.trim().substring(0, MAX_NAME_LENGTH); // Max 20 chars
  history.playerName = trimmedName;
  saveGameHistory(history);
}

export function getPlayerName(): string | null {
  const history = getGameHistory();
  return history.playerName || null;
}
```

4. **Save Completed Game** (Lines 125-129):
```typescript
export function saveCompletedGame(game: CompletedGame): void {
  const history = getGameHistory();
  history.games.push(game);
  saveGameHistory(history);
}
```

**React Hook Integration** (useGameHistory.ts, Lines 69-205):

```typescript
export function useGameHistory(): UseGameHistoryResult {
  const [history, setHistory] = useState<GameHistory | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load on mount (SSR-safe)
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    const loadedHistory = getGameHistory();
    setHistory(loadedHistory);
    setIsLoading(false);
  }, []);

  const addCompletedGame = useCallback((game: CompletedGame): void => {
    saveCompletedGame(game);
    setHistory(prev => {
      const updatedGames = [...prev.games, game];

      // Enforce max size (keep most recent 50)
      if (updatedGames.length > MAX_HISTORY_SIZE) {
        updatedGames.splice(0, updatedGames.length - MAX_HISTORY_SIZE);
      }

      return { ...prev, games: updatedGames };
    });
  }, []);

  return {
    playerName: history?.playerName || null,
    games: history?.games || [],
    addCompletedGame,
    clearHistory,
    removeGame,
    setPlayerName,
    isLoading,
  };
}
```

**Save Pattern in App.tsx** (Lines 191-207):
```typescript
// Track which games have been saved to prevent duplicates
const savedGamesRef = useRef<Set<string>>(new Set());

// Save completed games to localStorage
useEffect(() => {
  if (
    gameState &&
    gameState.gamePhase === 'finished' &&
    !savedGamesRef.current.has(gameState.gameId)
  ) {
    const completedGame = convertGameStateToCompletedGame(gameState);
    addCompletedGame(completedGame);
    savedGamesRef.current.add(gameState.gameId);
    console.log('✅ Game saved to history:', completedGame.gameId);
  }
}, [gameState, addCompletedGame]);
```

**Tic-Tac-Toe Needs:**
- Same localStorage structure (reuse framework)
- Different storage key: `'tic-tac-toe-history'`
- `CompletedGame` structure changes:
  - Remove `rounds`, add `moves: Move[]`
  - Add `winningLine?: Position[]` for highlighting
  - Winner can be 'X', 'O', or 'draw'

---

## 5. Hooks Integration

### Core Hook: useGameState (Lines 53-192)

**State Management Pattern:**
```typescript
export function useGameState(): UseGameStateResult {
  const [gameState, setGameState] = useState<GameState | null>(null);

  const initializeGame = useCallback((p1Name?: string, p2Name?: string): void => {
    const newGame = createNewGame(p1Name, p2Name);
    setGameState({ ...newGame, gamePhase: 'playing' });
  }, []);

  const makeChoice = useCallback((playerId: 'p1' | 'p2', choice: Choice): void => {
    // Complex logic for simultaneous choice handling...
  }, [gameState]);

  const loadGame = useCallback((state: GameState): void => {
    setGameState(state);
  }, []);

  return { gameState, initializeGame, makeChoice, resetGame, loadGame };
}
```

**Key Pattern: makeChoice Logic** (Lines 74-169)

This is **critically important** for understanding simultaneous choices:

```typescript
const makeChoice = useCallback((playerId: 'p1' | 'p2', choice: Choice): void => {
  const currentRoundIndex = gameState.currentRound;
  const currentRound = gameState.rounds[currentRoundIndex];

  // Update round with player's choice
  const updatedRound = {
    ...currentRound,
    choices: {
      ...currentRound.choices,
      [playerId]: choice,
    },
  };

  // Check if both players have now chosen
  const bothChosen = canCalculateResults(updatedRound);

  if (bothChosen) {
    // Calculate results since both players have chosen
    finalRound = calculateRoundResults(updatedRound);

    // Update rounds array
    const updatedRounds = gameState.rounds.map((round, index) =>
      index === currentRoundIndex ? finalRound : round
    );

    updatedGameState = { ...gameState, rounds: updatedRounds };

    // Update totals with this round's results
    updatedGameState = updateTotals(updatedGameState, currentRoundIndex);

    // Advance to next round or finish game
    updatedGameState = advanceToNextRound(updatedGameState);
  } else {
    // Only one player has chosen, just update the round
    const updatedRounds = gameState.rounds.map((round, index) =>
      index === currentRoundIndex ? finalRound : round
    );
    updatedGameState = { ...gameState, rounds: updatedRounds };
  }

  // Update metadata (timestamp, turn count)
  updatedGameState = {
    ...updatedGameState,
    metadata: {
      ...updatedGameState.metadata,
      lastMoveAt: new Date().toISOString(),
      turnCount: updatedGameState.metadata.turnCount + 1,
    },
  };

  setGameState(updatedGameState);
}, [gameState]);
```

**Tic-Tac-Toe Needs DIFFERENT Logic:**
- **Sequential moves**: One move completes the turn immediately
- **Board update**: Place mark on board, not round choices
- **Win detection**: Check for winner after EVERY move
- **Turn increment**: Always advance to next player's turn

**Comparison:**
```typescript
// Prisoner's Dilemma makeChoice:
// 1. Record choice
// 2. If both chose → calculate results → advance round
// 3. If one chose → wait for opponent

// Tic-Tac-Toe makeMove:
// 1. Place mark on board
// 2. Check for winner/draw
// 3. If game over → set gamePhase to 'finished'
// 4. Else → switch to other player's turn
```

### Hook Orchestration in App.tsx (Lines 42-45)

**Multiple hooks working together:**
```typescript
function App(): ReactElement {
  const { urlGameState, isLoading, error, generateURL } = useURLState();
  const { gameState, initializeGame, makeChoice, resetGame, loadGame } = useGameState();
  const { playerName, games, addCompletedGame, setPlayerName, clearHistory } = useGameHistory();

  // ... orchestration logic
}
```

**Load Flow** (Lines 143-172):
```typescript
// Load game from URL on mount - with rematch processing
useEffect(() => {
  if (urlGameState && !gameState) {
    // Check if this is a rematch invitation
    if (urlGameState.previousGameResults) {
      // Process rematch and extract previous game
      const { previousGame, cleanedGameState } = processRematchForP1(urlGameState);

      // Save previous game to P1's localStorage
      if (previousGame) {
        addCompletedGame(previousGame);
        addToast('Previous game results saved to your history', 'info');
      }

      // Load cleaned game state (without previousGameResults)
      loadGame(cleanedGameState);
    } else {
      // Normal game load (not rematch)
      loadGame(urlGameState);
    }
  }
}, [urlGameState, gameState, loadGame, addCompletedGame, addToast]);
```

**Pattern: Single Load Effect**
- Check if `urlGameState` exists AND `gameState` is null
- Prevents re-loading on every render
- Handles special rematch case

---

## 6. Component Patterns

### GameBoard Component (Lines 55-200)

**Simple Presentational Pattern:**
```typescript
interface GameBoardProps {
  onChoice: (choice: 'silent' | 'talk') => void;
  disabled: boolean;
  currentRound: number;
  scenarioText?: string;
}

export const GameBoard = ({ onChoice, disabled, currentRound, scenarioText }: GameBoardProps) => {
  const handleSilent = (event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    onChoice('silent');
  };

  const handleTalk = (event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    onChoice('talk');
  };

  return (
    <div style={containerStyles}>
      <h2>Round {currentRound}</h2>
      {scenarioText && <p>{scenarioText}</p>}
      <Button onClick={handleSilent} disabled={disabled}>Stay Silent</Button>
      <Button onClick={handleTalk} disabled={disabled}>Talk</Button>
      {disabled && <div>Waiting for opponent...</div>}
    </div>
  );
};
```

**Key Patterns:**
1. **Props-only, no hooks**: Pure presentation
2. **Callback props**: `onChoice(choice)` - parent handles logic
3. **Disabled state**: Visual feedback while waiting
4. **Inline styles**: Avoiding CSS imports (as per requirements)

**Tic-Tac-Toe Needs:**
- Replace buttons with 3x3 grid
- Show current player's mark (X or O)
- Disable entire board when waiting for opponent
- Highlight winning line when game over

### GameResults Component (Lines 57-302)

**Results Display Pattern:**
```typescript
interface GameResultsProps {
  gameState: GameState;
  onRematch: () => void;
  onNewGame: () => void;
  hideActions?: boolean;
}

export const GameResults = ({ gameState, onRematch, onNewGame, hideActions }: GameResultsProps) => {
  const determineWinner = (): string => {
    const { p1Gold, p2Gold } = gameState.totals;
    if (p1Gold > p2Gold) return `${gameState.players.p1.name || 'Player 1'} wins!`;
    if (p2Gold > p1Gold) return `${gameState.players.p2.name || 'Player 2'} wins!`;
    return "It's a tie!";
  };

  return (
    <div>
      <h1>Game Over!</h1>
      <div>{determineWinner()}</div>

      {/* Final totals */}
      <div>
        <div>{gameState.players.p1.name}: {gameState.totals.p1Gold} gold</div>
        <div>{gameState.players.p2.name}: {gameState.totals.p2Gold} gold</div>
      </div>

      {/* Round history */}
      <RoundHistory rounds={gameState.rounds} currentPlayer="p1" />

      {/* Message from opponent */}
      {gameState.socialFeatures?.finalMessage && <MessageBox />}

      {/* Actions */}
      {!hideActions && (
        <Button onClick={onRematch}>Rematch</Button>
        <Button onClick={onNewGame}>New Game</Button>
      )}
    </div>
  );
};
```

**Tic-Tac-Toe Needs:**
- Show winning player (X or O)
- Display final board state with winning line highlighted
- Show move history (optional)
- Same rematch/new game buttons

### App.tsx - Main Component (Lines 42-758)

**Complex State Orchestration:**

This is the **most important pattern** - how all pieces fit together.

**Flow Diagram:**
```
1. Mount
   ↓
2. useURLState loads from URL
   ↓
3. If URL has state → loadGame() → gameState set
   ↓
4. Render based on gamePhase:
   - 'setup' → New game setup
   - 'playing' → GameBoard + logic
   - 'finished' → GameResults
```

**Key Rendering Logic** (Lines 393-587):

```typescript
// Show different UI based on who needs to make a choice
const waitingForP1 = !currentRound?.choices.p1;
const waitingForP2 = !currentRound?.choices.p2;

// Determine who goes first (alternates by round)
const isP1FirstRound = gameState.currentRound % 2 === 0;

// Detect if this is a local choice vs viewing from URL
const isLocalChoice = urlGameState === null || (
  JSON.stringify(gameState.rounds[gameState.currentRound]?.choices) !==
  JSON.stringify(urlGameState.rounds[urlGameState.currentRound]?.choices)
);

return (
  <>
    {/* BOTH players need to choose - show first player's interface */}
    {waitingForP1 && waitingForP2 && (
      isP1FirstRound ? (
        <GameBoard onChoice={(choice) => makeChoice('p1', choice)} />
      ) : (
        <GameBoard onChoice={(choice) => makeChoice('p2', choice)} />
      )
    )}

    {/* P1 chose, waiting for P2 */}
    {!waitingForP1 && waitingForP2 && (
      isLocalChoice ? (
        <URLSharer /> // P1 just chose - show sharing
      ) : (
        <GameBoard onChoice={(choice) => makeChoice('p2', choice)} /> // P2 viewing
      )
    )}

    {/* P2 chose, waiting for P1 */}
    {waitingForP1 && !waitingForP2 && (
      isLocalChoice ? (
        <URLSharer /> // P2 just chose - show sharing
      ) : (
        <GameBoard onChoice={(choice) => makeChoice('p1', choice)} /> // P1 viewing
      )
    )}
  </>
);
```

**Pattern: Local vs URL Detection**
- `isLocalChoice` = true when player just made a choice locally
- Shows URL sharer immediately after local choice
- Shows game board when viewing opponent's URL

**Tic-Tac-Toe Simplification:**
- Tic-Tac-Toe is SIMPLER than Prisoner's Dilemma
- Only ONE player per turn (no simultaneous logic needed)
- Show board always, disable when not your turn
- Show URL sharer after YOUR move

**Rendering Logic:**
```typescript
// Tic-Tac-Toe rendering (SIMPLER):
const currentPlayer = getCurrentPlayer(gameState); // 'X' or 'O'
const isLocalMove = gameState.moves.length !== urlGameState?.moves.length;

return (
  <>
    {gamePhase === 'playing' && (
      <>
        <h2>Current Turn: {currentPlayer}</h2>
        <GameBoard
          board={gameState.board}
          onMove={(position) => makeMove(position)}
          disabled={!isLocalMove} // Disable if viewing opponent's URL
          currentPlayer={currentPlayer}
        />

        {isLocalMove && <URLSharer />}
      </>
    )}
  </>
);
```

---

## 7. Validation Patterns

### Zod Schema Validation

**Two Validation Functions** (gameSchema.ts, Lines 221-245):

```typescript
// 1. Throws on error
export function validateGameState(data: unknown): GameState {
  return GameStateSchema.parse(data);
}

// 2. Returns result object
export function safeValidateGameState(data: unknown): z.SafeParseReturnType<unknown, GameState> {
  return GameStateSchema.safeParse(data);
}
```

**Usage in Decryption** (encryption.ts, Lines 150-154):
```typescript
const parsed = JSON.parse(json);

// CRITICAL: NEVER trust external data without validation
const validatedState = validateGameState(parsed);

return validatedState;
```

**Pattern: Validate ALL External Data**
- URL parameters
- localStorage data (defensive)
- Any user input

**Zod Benefits:**
1. **Type Safety**: TypeScript types derived from schemas
2. **Runtime Validation**: Catches invalid data at runtime
3. **Branded Types**: Prevent type confusion
4. **Transformation**: Can transform during validation
5. **Error Messages**: Clear validation errors

**Validation Layers:**
```
External Data → JSON Parse → Zod Validation → Type-safe GameState
```

**Tic-Tac-Toe Validation:**
- Same pattern: validate all external data
- Board state validation:
  ```typescript
  export const BoardSchema = z.array(
    z.array(z.enum(['X', 'O', '']).nullable())
  ).length(3).refine(
    (board) => board.every(row => row.length === 3),
    { message: "Each row must have exactly 3 cells" }
  );
  ```

---

## 8. Breaking Changes for Tic-Tac-Toe

### Critical Differences Summary

| Aspect | Prisoner's Dilemma | Tic-Tac-Toe | Breaking Change? |
|--------|-------------------|-------------|------------------|
| **Game Flow** | Simultaneous rounds | Sequential turns | ✅ **BREAKING** |
| **State Structure** | Round-based choices | Board state + moves | ✅ **BREAKING** |
| **Game Length** | Fixed 5 rounds | Variable (5-9 moves) | ✅ **BREAKING** |
| **Win Condition** | Points accumulation | Board pattern match | ✅ **BREAKING** |
| **Turn Order** | Alternating first player | Strict X → O → X | ✅ **BREAKING** |
| **Choice Lock** | Round + player | Turn + position | ⚠️ Adapt |
| **URL Encryption** | Same pipeline | Same pipeline | ✅ Reuse |
| **localStorage** | Game history | Game history | ✅ Reuse |
| **Components** | Choice buttons | Board grid | ✅ **BREAKING** |

### Schema Changes Required

**GameState Schema Changes:**

```typescript
// REMOVE:
rounds: z.array(RoundSchema).length(5)
currentRound: z.number().int().min(0).max(4)
totals: z.object({ p1Gold, p2Gold })

// ADD:
board: z.array(z.array(z.enum(['X', 'O', '']).nullable())).length(3)
moves: z.array(MoveSchema)
currentTurn: z.number().int().min(0)
currentPlayer: z.enum(['X', 'O'])
winner: z.enum(['X', 'O', 'draw']).nullable()
winningLine: z.array(PositionSchema).optional()
```

**New Schemas Needed:**

```typescript
export const PositionSchema = z.object({
  row: z.number().int().min(0).max(2),
  col: z.number().int().min(0).max(2),
});

export const MoveSchema = z.object({
  position: PositionSchema,
  player: z.enum(['X', 'O']),
  timestamp: z.string().datetime(),
});

export const BoardSchema = z.array(
  z.array(z.enum(['X', 'O', '']).nullable())
).length(3);
```

### Hook Changes Required

**useGameState Changes:**

```typescript
// OLD (Prisoner's Dilemma):
makeChoice(playerId: 'p1' | 'p2', choice: Choice): void

// NEW (Tic-Tac-Toe):
makeMove(position: Position): void {
  // 1. Validate position is empty
  // 2. Place mark on board
  // 3. Add to moves array
  // 4. Check for winner
  // 5. If winner/draw → set gamePhase to 'finished'
  // 6. Else → switch currentPlayer
}
```

**Key Logic Changes:**

```typescript
// Prisoner's Dilemma logic:
if (bothChosen) {
  calculateRoundResults()
  updateTotals()
  advanceToNextRound()
}

// Tic-Tac-Toe logic:
makeMove(position) {
  board[position.row][position.col] = currentPlayer
  moves.push({ position, player: currentPlayer })

  const winner = checkWinner(board)
  if (winner) {
    gamePhase = 'finished'
    gameState.winner = winner
  } else if (moves.length === 9) {
    gamePhase = 'finished'
    gameState.winner = 'draw'
  } else {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X'
  }
}
```

### Component Changes Required

**GameBoard Replacement:**

```typescript
// OLD: Two buttons
<Button onClick={handleSilent}>Stay Silent</Button>
<Button onClick={handleTalk}>Talk</Button>

// NEW: 3x3 grid
<div className="board">
  {board.map((row, rowIndex) => (
    <div key={rowIndex} className="row">
      {row.map((cell, colIndex) => (
        <button
          key={colIndex}
          onClick={() => onMove({ row: rowIndex, col: colIndex })}
          disabled={disabled || cell !== null}
        >
          {cell || ''}
        </button>
      ))}
    </div>
  ))}
</div>
```

### Win Detection Algorithm

**Required Utility:**

```typescript
export function checkWinner(board: Board): 'X' | 'O' | 'draw' | null {
  // Check rows
  for (let row = 0; row < 3; row++) {
    if (board[row][0] &&
        board[row][0] === board[row][1] &&
        board[row][1] === board[row][2]) {
      return board[row][0];
    }
  }

  // Check columns
  for (let col = 0; col < 3; col++) {
    if (board[0][col] &&
        board[0][col] === board[1][col] &&
        board[1][col] === board[2][col]) {
      return board[0][col];
    }
  }

  // Check diagonals
  if (board[0][0] &&
      board[0][0] === board[1][1] &&
      board[1][1] === board[2][2]) {
    return board[0][0];
  }
  if (board[0][2] &&
      board[0][2] === board[1][1] &&
      board[1][1] === board[2][0]) {
    return board[0][2];
  }

  // Check for draw
  const isBoardFull = board.every(row => row.every(cell => cell !== null));
  if (isBoardFull) {
    return 'draw';
  }

  return null;
}

export function getWinningLine(board: Board): Position[] | null {
  // Return positions of winning line for highlighting
  // ... similar logic but returns positions
}
```

---

## Reusable Framework Code

### Can Reuse As-Is:

1. **Encryption Pipeline** (`encryption.ts`):
   - `encryptGameState()`
   - `decryptGameState()`
   - Entire HMAC integration

2. **URL Generation** (`urlGeneration.ts`):
   - `generateShareableURL()`
   - `parseGameStateFromURL()`
   - `updateURLWithState()`

3. **localStorage Framework** (`useLocalStorage.ts`):
   - `getGameHistory()`
   - `saveCompletedGame()`
   - Session ID management
   - Just change `STORAGE_KEY`

4. **Choice Lock Framework** (`choiceLockManager.ts`):
   - All functions work with generic gameId/round/player/choiceId
   - Adapt "round" to "turn"
   - Adapt "choiceId" to "position"

5. **React Hooks Pattern**:
   - `useURLState` - reuse as-is
   - `useGameHistory` - reuse as-is
   - `useGameState` - adapt logic only
   - `useChoiceLock` - adapt parameters

### Must Rebuild:

1. **Game Logic** (`payoffCalculation.ts` → `ticTacToeLogic.ts`):
   - Win detection
   - Move validation
   - Turn switching
   - Game state initialization

2. **Components**:
   - `GameBoard` → `TicTacToeBoard`
   - `PayoffMatrix` → (remove, not needed)
   - `RoundHistory` → `MoveHistory`

3. **Schemas** (`gameSchema.ts`):
   - Complete rewrite for board-based state
   - Keep validation pattern, change structure

---

## Implementation Checklist

### Phase 1: Schema & Types
- [ ] Create `BoardSchema` (3x3 grid)
- [ ] Create `PositionSchema` (row, col)
- [ ] Create `MoveSchema` (position, player, timestamp)
- [ ] Create `TicTacToeGameStateSchema`
- [ ] Update `CompletedGame` for Tic-Tac-Toe

### Phase 2: Core Game Logic
- [ ] Implement `checkWinner(board)`
- [ ] Implement `getWinningLine(board)`
- [ ] Implement `isValidMove(board, position)`
- [ ] Implement `createNewGame()`
- [ ] Implement `makeMove()` in `useGameState`

### Phase 3: Components
- [ ] Build `TicTacToeBoard` component (3x3 grid)
- [ ] Build `MoveHistory` component
- [ ] Adapt `GameResults` for Tic-Tac-Toe
- [ ] Build `WinnerDisplay` component

### Phase 4: Integration
- [ ] Adapt `App.tsx` for sequential turns
- [ ] Update URL handling (no changes needed!)
- [ ] Update localStorage key
- [ ] Update choice locking for positions

### Phase 5: Testing
- [ ] Test win detection (all patterns)
- [ ] Test draw detection
- [ ] Test URL encryption/decryption
- [ ] Test choice locking
- [ ] Test rematch flow
- [ ] Test localStorage persistence

---

## Key Takeaways

### 1. **Framework Code is Solid**
- URL encryption, localStorage, choice locking all reusable
- Don't rebuild what works - adapt it

### 2. **Game Logic is Game-Specific**
- Prisoner's Dilemma: Simultaneous rounds, points accumulation
- Tic-Tac-Toe: Sequential turns, pattern matching
- Can't reuse game logic, but CAN reuse the patterns

### 3. **Validation is Critical**
- Always validate external data with Zod
- Use branded types for type safety
- Encryption + HMAC for URL integrity

### 4. **Component Patterns are Consistent**
- Props-only presentational components
- Hooks for state management
- Inline styles (as per requirements)
- Clear separation of concerns

### 5. **Rendering Logic Differs**
- PD: Complex simultaneous choice logic
- TTT: Simpler sequential turn logic
- TTT is actually EASIER to implement

---

## File Paths Reference

All paths are absolute from project root:

**Schemas & Types:**
- `C:\Users\ryankhetlyr\Source\Repos\correspondence-games\src\features\game\schemas\gameSchema.ts`
- `C:\Users\ryankhetlyr\Source\Repos\correspondence-games\src\features\game\types\history.ts`

**Hooks:**
- `C:\Users\ryankhetlyr\Source\Repos\correspondence-games\src\features\game\hooks\useGameState.ts`
- `C:\Users\ryankhetlyr\Source\Repos\correspondence-games\src\features\game\hooks\useURLState.ts`
- `C:\Users\ryankhetlyr\Source\Repos\correspondence-games\src\features\game\hooks\useLocalStorage.ts`
- `C:\Users\ryankhetlyr\Source\Repos\correspondence-games\src\features\game\hooks\useGameHistory.ts`

**Utilities:**
- `C:\Users\ryankhetlyr\Source\Repos\correspondence-games\src\features\game\utils\encryption.ts`
- `C:\Users\ryankhetlyr\Source\Repos\correspondence-games\src\features\game\utils\urlGeneration.ts`
- `C:\Users\ryankhetlyr\Source\Repos\correspondence-games\src\features\game\utils\payoffCalculation.ts`
- `C:\Users\ryankhetlyr\Source\Repos\correspondence-games\src\features\game\utils\rematch.ts`

**Framework:**
- `C:\Users\ryankhetlyr\Source\Repos\correspondence-games\src\framework\storage\choiceLockManager.ts`
- `C:\Users\ryankhetlyr\Source\Repos\correspondence-games\src\framework\hooks\useChoiceLock.ts`
- `C:\Users\ryankhetlyr\Source\Repos\correspondence-games\src\framework\storage\hmacManager.ts`

**Components:**
- `C:\Users\ryankhetlyr\Source\Repos\correspondence-games\src\features\game\components\GameBoard.tsx`
- `C:\Users\ryankhetlyr\Source\Repos\correspondence-games\src\features\game\components\GameResults.tsx`
- `C:\Users\ryankhetlyr\Source\Repos\correspondence-games\src\App.tsx`

**Constants:**
- `C:\Users\ryankhetlyr\Source\Repos\correspondence-games\src\shared\utils\constants.ts`

---

**End of Analysis**

This document provides comprehensive pattern documentation for implementing Tic-Tac-Toe using the same framework as Prisoner's Dilemma. Use this as the primary reference when creating the Tic-Tac-Toe PRP.
