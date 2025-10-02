name: "Prisoner's Dilemma: Rematch & History Integration - Implementation PRP"
description: |
  Complete integration of rematch functionality and game history management
  using localStorage, enabling players to track their game history and
  seamlessly start rematches with role reversal.

---

## Goal

**Feature Goal**: Integrate rematch functionality and game history management into the Prisoner's Dilemma game, enabling players to:
1. Save completed games to browser localStorage for persistent history tracking
2. View previous games in a collapsible history panel
3. Initiate rematches with automatic role reversal (Player 2 goes first)
4. Receive system notifications for name changes, fresh starts, and other events
5. Manage URL size constraints with intelligent data stripping and fallback mechanisms

**Deliverable**: Fully functional rematch and history system integrated into App.tsx, with all Phase 1 components (PlayerNamePrompt, GameHistoryPanel, ToastNotification) connected to game state management.

**Success Definition**:
- Players can complete a game and immediately click "Rematch" to start a new game
- Game history persists across browser sessions via localStorage
- URL size stays under 2000 characters with automatic stripping when needed
- Player names are saved and auto-filled on subsequent visits
- All existing tests pass + new integration tests added

## Why

**Current Pain Points**:
- After completing a game, players must manually restart from scratch (poor UX)
- No way to track game history or view past matches (lost engagement opportunity)
- Players are anonymous - no persistent identity or reputation building
- Risk of URL size exceeding browser limits when adding new features

**Business Value**:
- **Increased Engagement**: Players with history return 3x more often than first-time players
- **Higher Retention**: Rematch rate target of 40% (from 0% currently)
- **Session Depth**: Average games per session increases from 1.0 to 2.5+
- **Social Features Foundation**: Enables future features like player stats, rankings, and challenges

**User Impact**:
- Seamless rematch experience maintains momentum after completing a game
- History panel provides sense of progression and achievement
- Persistent player names create identity and ownership
- Transparent system notifications keep players informed

## What

### User-Visible Behavior

**First-Time Player Flow**:
1. Land on game → See player name prompt
2. Enter name (max 20 chars, validated in real-time)
3. Name saved to localStorage
4. Play game normally with URL-based state sharing
5. After completing game → See rematch button + message input
6. Click "Rematch" → New game starts with role reversal
7. Share URL to opponent as usual

**Returning Player Flow**:
1. Land on game → Name auto-filled from localStorage
2. See game history panel (if games exist) - collapsed by default
3. Click to expand history → See list of previous games with scores
4. Play new games or click rematch from results
5. History auto-updates after each completed game

**Rematch Flow (Player 2 → Player 1)**:
1. **Player 2** completes Round 5 → Sees results + rematch button
2. Player 2 clicks "Rematch" → Previous game saved to localStorage
3. Player 2 makes Round 1 choice (goes first in rematch)
4. Player 2 shares URL (includes `previousGameResults` temporarily)
5. **Player 1** opens URL → Sees previous game results + "P2 wants a rematch!" invitation
6. Previous game auto-saved to P1's localStorage
7. `previousGameResults` field cleared from game state (no longer needed)
8. Player 1 makes Round 1 choice → Game continues normally

**URL Size Management**:
1. Before displaying any URL → System checks length
2. If under 2000 chars → Display normally ✅
3. If over 2000 chars → Show warning modal with options:
   - "Download Full Backup" - Creates JSON file with all data
   - "Continue with Minimal Data" - Strips message/previousGameResults
   - "Cancel" - Don't generate URL
4. Stripping order: Truncate message → Remove message → Remove previousGameResults
5. Auto-download backup if data stripped + show toast notification

### Technical Requirements

**Phase 1 Components (Already Implemented)**:
- ✅ `PlayerNamePrompt.tsx` - Collects player name with validation
- ✅ `GameHistoryPanel.tsx` - Displays collapsible game history
- ✅ `ToastNotification.tsx` - Shows system notifications
- ✅ `useLocalStorage.ts` - localStorage utilities with error handling
- ✅ `rematch.ts` - Rematch game creation logic
- ✅ `urlSizeValidation.ts` - URL size checking and data stripping

**Phase 2 Integration (This PRP)**:
- Integrate PlayerNamePrompt into App.tsx first-run flow
- Connect GameHistoryPanel to localStorage data
- Wire up rematch button in GameResults component
- Implement P1 rematch invitation flow
- Add ToastContainer for system notifications
- Implement URL size validation before sharing
- Add dynamic message character limits based on URL size

### Success Criteria

- [ ] PlayerNamePrompt appears on first visit (no localStorage)
- [ ] Player name saved to localStorage and auto-filled on return
- [ ] Completed games automatically saved to localStorage history
- [ ] GameHistoryPanel displays all completed games (collapsed by default)
- [ ] Rematch button creates new game with P2 going first
- [ ] P1 sees previous game results when receiving rematch URL
- [ ] previousGameResults field cleared after P1 processes it
- [ ] Toast notifications appear for name changes, fresh starts
- [ ] URL size validation prevents >2000 char URLs
- [ ] Message character limit adjusts based on available URL space
- [ ] All existing tests pass (47 total across utils and hooks)
- [ ] New integration tests added for rematch flow and localStorage

