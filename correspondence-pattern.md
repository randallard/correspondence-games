# URL-Based Game Framework

## Core Concept

A multiplayer game system where game state is encrypted and passed via URLs, allowing players to use any communication platform (text, email, Discord, etc.) without requiring real-time servers.

## Technical Stack

### Essential Components
- **Vite + React + TypeScript** - Fast development, component-based UI, type safety
- **Crypto-JS** - AES encryption for game state
- **LZ-String** - Compression to minimize URL length
- **GitHub Pages** - Free static hosting
- **GitHub Actions** - Automated deployment

### Dependencies
```bash
npm create vite@latest game-name --template react-ts
npm install crypto-js lz-string
npm install -D @types/crypto-js
```

## URL State Management

### Core Architecture
```typescript
// Game flow: GameState -> JSON -> Compress -> Encrypt -> Base64 -> URL
function encodeGameState(gameState: any, secret: string): string {
  const json = JSON.stringify(gameState);
  const compressed = LZString.compress(json);
  const encrypted = CryptoJS.AES.encrypt(compressed, secret).toString();
  return btoa(encrypted);
}

function decodeGameState(encoded: string, secret: string): any {
  const encrypted = atob(encoded);
  const decrypted = CryptoJS.AES.decrypt(encrypted, secret).toString(CryptoJS.enc.Utf8);
  const json = LZString.decompress(decrypted);
  return JSON.parse(json);
}
```

### URL Structure
```
https://username.github.io/game-name/game?s=base64_encrypted_state
```

### Size Limitations
- Modern browsers: ~2000 character URL limit
- Target: Keep encoded state under 1500 characters
- Strategies: Compression, minimal state, abbreviate property names

## Player Flow Pattern

### Universal Turn-Based Flow
1. **Player opens URL** → Decrypt and display game state
2. **Player takes action** → Update game state locally
3. **Generate new URL** → Encrypt updated state
4. **Share URL screen** → "Send this to your opponent"
5. **Opponent clicks URL** → Repeat cycle

### Share Screen Template
```
"Great move! 
Send this URL to [opponent name]:
[copy button] [generated_url]

Waiting for [opponent] to take their turn..."
```

## Generic Game State Structure

### Minimal Required Fields
```typescript
interface BaseGameState {
  gameId: string;           // Unique game identifier
  currentPlayer: string;    // Whose turn it is
  moveCount: number;        // Turn counter
  gameStatus: 'playing' | 'finished' | 'waiting';
  players: string[];        // Player identifiers
  winner?: string;          // Game result
}

// Extend with game-specific data
interface YourGameState extends BaseGameState {
  // Add your game-specific fields here
  board?: any;
  score?: any;
  customData?: any;
}
```

### Error Handling
```typescript
function validateGameState(state: any): boolean {
  return (
    state.gameId &&
    state.currentPlayer &&
    typeof state.moveCount === 'number' &&
    state.gameStatus &&
    Array.isArray(state.players)
  );
}
```

## Component Architecture Pattern

### Universal Components
```typescript
// App.tsx - Main router
function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedState = urlParams.get('s');
    
    if (encodedState) {
      try {
        const decoded = decodeGameState(encodedState, SECRET_KEY);
        setGameState(decoded);
      } catch (error) {
        // Handle invalid URL
      }
    } else {
      // New game setup
    }
  }, []);

  if (!gameState) return <NewGameSetup />;
  if (gameState.gameStatus === 'finished') return <GameOver />;
  return <GamePlay />;
}

// URLSharer.tsx - Reusable sharing component
function URLSharer({ gameState, opponentName }: Props) {
  const gameUrl = generateGameURL(gameState);
  
  return (
    <div>
      <h2>Great move!</h2>
      <p>Send this URL to {opponentName}:</p>
      <div>
        <input value={gameUrl} readOnly />
        <button onClick={() => navigator.clipboard.writeText(gameUrl)}>
          Copy
        </button>
      </div>
    </div>
  );
}
```

### Game-Specific Components
```typescript
// GamePlay.tsx - Your game's main interface
// GameBoard.tsx - Your game's board/interface
// GameRules.tsx - Rules explanation
// NewGameSetup.tsx - Initial game creation
```

