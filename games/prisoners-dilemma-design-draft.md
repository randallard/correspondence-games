# Prisoner's Dilemma Game - Design Document

## Executive Summary

A web-based implementation of the classic Prisoner's Dilemma game theory experiment, designed for asynchronous play between two players over 5 rounds. Players share encrypted game state via URLs, allowing play across any communication platform without servers.

---

## Game Premise & Story

### The Setup
Two prisoners are caught by the guards. Each is separated and offered a deal: give information about your partner in exchange for gold. But there's a catch - the reward depends on what your partner chooses too.

### The Question
**Will your partner stay silent through all 5 rounds?**

Can you trust them? Can they trust you? In the shadows of the dungeon, loyalty and self-interest collide. Each round, you must decide: protect your partner or protect yourself?

### The Payoff Structure

| Your Choice | Partner's Choice | Your Gold | Partner's Gold |
|-------------|------------------|-----------|----------------|
| Stay Silent | Stay Silent      | 3 gold    | 3 gold         |
| Stay Silent | Talk             | 0 gold    | 5 gold         |
| Talk        | Stay Silent      | 5 gold    | 0 gold         |
| Talk        | Talk             | 1 gold    | 1 gold         |

**Goal:** Accumulate the most gold over 5 rounds.

---

## User Stories

### Story 1: Starting a New Game
**As a player**, I want to start a new game so that I can challenge a friend.

**Acceptance Criteria:**
- I see the game premise and payoff matrix
- I make my first choice (silent/talk) without seeing opponent's choice
- I receive a shareable URL to send to my opponent
- The URL contains encrypted game state

### Story 2: Responding to a Game
**As an opponent**, I want to respond to a game invitation so I can participate.

**Acceptance Criteria:**
- I click a URL and see the same premise/rules
- I make my choice without seeing what Player 1 chose
- I immediately see Round 1 results after choosing
- I'm prompted to make my Round 2 choice
- I get a new URL to send back to Player 1

### Story 3: Continuing Mid-Game
**As a player**, I want to see game history when it's my turn.

**Acceptance Criteria:**
- I see results of all completed rounds
- I see current gold totals for both players
- I see the payoff matrix as reference
- I make my next choice
- If both players have chosen for current round, I see results immediately

### Story 4: Finishing the Game
**As a player**, I want to complete the 5-round game and see final results.

**Acceptance Criteria:**
- After Round 5, I see final gold totals
- I see complete game history
- I can add a comment/message to my opponent
- I can offer a rematch (becoming Player 1 in new game)
- My opponent sees my comment and the rematch offer

### Story 5: Understanding the Game
**As a new player**, I want to understand the game mechanics quickly.

**Acceptance Criteria:**
- Clear visual payoff matrix always visible
- Simple "Silent" vs "Talk" choice interface
- Real-time gold counter
- Clear indication of whose turn it is
- History of previous rounds displayed clearly

---

## Technical Architecture

### Technology Stack
- **Frontend Framework:** React 18 + TypeScript + Vite
- **Encryption:** Crypto-JS (AES encryption)
- **Compression:** LZ-String
- **Styling:** Tailwind CSS (via CDN or included)
- **Hosting:** GitHub Pages
- **Deployment:** GitHub Actions

### State Management Pattern
This game uses **asynchronous simultaneous choice** pattern:
- Player 1 chooses → state saved, waits for Player 2
- Player 2 chooses → both choices revealed, results calculated
- Next round begins with roles continuing alternately

### Game State Schema

```typescript
interface GameState {
  version: string;                    // "1.0.0"
  gameId: string;                     // Unique game identifier
  players: {
    p1: string;                       // Player 1 identifier
    p2: string;                       // Player 2 identifier
  };
  rounds: Round[];                    // Array of 5 rounds
  currentRound: number;               // 0-4 (current round index)
  waitingFor: 'p1' | 'p2';           // Who needs to make next choice
  totals: {
    p1Gold: number;                   // Player 1 cumulative gold
    p2Gold: number;                   // Player 2 cumulative gold
  };
  gameStatus: 'setup' | 'playing' | 'finished';
  finalMessage?: {
    from: 'p1' | 'p2';
    text: string;
  };
  rematchGameId?: string;             // If rematch was offered
}

interface Round {
  roundNumber: number;                // 1-5
  p1Choice?: 'silent' | 'talk';      // undefined = not chosen yet
  p2Choice?: 'silent' | 'talk';      // undefined = not chosen yet
  p1Gold?: number;                    // Gold earned this round
  p2Gold?: number;                    // Gold earned this round
  isComplete: boolean;                // Both players have chosen
}
```

