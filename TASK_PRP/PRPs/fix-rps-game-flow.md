# TASK PRP: Fix Rock-Paper-Scissors Game Flow

**Created**: 2025-10-05
**Status**: Ready for Execution
**Complexity**: Medium
**Est. Time**: 1-2 hours

---

## Goal

Fix the Rock-Paper-Scissors game flow to implement **result chaining** - where the player who completes a round (makes the 2nd choice) immediately sees results AND makes their next choice before sharing the URL. This minimizes URL exchanges and gives each player maximum control while the game is in their hands.

**Key Principle**: Do as much as possible while you have the game, minimize back-and-forth.

---

## Problem Analysis

### Current Broken Flow

```
Round 1:
P1 chooses → URL for P2
P2 chooses → sees results + Round 2 choice immediately → URL for P1
P1 sees results + Round 2 choice → URL for P2
P2 sees results + Round 3 choice → URL for P1
...continues incorrectly
```

### Desired Correct Flow

```
Round 1 (P1 starts):
  P1 chooses rock → URL for P2
  P2 chooses paper → sees "P2 wins Round 1" → chooses scissors for Round 2 → URL for P1

Round 2 (P2 started by choosing above):
  P1 sees "Round 1: P2 wins" → chooses rock → sees "P1 wins Round 2" → chooses paper for Round 3 → URL for P2

Round 3 (P1 started by choosing above):
  P2 sees "Round 2: P1 wins" → chooses rock → sees "P1 wins Round 3" (FINAL) → URL for P1

Game Over:
  P1 sees all results → Winner declared
```

**Key Pattern**:
- Player makes **1st choice of round** → shares URL immediately
- Player makes **2nd choice of round** → sees current round results → IF more rounds: makes next choice → shares URL
- This minimizes URL exchanges - each player does as much as possible while they have control
- Alternates who goes first each round (via `alternateStarter` config)

---

## Context

### Affected Files

```yaml
files:
  primary:
    - path: correspondence-games-framework/games/rock-paper-scissors/src/App.tsx
      lines: 60-120, 210-316
      why: Contains game flow logic and state management

  reference:
    - path: src/features/game/components/GameBoard.tsx
      why: Example of Prisoner's Dilemma turn flow (working reference)

    - path: src/features/game/utils/gameLogic.ts
      why: Turn progression logic patterns

    - path: src/framework/core/engine/turnEngine.ts
      why: Helper functions for turn management
```

### Configuration Reference

```yaml
# From rock-paper-scissors.yaml
progression:
  totalRounds: 3
  startingPlayer: 1
  alternateStarter: true   # Alternates who goes first each round
  showRunningTotal: true
```

**CRITICAL**: `alternateStarter: true` means:
- Round 1: P1 goes first (makes 1st choice)
- Round 2: P2 goes first (makes 1st choice)
- Round 3: P1 goes first (makes 1st choice)
- Pattern: Odd rounds P1 starts, even rounds P2 starts

---

## Root Cause Analysis

### Issue #1: Missing "Chain" Logic

**Location**: `App.tsx:60-95` (makeChoice function)

**Problem**: When player makes 2nd choice (completing a round), they should:
1. See current round results
2. IF more rounds exist: automatically make their next choice
3. Then share URL

**Current behavior**: Just completes round and shows "share URL" without chaining to next round

**Expected**:
```typescript
// When P2 makes 2nd choice in Round 1:
if (newState.player1Choice && newState.player2Choice) {
  // 1. Calculate and show Round 1 results
  const payoff = calculatePayoff(...);

  // 2. Determine if there's a next round
  const hasNextRound = newState.currentRound < config.progression.totalRounds;

  // 3. If yes, advance round and let P2 make Round 2 choice immediately
  if (hasNextRound) {
    newState.currentRound += 1;
    newState.roundState = 'choosing_next_in_chain';
    // P2 will see results + choice UI for Round 2
  } else {
    // Final round - just show results
    newState.roundState = 'game_complete';
  }
}
```

### Issue #2: Missing State Tracking

**Problem**: Need to track multiple states:
- Waiting for 1st choice
- Waiting for 2nd choice
- Showing results + next choice (the "chain")
- Game complete