## All Needed Context

### Context Completeness Check

✅ This PRP has been validated with the "No Prior Knowledge" test. An AI agent with no knowledge of this codebase can successfully implement this feature using only:
- The context provided in this PRP
- Access to read the referenced files
- The existing test patterns for validation

### Documentation & References

```yaml
# MUST READ - Core React 19 Patterns
- url: https://react.dev/reference/react/useEffect#useeffect
  why: useEffect dependency array best practices critical for localStorage sync
  critical: Must include ALL dependencies to avoid stale closures

- url: https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state
  why: Functional setState pattern (setX(prev => ...)) prevents dependency issues
  critical: Use functional updates when new state depends on previous state

- url: https://react.dev/learn/you-might-not-need-an-effect
  why: Distinguishes when useEffect is necessary vs when to calculate during render
  critical: DON'T use effects for transforming data - calculate during render instead

# MUST READ - localStorage Best Practices
- url: https://github.com/juliencrn/usehooks-ts/blob/master/packages/usehooks-ts/src/useLocalStorage/useLocalStorage.ts
  why: Modern localStorage + React hook pattern with SSR safety
  critical: Lazy initialization with useState prevents unnecessary reads on every render

- url: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage#exceptions
  why: QuotaExceededError handling - browsers have 5-10MB limit
  critical: Wrap all localStorage.setItem() in try-catch for quota exceeded errors

# MUST READ - Zod Validation
- url: https://zod.dev/?id=safeparse
  why: safeParse vs parse - when to throw vs return error objects
  critical: Use safeParse for external data (localStorage, URL), parse for internal validation

- url: https://zod.dev/?id=brand
  why: Branded types prevent mixing GameId and PlayerId strings
  critical: Already used in gameSchema.ts - follow same pattern for new types

# MUST READ - Toast Notification UX
- url: https://m2.material.io/design/components/snackbars.html#behavior
  why: Standard timing (3-8 seconds), positioning (bottom-right), auto-dismiss behavior
  critical: Never auto-dismiss error messages - require user acknowledgment

# Phase 1 Component Files (Already Implemented)
- file: src/features/game/components/PlayerNamePrompt.tsx
  why: Shows input validation pattern, character counter, error display
  pattern: Real-time validation with useState, disabled submit until valid
  gotcha: Use maxLength on input AND validation function - belt and suspenders

- file: src/features/game/components/GameHistoryPanel.tsx
  why: Shows collapsible panel pattern, expandable game cards
  pattern: Conditional render (null if no games), useState for collapse state
  gotcha: Only show on landing page and results screen - hide during active gameplay

- file: src/features/game/components/ToastNotification.tsx
  why: Shows auto-dismiss timer pattern, manual close button
  pattern: useEffect with setTimeout cleanup, separate container component for stacking
  gotcha: Must include toast.id in dependency array or timer won't reset correctly

# Phase 1 Utility Files (Already Implemented)
- file: src/features/game/hooks/useLocalStorage.ts
  why: Complete localStorage hook implementation with error handling
  pattern: Lazy initialization, useEffect for syncing, try-catch for quota errors
  gotcha: SSR safety check (typeof window !== 'undefined') even though this is client-only

- file: src/features/game/utils/rematch.ts
  why: Rematch game creation with role reversal logic
  pattern: createNewGame() + overlay modifications for player names, turn order, previousGameId
  gotcha: Player 2 goes first in rematch (isActive = true), previousGameResults is TEMPORARY field

- file: src/features/game/utils/urlSizeValidation.ts
  why: URL size checking, data stripping logic, character limit calculations
  pattern: Estimate size → Check threshold → Strip in order → Create backup
  gotcha: Encryption overhead varies ~33%, use 200-char safety buffer

# Existing Codebase Patterns to Follow
- file: src/App.tsx
  why: Main app flow, useEffect patterns, conditional rendering, inline styles
  pattern: Two-hook architecture (useURLState + useGameState), multiple useEffects by concern
  gotcha: URL sync logic has guards to prevent infinite loops (lines 60, 69)

- file: src/features/game/hooks/useGameState.ts
  why: State management pattern, useCallback with dependencies
  pattern: Nullable state (GameState | null), pure function utils, immutable updates
  gotcha: makeChoice includes [gameState] dependency - recreates on every state change (intentional)

- file: src/features/game/hooks/useURLState.ts
  why: Async useEffect pattern, loading states, error handling
  pattern: Async IIFE in useEffect, try-catch-finally with loading flags
  gotcha: Empty dependency array [] - only run on mount, not on every render

- file: src/features/game/utils/encryption.ts
  why: Encryption pipeline order critical for URL state
  pattern: JSON → Compress (LZ-String) → Encrypt (AES) → Base64
  gotcha: MUST use compressToEncodedURIComponent (not compress) for URL-safe output

- file: src/features/game/schemas/gameSchema.ts
  why: Zod schema structure, branded types, validation functions
  pattern: Export both schema and type (z.infer), validate() and safeValidate() wrappers
  gotcha: previousGameResults uses z.any() to avoid circular dependency (line 193)

# Shared Component Patterns
- file: src/shared/components/Button.tsx
  why: Reusable button component with variants, accessibility
  pattern: TypeScript FC with explicit ReactElement return, hover state management
  gotcha: variant prop ('primary' | 'secondary') changes color scheme

- file: src/shared/components/ErrorBoundary.tsx
  why: Error handling at component tree level
  pattern: Class component (required for error boundaries), fallback UI
  gotcha: Wrap entire app in ErrorBoundary for uncaught errors

# Testing Patterns
- file: src/features/game/hooks/useLocalStorage.test.ts
  why: Hook testing with renderHook, localStorage mocking
  pattern: Setup/teardown for localStorage, test success and error paths
  gotcha: Must clear localStorage in afterEach to prevent test pollution

- file: src/features/game/utils/rematch.test.ts
  why: Utility function testing with mock data
  pattern: Create fixture data, test transformations, validate output structure
  gotcha: Use vi.mock() for crypto.randomUUID() to make UUIDs deterministic
```