### Payoff Calculation Logic

```typescript
function calculatePayoff(p1Choice: Choice, p2Choice: Choice): {
  p1Gold: number;
  p2Gold: number;
} {
  if (p1Choice === 'silent' && p2Choice === 'silent') {
    return { p1Gold: 3, p2Gold: 3 };
  }
  if (p1Choice === 'silent' && p2Choice === 'talk') {
    return { p1Gold: 0, p2Gold: 5 };
  }
  if (p1Choice === 'talk' && p2Choice === 'silent') {
    return { p1Gold: 5, p2Gold: 0 };
  }
  // Both talk
  return { p1Gold: 1, p2Gold: 1 };
}
```

---

## Game Flow Diagrams

### High-Level Flow

```
┌─────────────────────────────────────────────────────────┐
│ PLAYER 1'S BROWSER                                      │
├─────────────────────────────────────────────────────────┤
│ [Landing Page]                                          │
│    ↓                                                    │
│ [Sees Story + Payoff Matrix]                           │
│    ↓                                                    │
│ Makes Round 1 Choice (Silent/Talk)                     │
│    ↓                                                    │
│ [URL Generated] → Copies and sends to Player 2         │
└─────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ PLAYER 2'S BROWSER                                      │
├─────────────────────────────────────────────────────────┤
│ Clicks URL from Player 1                               │
│    ↓                                                    │
│ [Sees Story + Payoff Matrix]                           │
│    ↓                                                    │
│ Makes Round 1 Choice (Silent/Talk)                     │
│    ↓                                                    │
│ 🎉 [ROUND 1 RESULTS REVEALED]                          │
│    • Shows: What P1 chose, What P2 chose              │
│    • Shows: P1 gold earned, P2 gold earned            │
│    • Shows: Running totals                             │
│    ↓                                                    │
│ Makes Round 2 Choice (Silent/Talk)                     │
│    ↓                                                    │
│ [URL Generated] → Copies and sends to Player 1         │
└─────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ PLAYER 1'S BROWSER                                      │
├─────────────────────────────────────────────────────────┤
│ Clicks URL from Player 2                               │
│    ↓                                                    │
│ [SEES ROUND 1 RESULTS]                                 │
│    • What each player chose                            │
│    • Gold earned by each                               │
│    ↓                                                    │
│ Makes Round 2 Choice (Silent/Talk)                     │
│    ↓                                                    │
│ 🎉 [ROUND 2 RESULTS REVEALED]                          │
│    • Shows: What P1 chose, What P2 chose              │
│    • Shows: P1 gold earned, P2 gold earned            │
│    • Shows: Running totals (Rounds 1+2)                │
│    ↓                                                    │
│ Makes Round 3 Choice (Silent/Talk)                     │
│    ↓                                                    │
│ [URL Generated] → Copies and sends to Player 2         │
└─────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ PLAYER 2'S BROWSER                                      │
├─────────────────────────────────────────────────────────┤
│ Clicks URL from Player 1                               │
│    ↓                                                    │
│ [SEES ROUNDS 1-2 RESULTS]                              │
│    • Complete history of both rounds                   │
│    • Running totals                                    │
│    ↓                                                    │
│ Makes Round 3 Choice (Silent/Talk)                     │
│    ↓                                                    │
│ 🎉 [ROUND 3 RESULTS REVEALED]                          │
│    ↓                                                    │
│ Makes Round 4 Choice (Silent/Talk)                     │
│    ↓                                                    │
│ [URL Generated] → Copies and sends to Player 1         │
└─────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ PLAYER 1'S BROWSER                                      │
├─────────────────────────────────────────────────────────┤
│ Clicks URL from Player 2                               │
│    ↓                                                    │
│ [SEES ROUNDS 1-3 RESULTS]                              │
│    ↓                                                    │
│ Makes Round 4 Choice (Silent/Talk)                     │
│    ↓                                                    │
│ 🎉 [ROUND 4 RESULTS REVEALED]                          │
│    ↓                                                    │
│ Makes Round 5 Choice (Silent/Talk)                     │
│    ↓                                                    │
│ [URL Generated] → Copies and sends to Player 2         │
└─────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ PLAYER 2'S BROWSER                                      │
├─────────────────────────────────────────────────────────┤
│ Clicks URL from Player 1                               │
│    ↓                                                    │
│ [SEES ROUNDS 1-4 RESULTS]                              │
│    ↓                                                    │
│ Makes Round 5 Choice (Silent/Talk)                     │
│    ↓                                                    │
│ 🎉 [ROUND 5 RESULTS REVEALED - GAME COMPLETE!]         │
│    • Complete game history (all 5 rounds)              │
│    • Final gold totals                                 │
│    • Winner declared                                   │
│    ↓                                                    │
│ [Optional: Add message for Player 1]                   │
│    ↓                                                    │
│ [Optional: Offer Rematch]                              │
│    • "Want to play again?"                             │
│    • "Start Rematch" button                            │
│    ↓                                                    │
│ IF REMATCH: Makes NEW GAME Round 1 Choice              │
│    • Player 2 becomes Player 1 in new game             │
│    • Player 1 becomes Player 2 in new game             │
│    ↓                                                    │
│ [URL Generated] → Copies and sends to Player 1         │
└─────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ PLAYER 1'S BROWSER (receiving rematch)                 │
├─────────────────────────────────────────────────────────┤
│ Clicks URL from Player 2                               │
│    ↓                                                    │
│ [SEES COMPLETE PREVIOUS GAME RESULTS]                  │
│    • All 5 rounds from finished game                   │
│    • Final totals from finished game                   │
│    • Player 2's message                                │
│    ↓                                                    │
│ [Sees "Player 2 wants a rematch!"]                     │
│    • Shows: "They've made their first choice"          │
│    • Shows: Link to previous game history              │
│    ↓                                                    │
│ [NEW GAME - Round 1 Choice]                            │
│    • Now Player 1 is Player 2 in rematch               │
│    • Now Player 2 is Player 1 in rematch               │
│    ↓                                                    │
│ Makes Round 1 Choice (Silent/Talk)                     │
│    ↓                                                    │
│ 🎉 [NEW GAME ROUND 1 RESULTS REVEALED]                 │
│    • Shows what each chose                             │
│    • Fresh gold totals                                 │
│    ↓                                                    │
│ Makes Round 2 Choice (Silent/Talk)                     │
│    ↓                                                    │
│ [URL Generated] → Copies and sends to Player 2         │
│    • New game continues with roles swapped...          │
└─────────────────────────────────────────────────────────┘
```