**Need**: State machine to track progression:
```typescript
interface GameState {
  // ... existing fields
  roundState: 'waiting_first' | 'waiting_second' | 'show_results_and_next' | 'complete';
  lastCompletedRound?: number;  // Which round results are currently shown
  whoWentFirst?: 1 | 2;  // Track who started current round
}
```

### Issue #3: URL State Detection

**Location**: `App.tsx:28-37` (URL loading)

**Problem**: Simple base64 decode doesn't track "freshness" of state

**Current**:
```typescript
const decodedState = JSON.parse(atob(encodedState));
setUrlState(decodedState);
setGameState(decodedState);
```

**Issue**: Can't distinguish between:
- Fresh URL from other player (show results)
- Reloading same URL (don't re-show results)

---

## Implementation Strategy

### Phase 1: Add Round State Tracking

**Goal**: Track progression through game flow including result chaining

**State Machine**:
```
WAITING_FIRST_CHOICE
  ↓ (1st choice made)
WAITING_SECOND_CHOICE
  ↓ (2nd choice made)
SHOW_RESULTS_AND_CHAIN
  ↓ (if more rounds)
WAITING_FIRST_CHOICE (of next round)
  ↓ (if no more rounds)
GAME_COMPLETE
```

**Implementation**:
```typescript
interface GameState {
  gameId: string;
  currentRound: number;
  player1Choice?: string;
  player2Choice?: string;
  player1Total: number;
  player2Total: number;
  rounds: Array<CompletedRound>;

  // NEW: Track game flow state
  flowState: 'waiting_first' | 'waiting_second' | 'results_and_next' | 'complete';
  whoWentFirst: 1 | 2;  // Who started current round (for alternation)
  pendingResultsForRound?: number;  // Which round's results to show
}
```

### Phase 2: Modify makeChoice Logic

**Goal**: Handle both 1st and 2nd choices correctly, with chaining

**Logic**:
```typescript
const makeChoice = useCallback((playerNum: 1 | 2, choiceId: string) => {
  const newState = { ...gameState };

  // Determine if this is 1st or 2nd choice
  const is1stChoice = !newState.player1Choice && !newState.player2Choice;
  const is2ndChoice = (newState.player1Choice && !newState.player2Choice && playerNum === 2) ||
                      (!newState.player1Choice && newState.player2Choice && playerNum === 1);

  if (playerNum === 1) {
    newState.player1Choice = choiceId;
  } else {
    newState.player2Choice = choiceId;
  }

  if (is1stChoice) {
    // First choice of round - just mark waiting for second
    newState.flowState = 'waiting_second';
  } else if (is2ndChoice) {
    // Second choice - round complete!
    const payoff = calculatePayoff(config, newState.player1Choice!, newState.player2Choice!);

    newState.rounds.push({
      player1Choice: newState.player1Choice!,
      player2Choice: newState.player2Choice!,
      player1Score: payoff.player1Score,
      player2Score: payoff.player2Score,
    });

    newState.player1Total += payoff.player1Score;
    newState.player2Total += payoff.player2Score;

    // Check if there are more rounds
    const hasNextRound = newState.currentRound < config.progression.totalRounds;

    if (hasNextRound) {
      // Mark as "show results + get next choice"
      newState.flowState = 'results_and_next';
      newState.pendingResultsForRound = newState.currentRound;
      // Will advance round in render logic after showing results
    } else {
      // Game complete
      newState.flowState = 'complete';
    }
  }

  setGameState(newState);
  setUrlState(null);
}, [gameState, config]);
```

### Phase 3: Add "Make Next Choice" Handler

**Goal**: After seeing results, player makes next choice in chain

**New Function**:
```typescript
const makeNextChoiceAfterResults = useCallback((choiceId: string) => {
  if (!gameState) return;

  const newState = { ...gameState };

  // Clear previous round's choices
  newState.player1Choice = undefined;
  newState.player2Choice = undefined;

  // Advance to next round
  newState.currentRound += 1;
  newState.flowState = 'waiting_first';

  // Determine who goes first next round (alternates)
  const nextStarter = determineRoundStarter(config, newState.currentRound);
  newState.whoWentFirst = nextStarter;

  // Now make the choice for this next round
  if (nextStarter === 1) {
    newState.player1Choice = choiceId;
  } else {
    newState.player2Choice = choiceId;
  }
  newState.flowState = 'waiting_second';

  setGameState(newState);
  setUrlState(null);
}, [gameState, config]);
```

### Phase 4: Update Render Logic

**Goal**: Show appropriate UI based on flowState

**Flow Decision Tree**:
```typescript
// 1. Game complete?
if (gameState.flowState === 'complete') {
  return <GameOverScreen />;
}

// 2. CRITICAL: Player who made 2nd choice sees results + next choice
if (gameState.flowState === 'results_and_next') {
  const isViewingFromUrl = urlState !== null;
  const lastRound = gameState.rounds[gameState.rounds.length - 1];

  if (!isViewingFromUrl) {
    // Player who just completed round sees:
    // 1. Current round results
    // 2. Choice UI for NEXT round
    return (
      <>
        <RoundResults round={lastRound} />
        <h3>Round {gameState.currentRound + 1}</h3>
        <DynamicChoiceBoard
          onChoiceSelected={makeNextChoiceAfterResults}
          playerNumber={whoGoesFirstNextRound}
        />
      </>
    );
  } else {
    // Other player viewing - should not see this state
    // They see waiting_first state
    return <LoadingOrError />;
  }
}

// 3. Waiting for first choice of round
if (gameState.flowState === 'waiting_first') {
  const isViewingFromUrl = urlState !== null;

  if (isViewingFromUrl) {
    // Player opening URL to make first choice
    // May need to show previous round results first
    const previousRound = gameState.rounds[gameState.rounds.length - 1];
    return (
      <>
        {previousRound && <RoundResults round={previousRound} />}
        <DynamicChoiceBoard
          onChoiceSelected={(choice) => makeChoice(gameState.whoWentFirst, choice)}
          playerNumber={gameState.whoWentFirst}
        />
      </>
    );
  } else {
    // Player who just made their next choice, waiting to share URL
    return <ShareURLButton />;
  }
}

// 4. Waiting for second choice of round
if (gameState.flowState === 'waiting_second') {
  const isViewingFromUrl = urlState !== null;

  if (isViewingFromUrl) {
    // Player opening URL to make 2nd choice
    const otherPlayer = gameState.whoWentFirst === 1 ? 2 : 1;
    return (
      <DynamicChoiceBoard
        onChoiceSelected={(choice) => makeChoice(otherPlayer, choice)}
        playerNumber={otherPlayer}
      />
    );
  } else {
    // Player who made 1st choice, waiting to share
    return <ShareURLButton />;
  }
}
```

---

## Detailed Task Breakdown

### TASK 1: Add Round State Fields

**File**: `src/App.tsx:15-30`

**ACTION**: UPDATE GameState interface
```typescript
interface GameState {
  gameId: string;
  currentRound: number;
  player1Choice?: string;
  player2Choice?: string;
  player1Total: number;
  player2Total: number;
  rounds: Array<{
    player1Choice: string;
    player2Choice: string;
    player1Score: number;
    player2Score: number;
  }>;
  // ADD:
  roundState: 'choosing' | 'results_pending';
  lastActorPlayer?: 1 | 2;
}
```

**VALIDATE**:
```bash
npm run type-check
# Should pass without errors
```

**ROLLBACK**:
```bash
git checkout src/App.tsx
```

---

### TASK 2: Initialize New State Fields

**File**: `src/App.tsx:40-50` (startNewGame function)

**ACTION**: ADD new fields to initial state
```typescript
const newGame: GameState = {
  gameId: createGameId(),
  currentRound: 1,
  player1Total: 0,
  player2Total: 0,
  rounds: [],
  // ADD:
  roundState: 'choosing',
  lastActorPlayer: undefined,
};
```

**VALIDATE**:
```bash
npm run build
# Check: No TypeScript errors
```

---

### TASK 3: Fix makeChoice Logic

**File**: `src/App.tsx:60-95`

**ACTION**: REPLACE round auto-advance logic
```typescript
const makeChoice = useCallback((playerNum: 1 | 2, choiceId: string) => {
  if (!gameState || !config) return;

  const newState = { ...gameState };

  // Set choice
  if (playerNum === 1) {
    newState.player1Choice = choiceId;
  } else {
    newState.player2Choice = choiceId;
  }

  // Track last actor
  newState.lastActorPlayer = playerNum;

  // Check if round is complete
  if (newState.player1Choice && newState.player2Choice) {
    const payoff = calculatePayoff(config, newState.player1Choice, newState.player2Choice);

    // Add to rounds history
    newState.rounds.push({
      player1Choice: newState.player1Choice,
      player2Choice: newState.player2Choice,
      player1Score: payoff.player1Score,
      player2Score: payoff.player2Score,
    });

    // Update totals
    newState.player1Total += payoff.player1Score;
    newState.player2Total += payoff.player2Score;

    // CHANGED: Set state to results_pending instead of advancing
    newState.roundState = 'results_pending';

    // REMOVED: Don't increment round or clear choices here
  }

  setGameState(newState);
  setUrlState(null);
}, [gameState, config]);
```

**VALIDATE**:
```bash
npm run type-check
npm run build
# Manual test: Make choice, verify state shows results_pending
```

**IF_FAIL**:
- Check console for errors
- Verify calculatePayoff import
- Check config object exists

---

### TASK 4: Add Advance Round Function

**File**: `src/App.tsx` (after makeChoice)

**ACTION**: CREATE new function
```typescript
const advanceToNextRound = useCallback(() => {
  if (!gameState || !config) return;

  const newState = { ...gameState };

  // Clear choices
  newState.player1Choice = undefined;
  newState.player2Choice = undefined;

  // Advance to next round
  newState.currentRound += 1;
  newState.roundState = 'choosing';

  setGameState(newState);
  setUrlState(null);
}, [gameState, config]);
```

**VALIDATE**:
```bash
npm run type-check
```

---

### TASK 5: Update Render Logic - Results View

**File**: `src/App.tsx:210-316`

**ACTION**: ADD results_pending state handler BEFORE round-in-progress section

**INSERT** after game-complete check (around line 208):
```typescript
// Handle results pending (round just completed)
if (gameState.roundState === 'results_pending') {
  const isViewingFromUrl = urlState !== null;
  const hasMoreRounds = gameState.currentRound < config.progression.totalRounds;

  // Get the last completed round
  const lastRound = gameState.rounds[gameState.rounds.length - 1];

  if (isViewingFromUrl) {
    // Player receiving URL sees results and makes next choice
    return (
      <div style={styles.container}>
        <div style={styles.gameBox}>
          <h1 style={styles.title}>{config.metadata.name}</h1>
          <p style={styles.roundInfo}>Round {gameState.currentRound} Complete</p>

          <div style={styles.totals}>
            <div>
              <span>Player 1: </span>
              <span style={styles.totalValue}>{gameState.player1Total}</span>
            </div>
            <div>
              <span>Player 2: </span>
              <span style={styles.totalValue}>{gameState.player2Total}</span>
            </div>
          </div>

          <div style={styles.history}>
            <h3>Round {gameState.currentRound} Results</h3>
            {lastRound && (
              <PayoffSummary
                config={config}
                player1Choice={lastRound.player1Choice}
                player2Choice={lastRound.player2Choice}
              />
            )}
          </div>

          {hasMoreRounds ? (
            <>
              <h2 style={styles.choiceTitle}>Round {gameState.currentRound + 1}</h2>
              <DynamicChoiceBoard
                config={config}
                onChoiceSelected={(choice) => {
                  advanceToNextRound();
                  setTimeout(() => {
                    const starter = determineRoundStarter(config, gameState.currentRound + 1);
                    makeChoice(starter === 1 ? 1 : 2, choice);
                  }, 0);
                }}
                playerNumber={determineRoundStarter(config, gameState.currentRound + 1)}
              />
            </>
          ) : (
            <button onClick={copyUrlToClipboard} style={styles.button}>
              Copy Final Results URL
            </button>
          )}
        </div>
      </div>
    );
  } else {
    // Player who just made last choice sees waiting state
    return (
      <div style={styles.container}>
        <div style={styles.gameBox}>
          <h1 style={styles.title}>{config.metadata.name}</h1>

          <div style={styles.waiting}>
            <h2>Round {gameState.currentRound} Complete!</h2>
            <p>Send this URL to see results and continue:</p>
            <button onClick={copyUrlToClipboard} style={styles.button}>
              Copy URL
            </button>
          </div>
        </div>
      </div>
    );
  }
}
```

**VALIDATE**:
```bash
npm run build
# Manual test: Complete round, verify results show correctly
```

**IF_FAIL**:
- Check advanceToNextRound function exists
- Verify PayoffSummary component import
- Check styles objects exist

---

### TASK 6: Clean Up Old Round Complete Logic

**File**: `src/App.tsx:301-313`

**ACTION**: DELETE old roundComplete check
```typescript
// REMOVE THIS ENTIRE BLOCK:
{roundComplete && (
  <div style={styles.waiting}>
    <h2>Round Complete!</h2>
    <PayoffSummary
      config={config}
      player1Choice={gameState.player1Choice!}
      player2Choice={gameState.player2Choice!}
    />
    <button onClick={copyUrlToClipboard} style={styles.button}>
      Copy URL to Continue
    </button>
  </div>
)}
```

**VALIDATE**:
```bash
npm run build
# Check: No undefined variable errors
```

---

### TASK 7: Update URL State Initialization

**File**: `src/App.tsx:28-37`

**ACTION**: PRESERVE roundState when loading from URL
```typescript
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const encodedState = urlParams.get('s');

  if (encodedState && config) {
    try {
      const decodedState = JSON.parse(atob(encodedState)) as GameState;

      // Ensure roundState exists (backward compatibility)
      if (!decodedState.roundState) {
        decodedState.roundState = 'choosing';
      }

      setUrlState(decodedState);
      setGameState(decodedState);
    } catch (err) {
      console.error('Failed to load game from URL:', err);
    }
  }
}, [config]);
```

**VALIDATE**:
```bash
npm run build
# Manual test: Load game from URL, verify state loads correctly
```

---

## Testing Strategy

### Manual Test Plan

**Test 1: Complete 3-Round Game (Correct Flow)**
```
Round 1 (P1 starts):
1. Start new game
2. P1 chooses Rock → sees "Copy URL for P2"
3. P2 opens URL → chooses Paper
   EXPECT: Sees "Round 1 Results: P2 wins!"
   EXPECT: Immediately sees choice UI for Round 2
4. P2 chooses Scissors for Round 2 → sees "Copy URL for P1"

Round 2 (P2 started above):
5. P1 opens URL → sees "Round 1 Results: P2 wins!"
6. P1 chooses Rock for Round 2
   EXPECT: Sees "Round 2 Results: P1 wins!"
   EXPECT: Immediately sees choice UI for Round 3
7. P1 chooses Paper for Round 3 → sees "Copy URL for P2"

Round 3 (P1 started above):
8. P2 opens URL → sees "Round 2 Results: P1 wins!"
9. P2 chooses Rock for Round 3
   EXPECT: Sees "Round 3 Results: P1 wins!"
   EXPECT: Sees "Copy Final URL for P1" (no more rounds)

Game Over:
10. P1 opens URL → sees all 3 rounds → Winner: P1 (P1:2, P2:1)
```

**Verify**:
- Only 6 URL exchanges for 3 rounds (not 9+)
- Each player sees results immediately after completing a round
- Player who completes round makes next choice before sharing
- Alternation works correctly (P1, P2, P1)

**Test 2: URL Sharing**
```
1. Complete Round 1
2. Copy URL multiple times
3. Paste in different browsers
   EXPECT: Same state loads correctly
   EXPECT: Can only advance once
```

**Test 3: Edge Cases**
```
1. Refresh browser mid-round
   EXPECT: State preserved via URL
2. Go back in browser history
   EXPECT: Previous game states visible
3. Try to make choice when not your turn
   EXPECT: UI prevents invalid actions
```

### Automated Validation

```bash
# Level 1: Types
npm run type-check

# Level 2: Build
npm run build

# Level 3: Manual smoke test
npm run dev
# Play through 1 complete game
```

---

## Rollback Strategy

### If Major Issues Found

```bash
# 1. Stash changes
git stash

# 2. Return to working state
git checkout HEAD~1 src/App.tsx

# 3. Review what went wrong
git diff stash@{0}

# 4. Re-apply incrementally
git checkout stash@{0} -- src/App.tsx
# Fix issues one at a time
```

### Per-Task Rollback

Each task has specific rollback in task description. General pattern:
```bash
git diff src/App.tsx  # Review changes
git checkout src/App.tsx  # Revert specific file
```

---

## Known Gotchas

### 1. State Synchronization

**Issue**: Setting state multiple times in quick succession

**Fix**: Use functional state updates
```typescript
// WRONG:
setGameState(newState);
setGameState({ ...newState, foo: 'bar' });

// RIGHT:
setGameState(prev => ({ ...prev, foo: 'bar' }));
```

### 2. URL Encoding Size

**Issue**: Adding fields increases URL size

**Monitor**:
```typescript
const url = window.location.href;
if (url.length > 1800) {
  console.warn('URL approaching limit:', url.length);
}
```

### 3. React State Timing

**Issue**: State updates aren't immediate

**Pattern**:
```typescript
// Use useEffect to react to state changes
useEffect(() => {
  if (gameState?.roundState === 'results_pending') {
    // Do something after state updates
  }
}, [gameState?.roundState]);
```

---

## Success Criteria

### Functional Requirements

- [ ] P1 makes choice → sees "Copy URL for P2"
- [ ] P2 opens URL → makes choice → sees "Round Complete, Copy URL"
- [ ] P1 opens URL → sees results → makes next choice
- [ ] Alternation continues until final round
- [ ] Final round shows "Copy Final Results URL"
- [ ] Game over screen shows all rounds and winner

### Technical Requirements

- [ ] TypeScript compilation passes
- [ ] Build succeeds
- [ ] No console errors during gameplay
- [ ] URL length stays under 1800 characters
- [ ] State persists across page reloads (via URL)

### User Experience

- [ ] Clear indication of whose turn it is
- [ ] Results shown before next choice
- [ ] Running totals visible
- [ ] History of all rounds available
- [ ] Copy URL button always works

---

## Estimated Effort

- **Task 1-2**: 15 minutes (type definitions)
- **Task 3-4**: 30 minutes (logic updates)
- **Task 5**: 45 minutes (render logic)
- **Task 6-7**: 15 minutes (cleanup)
- **Testing**: 30 minutes (manual validation)

**Total**: ~2 hours

---

## Dependencies

### Required Files
- `src/framework/core/engine/payoffEngine.ts` ✅ (exists)
- `src/framework/core/engine/turnEngine.ts` ✅ (exists)
- `src/framework/components/DynamicChoiceBoard.tsx` ✅ (exists)
- `src/framework/components/DynamicPayoffMatrix.tsx` ✅ (exists)

### External Dependencies
- No new npm packages needed
- React hooks already available
- All framework utilities in place

---

## Notes

### Design Decisions

**Why add roundState instead of calculating from choices?**
- Explicit state machine is clearer
- Prevents race conditions
- Easier to extend (add more states later)

**Why not use React Router for state?**
- URL params already used for game state
- Simpler to keep single source of truth
- Avoids routing complexity

**Why manual advance instead of automatic?**
- Gives player time to see results
- Prevents accidental skipping
- Better UX for slow connections

### Future Enhancements

**Post-MVP improvements**:
- [ ] Add "Next Round" button with countdown
- [ ] Animate score changes
- [ ] Show move history in sidebar
- [ ] Add sound effects
- [ ] Implement rematch functionality
- [ ] Add player names

---

## Execution Checklist

**Before starting**:
- [ ] Review current App.tsx implementation
- [ ] Ensure dev server runs (`npm run dev`)
- [ ] Create git branch: `git checkout -b fix/rps-game-flow`
- [ ] Review framework documentation

**During execution**:
- [ ] Complete tasks 1-7 in order
- [ ] Run validation after each task
- [ ] Commit after each working checkpoint
- [ ] Test in browser frequently

**After completion**:
- [ ] Run full test plan
- [ ] Check all success criteria
- [ ] Review code for cleanup
- [ ] Update README if needed
- [ ] Commit final changes

---

**Ready to execute? Start with TASK 1.**