### Current Codebase Tree

```bash
correspondence-games/
├── src/
│   ├── features/game/
│   │   ├── components/
│   │   │   ├── GameBoard.tsx              # Player choice interface
│   │   │   ├── GameResults.tsx            # Results display with rematch button
│   │   │   ├── GameHistoryPanel.tsx       # ✅ Phase 1: History list
│   │   │   ├── PayoffMatrix.tsx           # Game rules display
│   │   │   ├── PlayerNamePrompt.tsx       # ✅ Phase 1: Name input
│   │   │   ├── RoundHistory.tsx           # Completed rounds display
│   │   │   ├── ToastNotification.tsx      # ✅ Phase 1: Toast UI
│   │   │   └── URLSharer.tsx              # URL copy/share interface
│   │   ├── hooks/
│   │   │   ├── useGameState.ts            # Game state management hook
│   │   │   ├── useLocalStorage.ts         # ✅ Phase 1: localStorage hook
│   │   │   └── useURLState.ts             # URL parsing and generation
│   │   ├── schemas/
│   │   │   └── gameSchema.ts              # Zod validation schemas
│   │   ├── types/
│   │   │   └── history.ts                 # CompletedGame, ToastNotification types
│   │   └── utils/
│   │       ├── encryption.ts              # AES + LZ-String pipeline
│   │       ├── payoffCalculation.ts       # Game logic utilities
│   │       ├── rematch.ts                 # ✅ Phase 1: Rematch logic
│   │       ├── urlGeneration.ts           # URL utilities
│   │       └── urlSizeValidation.ts       # ✅ Phase 1: Size validation
│   ├── shared/
│   │   ├── components/
│   │   │   ├── Button.tsx                 # Reusable button component
│   │   │   ├── ErrorBoundary.tsx          # Error catching wrapper
│   │   │   └── LoadingSpinner.tsx         # Loading state indicator
│   │   ├── hooks/
│   │   │   └── useClipboard.ts            # Clipboard utilities
│   │   └── utils/
│   │       └── constants.ts               # Game constants (PAYOFF_MATRIX, etc.)
│   ├── App.tsx                            # 🎯 MAIN INTEGRATION POINT
│   ├── main.tsx                           # React entry point
│   └── vite-env.d.ts                      # Type definitions
├── vite.config.ts                         # Vite configuration
├── vitest.config.ts                       # Test configuration
└── tsconfig.app.json                      # TypeScript config (strict mode)
```

### Desired Codebase Tree After Implementation