### Key Flow Principles

**Results Timing:**
- Results are ONLY revealed when BOTH players have made their choice for that round
- The player who makes the SECOND choice for any round immediately sees the results
- The player who made the FIRST choice sees the results when they return for their NEXT turn

**Mid-Game Turn Pattern (Rounds 2-5):**
1. **Player opens URL** → Sees history of all completed rounds
2. **Player makes choice** → Their choice for current round
3. **Results revealed** → Shows outcome of the round they just completed
4. **Player makes next choice** → Immediately prompted for next round
5. **URL generated** → Copy and send to partner

**Example: Player 1's Round 3 Turn**
```
Opens URL
   ↓
"Here's what happened so far..."
[Round 1: P1 Silent (0g), P2 Talk (5g)]
[Round 2: P1 Talk (1g), P2 Talk (1g)]
Current Totals: You: 1g, Partner: 6g
   ↓
"Round 3 - Your Choice?"
[Silent] [Talk] ← Player clicks Talk
   ↓
🎉 "Round 3 Results!"
You: Talk (5g), Partner: Silent (0g)
Updated Totals: You: 6g, Partner: 6g
   ↓
"Round 4 - Your Choice?"
[Silent] [Talk] ← Player makes choice
   ↓
"Send this URL to your partner!"
[Copy URL button]
```

### State Transition Diagram
```
NEW GAME
   ↓
[gameStatus: 'setup', waitingFor: 'p1', currentRound: 0]
   ↓ P1 chooses
[gameStatus: 'playing', waitingFor: 'p2', rounds[0].p1Choice set]
   ↓ P2 chooses
[gameStatus: 'playing', waitingFor: 'p2', rounds[0] complete, currentRound: 0]
   ↓ P2 chooses Round 2
[gameStatus: 'playing', waitingFor: 'p1', rounds[1].p2Choice set]
   ↓ P1 chooses
[gameStatus: 'playing', waitingFor: 'p1', rounds[1] complete, currentRound: 1]
   ↓ ... continues ...
   ↓ Round 5 complete
[gameStatus: 'finished', currentRound: 5]
```

