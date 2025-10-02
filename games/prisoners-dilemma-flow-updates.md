# Prisoner's Dilemma - Flow Updates for Rematch & History Feature

## Overview
This document outlines the complete flow for adding rematch functionality and game history storage using localStorage.

## Core Features

### 1. LocalStorage Integration
- **Player Names**: Store player name in localStorage on first play
- **Game History**: Store completed games locally (not in URL to keep under 2000 chars)
- **Backup/Restore**: Allow download and upload of complete game history

### 2. Game History Storage
Each completed game stores:
- Unique `gameId` (new ID for each game/rematch)
- `startTime` (when game was created)
- `endTime` (when game finished)
- Final scores (`p1Gold`, `p2Gold`)
- All 5 rounds with choices and results
- Final message (if any)
- Player names

### 3. History Display
- Collapsible container showing previous games
- Label format: "[Score] - [PlayerName] won/lost" (e.g., "15-12 - Alice won")
- Unlimited storage in localStorage, display all games
- Each game expandable to show round-by-round details
- **Visibility:** Hidden if no games, shown only on landing/results screens when exists
- **Not shown during active gameplay** (rounds in progress)

## Player Name Flow

### First-Time Player (No Name in localStorage)
1. App detects no name in localStorage
2. Prompt: "Enter your name"
3. Show game history (if any exists)
4. Options:
   - "Continue with history" (keep existing games)
   - "Start fresh game" (clear history, add system message)
5. Save name to localStorage
6. Include name in gameState when making choices

### Returning Player (Name in localStorage)
1. Auto-use saved name
2. Verify/update name with each game state update
3. Continue normally

### Name Mismatch / New Player Opens Link
**Detection via localStorage fingerprint:**
- **localStorage exists + different name** = Existing player changed name
- **No localStorage** = New player

**If localStorage exists (name change):**
1. Detect name change
2. Allow name update
3. Create toast notification for other player: "Player name changed: [OldName] is now [NewName]"
4. Include updated name in gameState

**If no localStorage (new player):**
1. Prompt for name
2. Show game history (if any)
3. Options: "Continue" or "Start fresh"
4. If "Start fresh":
   - Clear history
   - Show warning: "This will clear your game history. Download a backup first?"
   - Add toast notification to gameState: "Game history was cleared - [NewName] started a fresh game"

## Rematch Flow

### Player 2 Completes Game
**Current screen shows:**
- Game results (scores, history, winner)
- Player 2's message input
- URL sharing panel
- **Rematch button**

**When Player 2 clicks "Rematch":**
1. Save completed game to localStorage history
2. Create new game with:
   - New `gameId`
   - `previousGameId` linking to completed game
   - `startTime` = now
   - **Player 2 goes first** (role reversal for first choice)
   - Round 1, both choices empty
   - Player names preserved from previous game