## Deployment Configuration

### Vite Config for GitHub Pages
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/your-game-name/',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
```

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v3
      - uses: actions/upload-pages-artifact@v2
        with:
          path: './dist'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/deploy-pages@v2
```

## Security Considerations

### Encryption Best Practices
```typescript
// Use a consistent secret key for your game
const SECRET_KEY = "your-game-specific-secret-2024";

// Optional: Add game version to prevent incompatible states
interface GameState {
  version: string; // "1.0.0"
  // ... other fields
}

// Validate version on decode
function isCompatibleVersion(state: GameState): boolean {
  return state.version === CURRENT_VERSION;
}
```

### Tamper Prevention
- Players cannot modify encrypted state without the secret
- Include checksums for critical game data
- Validate all state transitions on load
- Gracefully handle corrupted/invalid URLs

## Testing Strategy

### URL State Testing
```typescript
// Test round-trip encoding/decoding
test('state encoding/decoding', () => {
  const originalState = { /* test state */ };
  const encoded = encodeGameState(originalState, 'test-secret');
  const decoded = decodeGameState(encoded, 'test-secret');
  expect(decoded).toEqual(originalState);
});

// Test URL length limits
test('encoded state size', () => {
  const maxState = { /* largest possible state */ };
  const encoded = encodeGameState(maxState, 'test-secret');
  expect(encoded.length).toBeLessThan(1500);
});
```

### Game Flow Testing
- Test invalid URL handling
- Test game state validation
- Test turn transitions
- Test win condition detection

## Performance Optimization

### Bundle Size Management
```typescript
// Lazy load non-critical components
const GameRules = lazy(() => import('./GameRules'));
const GameHistory = lazy(() => import('./GameHistory'));

// Use dynamic imports for large dependencies
const heavyFeature = await import('./HeavyFeature');
```

### State Optimization
```typescript
// Minimize state size
interface OptimizedState {
  // Use short property names
  p: string;    // instead of 'currentPlayer'
  m: number;    // instead of 'moveCount'
  s: string;    // instead of 'gameStatus'
  
  // Store only essential data
  // Derive/calculate other values on load
}
```

## Adaptation Checklist

### For Any New Game
- [ ] Define your game state interface
- [ ] Implement game-specific validation logic
- [ ] Create your game board/interface components
- [ ] Update SECRET_KEY to be game-specific
- [ ] Test URL length with maximum game state
- [ ] Customize player flow messaging
- [ ] Add game-specific rules/tutorial
- [ ] Update GitHub repository name and URLs

### Game State Design Guidelines
- Keep state minimal (derive calculated values)
- Use short property names for compression
- Version your state schema for future updates
- Include only data needed to resume the game
- Validate all incoming state data

### URL Length Estimation
```typescript
// Rough formula for URL length estimation:
// JSON size × 0.7 (compression) × 1.4 (encryption overhead) × 1.3 (base64) + base URL

// Example: 200 byte JSON ≈ 200 × 0.7 × 1.4 × 1.3 ≈ 255 character state parameter
```

## Example Games Suited for This Pattern

### Perfect Fit
- Turn-based strategy games
- Puzzle games with shared state
- Word games (like Wordle variants)
- Card games
- Board game adaptations

### Not Suitable
- Real-time action games
- Games requiring frequent state updates
- Games with large state (complex 3D worlds)
- Games needing server-side validation

## Troubleshooting Common Issues

### URL Too Long
- Compress state further (shorter property names)
- Remove derived/calculated data
- Split complex state into multiple turns
- Use abbreviations for enum values

### Encryption Errors
- Verify secret key consistency
- Check for character encoding issues
- Validate JSON structure before encryption
- Handle browser differences in crypto APIs

### State Desync
- Add state validation on every load
- Include turn counter for conflict detection
- Provide "reset game" option for corrupted states
- Log errors for debugging

This framework provides the foundation for any turn-based game using URL-based state sharing, eliminating the need for servers while maintaining security and ease of sharing.