### Decision Flow for Each Turn
```
Player Opens URL
   ↓
Decrypt & Load State
   ↓
┌─────────────────────────────────┐
│ Are there completed rounds?     │
│ YES: Show history & results     │
│ NO: Show intro & rules          │
└─────────────────────────────────┘
   ↓
┌─────────────────────────────────┐
│ Is game finished?               │
│ YES: Show final results         │
│ NO: Continue to choice          │
└─────────────────────────────────┘
   ↓
┌─────────────────────────────────┐
│ Has current round started?      │
│ YES: I'm 2nd chooser this round │
│ NO: I'm 1st chooser this round  │
└─────────────────────────────────┘
   ↓
Player Makes Choice
   ↓
Update State
   ↓
┌─────────────────────────────────┐
│ Have both players chosen?       │
│ YES: Calculate & show results   │
│ NO: Hide results, wait for      │
│     opponent                    │
└─────────────────────────────────┘
   ↓
┌─────────────────────────────────┐
│ Is this Round 5 complete?       │
│ YES: Go to final results screen │
│ NO: Prompt for next round choice│
└─────────────────────────────────┘
   ↓
Generate & Display URL
```

---

## UI Components & Screens

### 1. Landing Screen (New Game)
**Elements:**
- Game title: "The Prisoner's Dilemma"
- Story text (dungeon premise)
- Payoff matrix (visual grid)
- "Start Game" button

### 2. Initial Choice Screen
**Elements:**
- Brief reminder of premise
- Payoff matrix (always visible)
- Two large buttons: "Stay Silent" | "Talk"
- No opponent choice visible
- No results visible

### 3. URL Share Screen
**Elements:**
- "Choice Made!" message
- "Send this URL to your opponent"
- URL display with copy button
- Waiting message: "Waiting for [opponent]..."
- Payoff matrix (reference)

### 4. Results & Next Choice Screen
**Elements:**
- Round history panel (all completed rounds)
- Current totals: "You: X gold | Opponent: Y gold"
- Latest round result highlighted
- Payoff matrix (reference)
- Next choice: "Round [N] - Your Choice:"
- Two buttons: "Stay Silent" | "Talk"

### 5. Final Results Screen
**Elements:**
- "Game Over!" header
- Complete round history
- Final totals with winner indication
- Message input: "Send a message to your opponent"
- "Offer Rematch" button
- Complete game history display

### 6. Rematch Received Screen
**Elements:**
- Final game results from previous game
- Opponent's message displayed
- "Your opponent wants a rematch!"
- "They've already made their first move!"
- "Accept & Start New Game" button
- Note: "You'll be Player 2 in the rematch" (roles swap)

---

## Visual Design Elements

### Payoff Matrix Design
```
┌─────────────────────────────────────────┐
│     IF YOUR PARTNER STAYS SILENT:       │
│  Stay Silent: You get 3 | Partner: 3    │
│  Talk:        You get 5 | Partner: 0    │
├─────────────────────────────────────────┤
│     IF YOUR PARTNER TALKS:              │
│  Stay Silent: You get 0 | Partner: 5    │
│  Talk:        You get 1 | Partner: 1    │
└─────────────────────────────────────────┘
```

### Round History Display
```
┌──────────────────────────────┐
│ Round 1: ✓ Complete          │
│ You: Silent → 0 gold         │
│ Partner: Talk → 5 gold       │
├──────────────────────────────┤
│ Round 2: ✓ Complete          │
│ You: Talk → 1 gold           │
│ Partner: Talk → 1 gold       │
├──────────────────────────────┤
│ Round 3: ⏳ In Progress      │
│ Waiting for partner...       │
└──────────────────────────────┘
```

### Gold Counter
```
╔═══════════════════════════╗
║  YOUR GOLD:    12 💰      ║
║  PARTNER GOLD: 9 💰       ║
╚═══════════════════════════╝
```

---

## Interaction Patterns

### Choice Hiding Pattern
- Player makes choice → choice stored in state
- Opponent sees only: "Make your choice"
- NO indication of what player chose
- Results revealed ONLY after both choose