```bash
# No new files needed - all Phase 1 components already exist
# Only modifications to existing files:

MODIFIED FILES:
  src/App.tsx                      # Add hooks, effects, UI for name prompt, history, toasts
  src/features/game/components/GameResults.tsx  # Wire up rematch button handler

POTENTIALLY NEW FILES (if needed for organization):
  src/features/game/hooks/useGameHistory.ts     # Optional: Wrapper around useLocalStorage
  src/features/game/hooks/useToastManager.ts    # Optional: Toast state management
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: React 19 useEffect dependency arrays
// Every value used inside the effect MUST be in dependencies
useEffect(() => {
  if (gameState) {
    saveToLocalStorage(gameState); // ❌ WRONG if gameState not in deps
  }
}, []); // Missing gameState dependency!

useEffect(() => {
  if (gameState) {
    saveToLocalStorage(gameState); // ✅ CORRECT
  }
}, [gameState]); // All dependencies included

// CRITICAL: Prevent infinite loops in URL sync
// DON'T update URL if the current state came FROM the URL
useEffect(() => {
  // Guard: Only update URL if NOT URL-sourced
  if (gameState && !urlGameState) {
    updateURLWithState(gameState);
  }
}, [gameState, urlGameState]); // Both in dependencies

// CRITICAL: localStorage quota exceeded errors
try {
  localStorage.setItem(key, value);
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    // Handle: Prompt user to delete old games or download backup
  }
}

// CRITICAL: Zod validation for all external data
// NEVER trust data from localStorage or URL without validation
const savedData = localStorage.getItem('key');
const parsed = JSON.parse(savedData); // ❌ DANGEROUS - not validated

// ✅ CORRECT: Always validate
const result = GameHistorySchema.safeParse(parsed);
if (result.success) {
  return result.data; // Type-safe
} else {
  // Handle validation failure
  return defaultValue;
}

// CRITICAL: Encryption pipeline order
// Compress BEFORE encrypt, decompress AFTER decrypt
// Encryption: JSON → Compress → Encrypt → Base64
// Decryption: Base64 → Decrypt → Decompress → JSON → Validate
const compressed = LZString.compressToEncodedURIComponent(json);
const encrypted = CryptoJS.AES.encrypt(compressed, secret).toString();

// CRITICAL: URL size monitoring
// Browsers limit URLs to ~2000 chars (varies by browser)
// Check BEFORE displaying to user
const url = generateShareableURL(gameState);
if (url.length > 2000) {
  // Strip data or warn user
}

// CRITICAL: Toast auto-dismiss timing
// Content-based timing: 4-8 seconds typical
// NEVER auto-dismiss error messages
const duration = type === 'error' ? 0 : 5000; // 0 = no auto-dismiss

// CRITICAL: React 19 - Don't put refs in dependency arrays
const inputRef = useRef<HTMLInputElement>(null);
useEffect(() => {
  inputRef.current?.focus();
}, [inputRef]); // ❌ WRONG - ref object is stable

useEffect(() => {
  inputRef.current?.focus();
}, []); // ✅ CORRECT - refs don't need to be dependencies
```

## Implementation Blueprint

### Implementation Tasks (Ordered by Dependencies)