3. Show choice interface for Player 2
4. Player 2 makes their choice (Silent/Talk)
5. Show standard "Choice Made! Send this URL to Player 1" screen (reuse existing pattern)
6. URL contains:
   - New game state (Round 1, P2's choice made, waiting for P1)
   - **`previousGameResults` field** with complete previous game (temporary, one-time only)
   - Player 2's message from previous game (if any)
   - Player names

### Player 1 Receives Rematch URL
**One continuous screen showing (in sequence):**

1. **Previous Game Results Section**
   - "Game Over!" heading
   - Final scores
   - Round history
   - Player 2's message (if any): "Player 2 says: [message]"

2. **Rematch Invitation Section** (directly below)
   - "Player 2 wants a rematch!"
   - "Player 2 has made their choice. What will you do?"
   - Choice buttons (Silent/Talk)
   - Current round indicator: "Round 1 of 5"

3. **Game History Panel** (collapsible, available throughout)
   - Shows previous completed games
   - Label: "[Score] - [PlayerName] won/lost"
   - Expandable for round details

**When Player 1 opens the URL:**
1. Detect `previousGameResults` field in gameState
2. Display previous game results section
3. Save previous game to P1's localStorage
4. **Clear `previousGameResults` from gameState** (no longer needed)
5. Display rematch invitation
6. Player 1 makes their choice

**After Player 1 makes their choice:**
1. Round 1 complete
2. `previousGameResults` field NOT included in URL back to P2 (already cleared)
3. Show results and continue to Round 2
4. Normal game flow continues with **Player 2 going first in even rounds** (since P2 started this game)
5. Both players now have game in localStorage history

## Game State Updates

### Current GameState Schema Extensions Needed

```typescript
// Add to GameState schema
interface GameState {
  // ... existing fields ...

  // New fields for rematch/history
  previousGameId?: string;  // Links to previous game in history
  playerNames?: {
    p1: string;
    p2: string;
  };
  toastNotifications?: ToastNotification[];  // System messages for display

  // TEMPORARY FIELD - only for P1's first view of rematch
  previousGameResults?: CompletedGame;  // Embedded previous game, cleared after P1 processes
}

// Toast notification schema
interface ToastNotification {
  id: string;
  type: 'info' | 'warning' | 'success';
  message: string;
  timestamp: string;  // ISO timestamp
}

// LocalStorage structure
interface GameHistory {
  playerName: string;  // Current player's name
  sessionId: string;   // For fingerprinting (detect name changes vs new player)
  games: CompletedGame[];
}

interface CompletedGame {
  gameId: string;
  startTime: string;  // ISO timestamp
  endTime: string;    // ISO timestamp
  playerNames: {
    p1: string;
    p2: string;
  };
  totals: {
    p1Gold: number;
    p2Gold: number;
  };
  rounds: Round[];  // All 5 rounds
  finalMessage?: PlayerMessage;
  winner: 'p1' | 'p2' | 'tie';
}
```

## URL Size Calculations & Validation

**Single game state (current):** ~1744 characters encrypted
**With 1 game history in URL:** ~2757 characters ❌ (exceeds 2000 limit)

**Solution:** Use localStorage instead of embedding history in URL
- URL only contains current game state
- History stored locally
- Keeps URLs under 2000 characters ✅

### URL Size Validation Flow

**Before displaying any URL to user:**
1. Generate complete URL with all data
2. Check: `url.length <= 2000`
3. If **under limit**: Display URL normally ✅
4. If **over limit**: Show warning ⚠️

**Over Limit Warning:**
```
⚠️ URL Character Limit Exceeded

The game data is too large to fit in a shareable URL (2,xxx characters).

We can continue with minimal game data, but some information will be lost:
- Message will be truncated or removed
- Previous game data will be backed up locally only

Options:
[Download Full Backup] [Continue with Minimal Data] [Cancel]
```

**If "Continue with Minimal Data":**
1. Strip data in this order until under 2000 chars:
   - Truncate message to minimum (50 chars)
   - Remove message entirely
   - Remove `previousGameResults` (backup locally instead)
   - Strip player metadata
2. Show what was removed
3. Offer backup download
4. Display minimal URL

### Character Limits

**Player Names:**
- Maximum: 20 characters
- Validation: Alphanumeric + spaces only
- Enforced at input with character counter

**Messages:**
- **Base limit:** 500 characters (existing)
- **Dynamic limit when rematch exists:**
  - Calculate: `availableChars = 2000 - currentGameStateSize - previousGameResultsSize - 200 (safety buffer)`
  - Display: "Message limit: [X] characters (adjusted for rematch data)"
  - Real-time validation as user types
  - Show warning if approaching limit

**Message Character Counter:**
```
Message for Player 1:
[Textarea]
Characters: 145 / 350 (limit reduced to fit rematch data)
```

### Size Estimation Formula

```typescript
const estimateURLSize = (gameState: GameState): number => {
  const json = JSON.stringify(gameState);
  const encrypted = base64Encode(json); // ~33% overhead
  const fullURL = `${baseURL}?s=${encrypted}`;
  return fullURL.length;
};

const getMaxMessageLength = (
  currentGameState: GameState,
  hasPreviousGame: boolean
): number => {
  const baseSize = estimateURLSize(currentGameState);
  const previousGameSize = hasPreviousGame ? 800 : 0; // Estimated
  const safetyBuffer = 200;

  const available = 2000 - baseSize - previousGameSize - safetyBuffer;
  const maxMessage = Math.min(500, Math.max(50, available));

  return maxMessage;
};
```

### Backup When Data Stripped

**If any data removed due to size:**
1. Create comprehensive backup JSON:
   ```json
   {
     "timestamp": "2025-10-01T12:00:00Z",
     "reason": "URL size limit exceeded",
     "strippedData": {
       "originalMessage": "Full message text that was too long...",
       "previousGameResults": { /* complete game data */ }
     },
     "gameState": { /* minimal game state that fit in URL */ }
   }
   ```
2. Auto-download as `game-backup-[timestamp].json`
3. Toast: "Full game data backed up to downloads"

## UI Components Needed

### New Components
1. **PlayerNamePrompt** - Get player name on first play (max 20 chars, with counter)
2. **GameHistoryPanel** - Collapsible panel showing previous games
3. **CompletedGameCard** - Individual game in history (expandable)
4. **HamburgerMenu** - Settings menu with:
   - Download backup
   - Upload/restore backup
   - Edit name (with mid-game warning)
5. **ToastNotification** - Dismissible toast for system messages
6. **PreviousGameResults** - Display embedded previous game in rematch flow
7. **URLSizeWarning** - Modal warning when URL exceeds 2000 chars with options
8. **CharacterCounter** - Show character count for names/messages with dynamic limits

### Modified Components
1. **GameResults** - Add rematch button, show previous game section when rematch
2. **App** - Integrate localStorage, name verification, history display, toast notifications, URL size validation
3. **URLSharer** - Add URL size validation before display, show warning if needed
4. **Message textarea** - Add dynamic character counter based on available URL space

### New Hooks/Services
1. **useLocalStorage** - Hook for localStorage operations
2. **useGameHistory** - Hook for game history management
3. **useToast** - Hook for toast notification management
4. **useURLSizeValidation** - Hook for URL size checking and fallback handling
5. **urlSizeUtils** - Utility functions:
   - `estimateURLSize(gameState): number`
   - `getMaxMessageLength(gameState, hasPreviousGame): number`
   - `stripDataToFitURL(gameState): {stripped: GameState, removed: StrippedData}`
   - `validatePlayerName(name): boolean`

## Edge Cases & Considerations

### 1. First Game Ever
- No history to show
- Just get name and start playing

### 2. Rematch Chain
- Game 1 → Rematch (Game 2) → Rematch (Game 3) → etc.
- Each game links to previous via `previousGameId`
- All stored in localStorage history

### 3. URL Shared to Different Device
- No localStorage on new device
- Prompts for name
- Option to start fresh or continue
- History not available (device-specific)

### 4. LocalStorage Cleared
- Player name gone
- Game history gone
- Re-prompt for name
- Start fresh

### 5. Browser Compatibility
- localStorage available in all modern browsers
- Fallback: Continue without history if localStorage unavailable

## Implementation Order

### Phase 1: LocalStorage Foundation
1. Create localStorage service/hook
2. Player name prompt and storage
3. Name verification on game state updates

### Phase 2: History Storage
1. Save completed games to localStorage
2. Retrieve and display history
3. Backup/restore functionality

### Phase 3: Rematch Flow
1. Rematch button on game results
2. Create new game with P2 going first
3. Show previous game + rematch invitation to P1

### Phase 4: UI Polish
1. Collapsible history panel
2. Expandable game cards
3. System messages for fresh starts
4. Styling and animations

## All Design Decisions - FINAL

### Question 9: P2 Rematch Screen
**DECISION:** Option A - Standard "Choice Made! Send this URL to Player 1" screen (reuse existing)
- Previous game results and P2's message included in game state

### Question 10: Previous Game in URL
**DECISION:** Embed in URL for one round only
- P1 sees previous results even on new device
- After P1 processes: save to localStorage, clear from gameState
- Keeps URL sharing nature while minimizing size

### Question 11: Keep Embedded Data for P2?
**DECISION:** Option B - Remove immediately after P1 processes it
- P2 already has history in localStorage (they initiated rematch)
- No need to send it back

### Question 12: History Panel Visibility
**DECISION:** Option C + B
- Hidden entirely if no games completed yet
- When history exists: shown only on landing page and results screen (not during gameplay)

### Question 13: Backup Controls Location
**DECISION:** Hamburger menu
- Always accessible
- Contains: Download backup, Upload/restore backup, Edit name

### Question 14: Fresh Start Warning
**DECISION:** Option C + A
- Show warning: "This will clear your game history. Download a backup first?"
- Backup controls always accessible (even with empty history, other data like player name exists)

### Question 15: Name Editing
**DECISION:** Option C - Editable anytime via hamburger menu
- Warning if mid-game: "Changing your name will start a fresh game"

### Question 16: Name Changes in URL
**DECISION:** Option B - Show notification
- "Player name changed: [OldName] is now [NewName]"
- Updated name included in gameState for other player to see

### Question 17: Distinguish Name Change vs New Player
**DECISION:** Option A - Player fingerprint via localStorage
- **localStorage exists + different name** = Name change → "Player name changed: [OldName] is now [NewName]"
- **No localStorage or fresh start** = New player → "Game history was cleared - [NewName] started a fresh game"

### Question 18: System Message Display
**DECISION:** Option D - Toast/popup notifications
- Dismissible
- Non-intrusive
- Clear visibility

## Test Strategy

### Unit Tests
- localStorage service (save, retrieve, clear)
- Game history sorting/filtering
- Backup/restore serialization
- Name change detection (localStorage fingerprint)
- Toast notification creation/dismissal

### Integration Tests
- Name prompt flow (first time, returning, mismatch)
- Rematch creation (P2 initiates, includes previous game)
- History display with multiple games
- Name mismatch handling (change vs new player)
- Previous game embedding and clearing
- Fresh start with backup warning

### E2E Tests
- Complete game → rematch → complete rematch
- Fresh start with history
- Backup/restore cycle
- Name change mid-session
- Multiple rematches (chain of 3+ games)

## Summary of Complete Flow

### New Player First Game
1. Land on page → Prompt for name → Save to localStorage
2. Play game normally
3. On completion → Save to localStorage history
4. See rematch button + message input + URL sharing

### Returning Player
1. Land on page → Auto-fill name from localStorage
2. See game history panel (if games exist)
3. Play game normally
4. History updates after each completion

### Rematch Flow (Player 2 → Player 1)
**Player 2:**
1. Completes game → Saves to localStorage
2. Clicks "Rematch" → Creates new game (P2 goes first)
3. Makes Round 1 choice
4. URL includes: new game + `previousGameResults` (temporary)

**Player 1:**
1. Opens URL → Sees previous game results + P2's message
2. Sees "Player 2 wants a rematch!"
3. Previous game saved to localStorage
4. `previousGameResults` cleared from gameState
5. Makes Round 1 choice → Game continues normally

### Name Changes
**Existing player changes name:**
- localStorage exists → Update name
- Toast: "Player name changed: [Old] is now [New]"

**New player on device:**
- No localStorage → Prompt for name
- Options: Continue or Start fresh
- If fresh: Warning + backup option
- Toast: "Game history cleared - [Name] started fresh"

### History Management
- Unlimited storage in localStorage
- Visible on landing/results screens only
- Collapsible panel with expandable games
- Hamburger menu: Backup, Restore, Edit name