### Alternating URL Pattern
- Round 1: P1 chooses → P2 chooses & sees results
- Round 2: P2 chooses first (in same URL) → P1 responds
- Round 3: P1 chooses first → P2 responds
- Etc.

### Progressive Disclosure
- First visit: Full story + rules
- Subsequent visits: Brief reminder + history
- Always show: Payoff matrix, current totals

---

## User Experience Considerations

### Trust & Psychology
- **Hidden Choices:** Creates authentic dilemma tension
- **History Visible:** Builds narrative of trust/betrayal
- **Comments:** Allows social dynamics (trash talk, apologies)
- **Rematch:** Enables ongoing relationship dynamics

### Clarity & Understanding
- Payoff matrix always visible (no memorization needed)
- Clear labeling: "You" vs "Partner" (not P1/P2)
- Visual indicators: Completed ✓, Waiting ⏳
- Running totals prevent mental math

### Mobile-First Design
- Large touch targets for Silent/Talk buttons
- URL copy button prominent
- Scrollable history on small screens
- Payoff matrix collapsible but accessible

---

## Edge Cases & Error Handling

### Invalid URLs
- Corrupted state → Show "Invalid game link" message
- Expired encryption → Offer to start new game
- Missing parameters → Redirect to landing page

### Duplicate Turns
- State includes turn tracking
- If player already chose for current round → Show "Waiting..." screen
- No way to change choice once submitted

### Interrupted Games
- No timeout mechanism (games can pause indefinitely)
- Players can resume anytime via URL
- History preserved in encrypted state

### URL Length Management
- 5 rounds × minimal data = ~500 chars encoded
- Well under 2000 char limit
- Use short property names (p1/p2, not player1/player2)

---

## Future Enhancements (Post-MVP)

### Possible Features
- [ ] Tournament mode (track W/L across multiple games)
- [ ] Different payoff structures (variants)
- [ ] Anonymous mode (no player names)
- [ ] Strategy tips between rounds
- [ ] Animated reveal of opponent's choice
- [ ] Sound effects (dungeon ambiance)
- [ ] Game history persistence (optional)
- [ ] Share final results as image

### Analytics (Privacy-Preserving)
- [ ] Track cooperation rates (aggregated)
- [ ] Most common strategies
- [ ] Average gold earned per player type

---

## Development Roadmap

### Phase 1: Core Game Loop
1. Set up Vite + React + TypeScript project
2. Implement encryption/decryption functions
3. Create game state management
4. Build choice interface
5. Implement payoff calculation
6. Test 5-round flow

### Phase 2: UI/UX Polish
1. Design and implement all screens
2. Add payoff matrix component
3. Create history display
4. Style choice buttons
5. Mobile responsive design
6. URL sharing interface

### Phase 3: Social Features
1. Add final message system
2. Implement rematch functionality
3. Test complete game chain (multiple games)
4. Add copy-to-clipboard functionality
5. Social sharing optimization

### Phase 4: Deployment
1. Configure GitHub Pages
2. Set up GitHub Actions
3. Test production build
4. Create landing page
5. Write README with instructions
6. Launch and gather feedback

---

## Success Metrics

### Technical Success
- URL length < 1500 characters
- Encryption/decryption < 100ms
- Zero server dependencies
- Works across all major browsers

### User Experience Success
- Clear understanding of rules (user testing)
- Intuitive choice process
- Successful URL sharing
- Completed game rate > 80%

### Engagement Success
- Rematch rate > 40%
- Multiple game chains
- Social sharing of results
- Positive feedback on trust dynamics

---

## Appendix: Game Theory Context

### Why Prisoner's Dilemma?
The Prisoner's Dilemma is one of the most studied scenarios in game theory:
- **Nash Equilibrium:** Both players talking (rational but suboptimal)
- **Pareto Optimal:** Both players silent (requires trust)
- **Real-World Applications:** International relations, business competition, social cooperation

### Strategy Analysis
- **Tit-for-Tat:** Cooperate first, then mirror opponent
- **Always Defect:** Rational self-interest
- **Always Cooperate:** Optimistic trust
- **Grudger:** Cooperate until betrayed, then always defect

### Educational Value
Players naturally discover:
- Tension between individual and collective good
- Importance of trust and reputation
- Impact of repeated interactions on behavior
- How communication (or lack thereof) affects cooperation

This implementation makes abstract game theory tangible and emotionally engaging through real friend interactions.