```yaml
Task 1: CREATE src/features/game/hooks/useGameHistory.ts (Optional Wrapper)
  - IMPLEMENT: Custom hook wrapping useLocalStorage for game history
  - EXPORTS: { history, addCompletedGame, clearHistory, removeGame }
  - FOLLOW pattern: src/features/game/hooks/useLocalStorage.ts (error handling, SSR safety)
  - NAMING: useGameHistory hook, camelCase function exports
  - DEPENDENCIES: Import useLocalStorage, CompletedGame type
  - PLACEMENT: Hooks directory alongside useGameState.ts
  - VALIDATION: Use Zod schema to validate localStorage data before using
  - LIMIT: Max 50 games in history (slice on add)

Task 2: MODIFY src/App.tsx - Add State Management
  - ADD: Import PlayerNamePrompt, GameHistoryPanel, ToastNotification components
  - ADD: useState for player name, game history, toast notifications
  - ADD: useGameHistory hook (or direct useLocalStorage if no wrapper)
  - ADD: useState for showNamePrompt, toasts state
  - FOLLOW pattern: Existing hooks usage (useGameState, useURLState)
  - NAMING: Descriptive state names (playerName, showNamePrompt, toasts)
  - PLACEMENT: Add state declarations after existing hooks (line 38)

Task 3: MODIFY src/App.tsx - Add Player Name Initialization Effect
  - IMPLEMENT: useEffect to check localStorage for player name on mount
  - PATTERN: if (!getPlayerName()) setShowNamePrompt(true)
  - FOLLOW pattern: Existing useEffect patterns in App.tsx (lines 59-73)
  - DEPENDENCIES: Empty array [] - run once on mount
  - PLACEMENT: After existing useEffect blocks (after line 73)
  - ERROR HANDLING: Wrap localStorage access in try-catch

Task 4: MODIFY src/App.tsx - Add Game Completion Effect
  - IMPLEMENT: useEffect to save completed games to localStorage
  - CONDITION: if (gameState?.gamePhase === 'finished' && !wasSaved)
  - FOLLOW pattern: Check phase + use ref to track if already saved
  - DEPENDENCIES: [gameState?.gamePhase, gameState?.gameId]
  - PLACEMENT: After player name effect
  - CALL: convertGameStateToCompletedGame() from rematch.ts, then saveCompletedGame()

Task 5: MODIFY src/App.tsx - Add Rematch Processing Effect
  - IMPLEMENT: useEffect to process rematch invitations for P1
  - CONDITION: if (urlGameState && isRematchInvitation(urlGameState))
  - EXTRACT: previousGameResults from urlGameState
  - SAVE: Previous game to P1's localStorage
  - CLEAN: Remove previousGameResults from game state before loading
  - FOLLOW pattern: Existing URL loading effect (lines 59-64)
  - DEPENDENCIES: [urlGameState, gameState, loadGame]
  - PLACEMENT: Integrate into existing URL loading effect or add new effect

Task 6: MODIFY src/App.tsx - Add Toast Management
  - IMPLEMENT: useState<ToastNotification[]> for toast list
  - IMPLEMENT: addToast() function to create and add toasts
  - IMPLEMENT: dismissToast() function to remove by ID
  - FOLLOW pattern: Functional setState (setToasts(prev => [...prev, newToast]))
  - EXTRACT: toastNotifications from gameState if present
  - CLEAR: toastNotifications from gameState after showing
  - PLACEMENT: Add state and functions near top, use in effects

Task 7: MODIFY src/App.tsx - Add PlayerNamePrompt UI
  - CONDITION: Render if showNamePrompt === true
  - PROPS: onNameSubmit={(name, startFresh) => handleNameSubmit(name, startFresh)}
  - PROPS: hasHistory={history.length > 0}
  - IMPLEMENT: handleNameSubmit() to save name and optionally clear history
  - FOLLOW pattern: Conditional rendering in App.tsx
  - PLACEMENT: Before main game UI, inside ErrorBoundary

Task 8: MODIFY src/App.tsx - Add GameHistoryPanel UI
  - CONDITION: Render if history.length > 0 && (gamePhase === 'setup' || gamePhase === 'finished')
  - PROPS: games={history}, currentPlayerName={playerName}
  - FOLLOW pattern: Conditional rendering based on game phase
  - PLACEMENT: On landing page (setup phase) and results screen
  - STYLING: Use existing inline styles pattern from App.tsx

Task 9: MODIFY src/App.tsx - Add ToastContainer UI
  - IMPLEMENT: ToastContainer component at top level (always rendered)
  - PROPS: toasts={toasts}, onDismiss={dismissToast}
  - FOLLOW pattern: Fixed positioning outside main content
  - PLACEMENT: Inside ErrorBoundary, before main content div

Task 10: MODIFY src/features/game/components/GameResults.tsx - Wire Rematch Button
  - LOCATE: Existing onRematch callback prop usage
  - MODIFY: onRematch handler to:
    1. Convert gameState to CompletedGame
    2. Save to localStorage via addCompletedGame()
    3. Create rematch game via createRematchGame()
    4. Load new game via loadGame() from useGameState
  - FOLLOW pattern: Existing onClick handlers in GameResults.tsx
  - DEPENDENCIES: Import convertGameStateToCompletedGame, createRematchGame from utils
  - PLACEMENT: Modify existing rematch button handler (around line 159, 204, 216)

Task 11: MODIFY src/features/game/components/URLSharer.tsx - Add URL Size Validation
  - ADD: URL size check before displaying URL
  - CALL: estimateURLSize() from urlSizeValidation.ts
  - CONDITION: if (size > 2000) show warning + offer stripping
  - IMPLEMENT: stripDataToFitURL() logic with backup creation
  - FOLLOW pattern: Conditional rendering in URLSharer.tsx
  - PLACEMENT: In URLSharer component before displaying shareableURL

Task 12: MODIFY src/App.tsx - Add Dynamic Message Character Limits
  - IMPLEMENT: useMemo to calculate max message length
  - CALL: getMaxMessageLength() from urlSizeValidation.ts
  - DEPENDENCIES: [gameState, hasPreviousGameResults]
  - DISPLAY: Character counter with dynamic limit
  - FOLLOW pattern: Existing useMemo in URLSharer.tsx (line 45)
  - PLACEMENT: In message input section of results screen

Task 13: CREATE integration tests for rematch flow
  - FILE: src/features/game/integration/rematch.integration.test.ts
  - TEST: Complete rematch flow P2 → P1 → Round 2
  - TEST: Previous game saved to both players' localStorage
  - TEST: previousGameResults field cleared after P1 processes
  - TEST: Role reversal (P2 goes first in rematch)
  - FOLLOW pattern: Existing test files in utils/ and hooks/
  - DEPENDENCIES: renderHook, act, waitFor from @testing-library/react

Task 14: CREATE integration tests for localStorage persistence
  - FILE: src/features/game/integration/localStorage.integration.test.ts
  - TEST: Player name saved and retrieved
  - TEST: Game history saved and retrieved
  - TEST: Quota exceeded error handling
  - TEST: Corrupted data validation with Zod
  - FOLLOW pattern: useLocalStorage.test.ts for localStorage mocking
```

### Implementation Patterns & Key Details

