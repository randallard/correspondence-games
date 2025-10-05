# Fix RPS Game Flow - Quick Summary

## The Problem
Current flow makes too many URL exchanges. Players don't chain their actions together.

## The Solution: Result Chaining

**Principle**: When you complete a round, see results AND make your next choice before sharing.

## Correct Flow Example

```
Round 1 (P1 starts):
  P1: Rock → share URL
  P2: Paper → SEE RESULTS (P2 wins) → Scissors (Round 2) → share URL

Round 2 (P2 started above):
  P1: SEE R1 RESULTS → Rock → SEE R2 RESULTS (P1 wins) → Paper (Round 3) → share URL

Round 3 (P1 started above):
  P2: SEE R2 RESULTS → Rock → SEE R3 RESULTS (P2 wins) → FINAL → share URL

Game Over:
  P1: SEE ALL RESULTS → Winner declared
```

**Result**: 6 URL exchanges for 3 rounds (instead of 9+)

## Key Changes Needed

### 1. Add State Tracking
```typescript
flowState: 'waiting_first' | 'waiting_second' | 'results_and_next' | 'complete'
```

### 2. Update makeChoice Logic
- Detect if 1st or 2nd choice
- On 2nd choice: calculate results, set flowState = 'results_and_next'

### 3. Add New Function
```typescript
makeNextChoiceAfterResults(choiceId) {
  // Advance round, clear choices, make new choice
}
```

### 4. Update Render
- Show results + next choice UI when flowState === 'results_and_next'
- Handle alternation correctly

## Testing
Complete a 3-round game and verify:
- ✅ Only 6 URL exchanges
- ✅ Player who completes round sees results immediately
- ✅ Same player makes next choice before sharing
- ✅ Alternation works (P1, P2, P1 starting rounds)

## Files Changed
- `src/App.tsx` - All changes in this one file
- No new dependencies needed

---

**See full TASK PRP**: `fix-rps-game-flow.md`