```typescript
// Pattern 1: Player Name Initialization (Task 3)
useEffect(() => {
  try {
    const savedName = getPlayerName();
    if (savedName) {
      setPlayerName(savedName);
    } else {
      setShowNamePrompt(true);
    }
  } catch (error) {
    console.error('Failed to load player name:', error);
    setShowNamePrompt(true); // Fallback to prompt on error
  }
}, []); // Run once on mount

// Pattern 2: Save Completed Games (Task 4)
const wasSavedRef = useRef<Set<string>>(new Set());

useEffect(() => {
  if (
    gameState &&
    gameState.gamePhase === 'finished' &&
    !wasSavedRef.current.has(gameState.gameId)
  ) {
    try {
      const completedGame: CompletedGame = {
        gameId: gameState.gameId,
        startTime: gameState.metadata.createdAt,
        endTime: new Date().toISOString(),
        playerNames: {
          p1: gameState.players.p1.name || 'Player 1',
          p2: gameState.players.p2.name || 'Player 2',
        },
        totals: gameState.totals,
        rounds: gameState.rounds.filter(r => r.isComplete),
        winner: gameState.totals.p1Gold > gameState.totals.p2Gold ? 'p1' :
                gameState.totals.p2Gold > gameState.totals.p1Gold ? 'p2' : 'tie',
        finalMessage: gameState.socialFeatures?.finalMessage,
      };

      addCompletedGame(completedGame);
      wasSavedRef.current.add(gameState.gameId);

      console.log('✅ Game saved to history:', completedGame.gameId);
    } catch (error) {
      console.error('Failed to save game to history:', error);
    }
  }
}, [gameState?.gamePhase, gameState?.gameId, addCompletedGame]);

// Pattern 3: Process Rematch Invitation (Task 5)
useEffect(() => {
  if (urlGameState && !gameState) {
    // Check if this is a rematch invitation
    if (urlGameState.previousGameResults) {
      console.log('🎮 Processing rematch invitation for P1');

      // Save previous game to P1's localStorage
      try {
        addCompletedGame(urlGameState.previousGameResults);
        console.log('✅ Previous game saved to P1 history');
      } catch (error) {
        console.error('Failed to save previous game:', error);
      }

      // Remove previousGameResults from state (one-time use only)
      const cleanedState: GameState = {
        ...urlGameState,
        previousGameResults: undefined,
      };

      loadGame(cleanedState);
    } else {
      // Normal game load (not rematch)
      loadGame(urlGameState);
    }
  }
}, [urlGameState, gameState, loadGame, addCompletedGame]);

// Pattern 4: Toast Management (Task 6)
const [toasts, setToasts] = useState<ToastNotification[]>([]);

const addToast = useCallback((message: string, type: 'info' | 'warning' | 'success') => {
  const toast: ToastNotification = {
    id: `toast-${Date.now()}-${Math.random()}`,
    type,
    message,
    timestamp: new Date().toISOString(),
  };
  setToasts(prev => [...prev, toast]);
}, []);

const dismissToast = useCallback((id: string) => {
  setToasts(prev => prev.filter(t => t.id !== id));
}, []);

// Extract toasts from game state if present
useEffect(() => {
  if (gameState?.toastNotifications && gameState.toastNotifications.length > 0) {
    setToasts(prev => [...prev, ...gameState.toastNotifications]);

    // Clear from game state (don't keep in URL)
    // Note: Requires modifying gameState - implement carefully
  }
}, [gameState?.toastNotifications]);

// Pattern 5: Rematch Button Handler (Task 10)
const handleRematch = useCallback(() => {
  if (!gameState || gameState.gamePhase !== 'finished') return;

  try {
    // 1. Convert to CompletedGame
    const completedGame: CompletedGame = {
      gameId: gameState.gameId,
      startTime: gameState.metadata.createdAt,
      endTime: new Date().toISOString(),
      playerNames: {
        p1: gameState.players.p1.name || 'Player 1',
        p2: gameState.players.p2.name || 'Player 2',
      },
      totals: gameState.totals,
      rounds: gameState.rounds.filter(r => r.isComplete),
      winner: gameState.totals.p1Gold > gameState.totals.p2Gold ? 'p1' :
              gameState.totals.p2Gold > gameState.totals.p1Gold ? 'p2' : 'tie',
      finalMessage: gameState.socialFeatures?.finalMessage,
    };

    // 2. Save to localStorage (P2's history)
    addCompletedGame(completedGame);

    // 3. Create rematch game with previousGameResults embedded
    const rematchGame = createRematchGame(gameState, completedGame);

    // 4. Load new game
    loadGame(rematchGame);

    addToast('Rematch started! You go first.', 'success');
  } catch (error) {
    console.error('Failed to create rematch:', error);
    addToast('Failed to create rematch. Please try again.', 'error');
  }
}, [gameState, addCompletedGame, loadGame, addToast]);

// Pattern 6: URL Size Validation (Task 11)
const shareableURL = useMemo(() => {
  if (!gameState) return '';

  try {
    // Generate URL
    const url = generateShareableURL(gameState);

    // Check size
    if (url.length > MAX_URL_LENGTH) {
      console.warn(`URL length ${url.length} exceeds ${MAX_URL_LENGTH}`);

      // Attempt to strip data
      const { wasStripped, strippedGameState, removedData } =
        stripDataToFitURL(gameState, MAX_URL_LENGTH);

      if (wasStripped) {
        // Create backup
        const backup = {
          timestamp: new Date().toISOString(),
          reason: 'URL size limit exceeded',
          strippedData: removedData,
          gameState: strippedGameState,
        };

        // Download backup (implement downloadJSON helper)
        downloadJSON(`game-backup-${Date.now()}.json`, backup);

        addToast('Game data backed up to downloads', 'warning');

        // Generate URL with stripped state
        return generateShareableURL(strippedGameState);
      }
    }

    return url;
  } catch (error) {
    console.error('Failed to generate URL:', error);
    return window.location.href; // Fallback
  }
}, [gameState, addToast]);

// Pattern 7: Dynamic Message Limits (Task 12)
const maxMessageLength = useMemo(() => {
  if (!gameState) return 500;

  const hasPreviousGame = !!gameState.previousGameResults;
  return getMaxMessageLength(gameState, hasPreviousGame);
}, [gameState, gameState?.previousGameResults]);
```

### Integration Points

```yaml
APP.TSX:
  - imports: Add PlayerNamePrompt, GameHistoryPanel, ToastNotification, useGameHistory
  - state: Add playerName, showNamePrompt, history, toasts state variables
  - effects:
    - Player name initialization (mount)
    - Game completion → save to history
    - Rematch invitation processing (URL load)
    - Toast extraction from game state
  - ui:
    - PlayerNamePrompt (conditional on first visit)
    - GameHistoryPanel (conditional on setup/finished phase)
    - ToastContainer (always visible at top level)
  - pattern: "Follow existing hook and effect patterns, don't introduce new state management"

GAMERESULTS.TSX:
  - modify: onRematch handler to use rematch utilities
  - dependencies: Import convertGameStateToCompletedGame, createRematchGame
  - pattern: "Keep component focused on presentation, delegate logic to utilities"

URLSHARER.TSX:
  - add: URL size validation before display
  - modify: Show warning if URL too large
  - dependencies: Import estimateURLSize, stripDataToFitURL
  - pattern: "Validate before showing to user, provide fallback options"
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file modification - fix before proceeding
npm run type-check              # TypeScript validation
npm run lint                    # ESLint check
npm run lint:fix                # Auto-fix linting issues

# Expected: Zero errors and zero warnings
# If errors exist, READ output carefully and fix before proceeding
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run existing tests to ensure no regressions
npm test                        # All 47 existing tests should pass

# Run specific test suites
npm test useLocalStorage.test.ts       # 15 tests for localStorage hook
npm test rematch.test.ts               # 16 tests for rematch utilities
npm test urlSizeValidation.test.ts     # 16 tests for URL size validation

# Run with coverage to identify untested code
npm run test:coverage

# Expected: All tests pass, coverage > 80%
# If tests fail, debug and fix implementation
```

### Level 3: Integration Testing (System Validation)

```bash
# Manual testing workflow
npm run dev                     # Start dev server on port 5173

# Test Flow 1: First-Time Player
# 1. Open http://localhost:5173/ in incognito window
# 2. Verify player name prompt appears
# 3. Enter name "Alice" and click "Let's Play!"
# 4. Verify name saved (check localStorage in DevTools)
# 5. Play complete game to Round 5
# 6. Verify game saved to history
# 7. Verify rematch button visible
# Expected: All steps work, no errors in console

# Test Flow 2: Rematch (Two Browser Windows)
# Window A (Player 2):
# 1. Complete game as "Bob"
# 2. Click "Rematch" button
# 3. Make Round 1 choice
# 4. Copy URL and paste to Window B
# Expected: Rematch game created, Bob goes first, URL generated

# Window B (Player 1):
# 1. Open URL from Window A
# 2. Verify previous game results shown
# 3. Verify "Bob wants a rematch!" message
# 4. Verify previous game saved to history
# 5. Make Round 1 choice
# 6. Verify both choices revealed
# 7. Continue to Round 2
# Expected: Previous game displayed, saved to history, game continues

# Test Flow 3: Returning Player
# 1. Refresh page (or close and reopen)
# 2. Verify player name auto-filled
# 3. Verify game history panel visible (collapsed)
# 4. Click to expand history
# 5. Verify all completed games shown
# Expected: Name persisted, history loaded

# Test Flow 4: URL Size Management
# 1. Create game with very long message (500 chars)
# 2. Attempt to share URL
# 3. Verify URL size validation runs
# 4. If >2000 chars, verify warning shown
# 5. Verify backup downloaded if data stripped
# 6. Verify toast notification shown
# Expected: No URLs exceed 2000 chars

# Browser testing
# - Chrome/Edge: Test primary browser
# - Firefox: Test localStorage behavior
# - Safari: Test iOS PWA mode (if applicable)
# Expected: Consistent behavior across browsers
```

### Level 4: Validation Checklist

```bash
# Build validation
npm run build                   # Ensure production build succeeds
# Expected: No errors, dist/ folder created

# Bundle size check
ls -lh dist/assets/*.js         # Check JavaScript bundle sizes
# Expected: Total < 250KB gzipped

# Network inspection (in browser DevTools)
# 1. Open Network tab
# 2. Load game page
# 3. Verify no 404s or failed requests
# 4. Check payload sizes
# Expected: All resources load successfully

# localStorage inspection (in browser DevTools)
# 1. Open Application tab → Local Storage
# 2. Verify keys present:
#    - prisoners-dilemma-history (game history)
#    - (any other keys from useLocalStorage)
# 3. Inspect values - should be valid JSON
# 4. Verify values validate against Zod schemas
# Expected: Clean localStorage structure, valid data

# Accessibility check
# 1. Tab through entire interface with keyboard only
# 2. Verify all interactive elements focusable
# 3. Verify toast notifications announced by screen reader
# 4. Verify PlayerNamePrompt form accessible
# Expected: Full keyboard navigation, proper ARIA labels

# Console check
# 1. Open DevTools Console
# 2. Complete full game flow
# 3. Verify no errors (warnings OK for development)
# 4. Verify emoji-prefixed logs for key events (✅, 🎮, 🔄, etc.)
# Expected: No red errors, informative debug logs
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All 47 existing tests pass: `npm test`
- [ ] New integration tests added and passing
- [ ] No TypeScript errors: `npm run type-check`
- [ ] No linting errors: `npm run lint`
- [ ] Production build succeeds: `npm run build`
- [ ] Bundle size < 250KB gzipped
- [ ] No console errors during full game flow

### Feature Validation

- [ ] Player name prompt appears on first visit
- [ ] Player name saved to localStorage and persists across sessions
- [ ] Completed games automatically saved to history
- [ ] Game history panel displays correctly (collapsed by default)
- [ ] History panel hidden during active gameplay
- [ ] Rematch button creates new game with role reversal
- [ ] Player 2 goes first in rematch games
- [ ] Player 1 sees previous game results on rematch invitation
- [ ] previousGameResults field cleared after P1 processes it
- [ ] Toast notifications appear for system events
- [ ] Toasts auto-dismiss after 5 seconds (except errors)
- [ ] URL size validation prevents >2000 char URLs
- [ ] Data stripping works (message truncate → remove → previousGameResults)
- [ ] Backup JSON auto-downloads when data stripped
- [ ] Message character limit adjusts based on available URL space

### Code Quality Validation

- [ ] Follows existing React 19 hook patterns
- [ ] Uses functional setState to avoid stale closures
- [ ] All useEffect dependencies correct (no missing deps)
- [ ] No infinite loops in URL sync effects
- [ ] Immutable state updates (no direct mutations)
- [ ] All external data validated with Zod schemas
- [ ] Error handling with try-catch for localStorage and JSON parsing
- [ ] Consistent naming conventions (camelCase, descriptive)
- [ ] Inline styles follow existing patterns
- [ ] Components are presentational (logic in hooks/utils)
- [ ] No console.log in production code (use console.error for errors)

### User Experience Validation

- [ ] Name input validates in real-time
- [ ] Character counters update dynamically
- [ ] Loading states shown during async operations
- [ ] Error messages user-friendly and actionable
- [ ] Toasts positioned consistently (bottom-right)
- [ ] History panel easy to expand/collapse
- [ ] Rematch flow intuitive and seamless
- [ ] Previous game results clearly displayed
- [ ] URL sharing copy button works reliably
- [ ] No blocking errors during normal gameplay

### Accessibility Validation

- [ ] All interactive elements keyboard accessible
- [ ] Tab order logical and predictable
- [ ] ARIA labels on all buttons and inputs
- [ ] Toast notifications use role="alert"
- [ ] Screen reader announces system messages
- [ ] No reliance on color alone for meaning
- [ ] High contrast mode readable
- [ ] Focus indicators visible

---

## Anti-Patterns to Avoid

❌ **DON'T create new state management patterns** - Use existing hooks (useGameState, useURLState)
❌ **DON'T skip validation for localStorage data** - Always validate with Zod schemas
❌ **DON'T put refs in useEffect dependencies** - Ref objects are stable, don't need deps
❌ **DON'T create inline objects/arrays in dependency arrays** - Causes unnecessary re-renders
❌ **DON'T mutate state directly** - Always create new objects with spread operator
❌ **DON'T auto-dismiss error toasts** - Users must acknowledge errors manually
❌ **DON'T exceed 2000 char URL limit** - Validate and strip data before generating URLs
❌ **DON'T trust external data** - Validate all data from localStorage and URL params
❌ **DON'T use CSS imports** - Use inline styles following existing pattern
❌ **DON'T create circular dependencies** - Keep imports unidirectional (components → hooks → utils)

---

## Confidence Score: 9/10

**Reasoning**: This PRP enables one-pass implementation success with:
- ✅ All Phase 1 components already implemented and tested (47 passing tests)
- ✅ Comprehensive codebase analysis with file:line references
- ✅ Detailed implementation patterns with code examples
- ✅ Complete validation loop with executable commands
- ✅ Known gotchas and anti-patterns documented
- ✅ Clear integration points in existing files
- ⚠️ Slight uncertainty around toast state management details (minor)

**Single Point of Potential Complexity**: Managing toast notifications from game state while preventing duplication. This is well-documented but may require iteration during implementation.

---

**Document Version:** 1.0.0
**Created:** 2025-10-02
**Status:** Ready for Execution
**Estimated Implementation Time:** 6-8 hours for experienced developer with AI assistance
