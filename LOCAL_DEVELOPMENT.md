# Running Correspondence Games Locally

A guide to running the configurable correspondence games framework on your local machine.

## Prerequisites

### Required Software

- **Node.js** (v18 or higher)
  - Check: `node --version`
  - Download: https://nodejs.org/

- **npm** (comes with Node.js)
  - Check: `npm --version`

### Optional (for PRP development)

- **Python** (v3.11+) with `uv` for running PRP scripts
- **Git** for version control

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url> correspondence-games
cd correspondence-games
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- React 19
- TypeScript
- Vite (dev server and build tool)
- Zod (runtime validation)
- crypto-js and lz-string (encryption)
- Vite YAML plugin (for game configs)
- Testing libraries (Vitest, Playwright)

### 3. Start Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

**Expected output:**
```
  VITE v5.4.20  ready in 500 ms

  ➜  Local:   http://localhost:5173/correspondence-games/
  ➜  Network: use --host to expose
```

### 4. Open in Browser

Navigate to: `http://localhost:5173/correspondence-games/`

You should see the Prisoner's Dilemma game interface.

## Available npm Scripts

### Development

```bash
# Start dev server with hot reload
npm run dev

# Build TypeScript + Vite for production
npm run build

# Preview production build locally
npm run preview
```

### Code Quality

```bash
# Type-check with TypeScript (no emit)
npm run type-check

# Lint code (ESLint) - requires .eslintrc config
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format
```

### Testing

```bash
# Run unit tests (Vitest)
npm run test

# Run tests with coverage report
npm run test:coverage

# Run tests with UI
npm run test:ui

# Run integration tests (Playwright)
npx playwright test
```

## Project Structure

```
correspondence-games/
├── src/
│   ├── features/game/          # Existing Prisoner's Dilemma
│   │   ├── components/         # React components
│   │   ├── schemas/            # Zod schemas (hardcoded)
│   │   ├── utils/              # Game logic, encryption
│   │   └── integration/        # Integration tests
│   │
│   ├── framework/              # NEW: Configurable framework
│   │   ├── core/
│   │   │   ├── config/         # YAML config loader
│   │   │   ├── schemas/        # Dynamic Zod schemas
│   │   │   └── engine/         # Payoff & turn engines
│   │   ├── components/         # Dynamic UI components
│   │   ├── hooks/              # React hooks
│   │   └── storage/            # HMAC & checksum managers
│   │
│   ├── shared/                 # Shared utilities
│   └── App.tsx                 # Main app entry
│
├── games/configs/              # Game YAML configs
│   ├── prisoners-dilemma.yaml
│   └── rock-paper-scissors.yaml
│
├── PRPs/                       # Product Requirement Prompts
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript config
└── package.json                # Dependencies

```

## Understanding the Framework

### Game Configuration (YAML)

Games are defined in `games/configs/*.yaml`:

```yaml
# Example: games/configs/prisoners-dilemma.yaml
metadata:
  id: prisoners-dilemma
  name: "Prisoner's Dilemma"
  version: "1.0.0"

choices:
  - id: silent
    label: "Stay Silent"
    icon: "🤐"

payoffRules:
  - condition:
      player1: silent
      player2: silent
    outcome:
      player1: 3
      player2: 3
```

### Loading a Game Config

```typescript
import prisonersDilemmaYaml from '/games/configs/prisoners-dilemma.yaml';
import { useConfigLoader } from './framework/hooks/useConfigLoader';

function App() {
  const { config, loading, error } = useConfigLoader(prisonersDilemmaYaml);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <Game config={config} />;
}
```

### Using Framework Components

```typescript
import { DynamicChoiceBoard } from './framework/components/DynamicChoiceBoard';
import { DynamicPayoffMatrix } from './framework/components/DynamicPayoffMatrix';

// Choice board adapts to any number of choices
<DynamicChoiceBoard
  config={gameConfig}
  onChoiceSelected={(choiceId) => handleChoice(choiceId)}
  playerNumber={1}
/>

// Payoff matrix shows all outcomes
<DynamicPayoffMatrix
  config={gameConfig}
  show={true}
/>
```

## Creating a New Game

### 1. Create YAML Config

Create `games/configs/my-game.yaml`:

```yaml
metadata:
  id: my-game
  name: "My Custom Game"
  version: "1.0.0"

choices:
  - id: choice1
    label: "Choice 1"
    icon: "🎲"
  - id: choice2
    label: "Choice 2"
    icon: "🎯"

payoffRules:
  - condition: { player1: choice1, player2: choice1 }
    outcome: { player1: 5, player2: 5 }
  # ... all combinations

progression:
  totalRounds: 3
  startingPlayer: 1
  alternateStarter: true
  showRunningTotal: true

ui:
  showPayoffMatrix: true
  showChoiceDescriptions: true
```

### 2. Import and Use

```typescript
import myGameYaml from '/games/configs/my-game.yaml';
import { useConfigLoader } from './framework/hooks/useConfigLoader';

const { config } = useConfigLoader(myGameYaml);
```

That's it! The framework handles the rest.

## Common Development Tasks

### Adding a New Feature

1. **Create a PRP** (Product Requirement Prompt):
   ```bash
   cp PRPs/templates/prp_base.md PRPs/my-feature.md
   # Edit PRPs/my-feature.md with your feature spec
   ```

2. **Execute with Claude Code**:
   ```
   /prp-commands:prp-base-execute PRPs/my-feature.md
   ```

3. **Validate**:
   ```bash
   npm run type-check    # Level 1: TypeScript
   npm run test          # Level 2: Unit tests
   npx playwright test   # Level 3: Integration
   ```

### Debugging

1. **Check browser console** for JavaScript errors
2. **Use React DevTools** browser extension
3. **Check Network tab** for failed requests
4. **Use Claude Code** `/development:debug` command

### Hot Reload Not Working?

- Restart dev server: `Ctrl+C` then `npm run dev`
- Clear browser cache: `Ctrl+Shift+R` (hard refresh)
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

## Testing

### Unit Tests (Vitest)

```bash
# Run all tests
npm run test

# Run specific test file
npm run test src/framework/core/config/loader.test.ts

# Watch mode (reruns on file changes)
npm run test -- --watch

# Coverage report
npm run test:coverage
```

### Integration Tests (Playwright)

```bash
# Run all integration tests
npx playwright test

# Run specific test
npx playwright test rematch.integration.test.ts

# Run in UI mode (interactive)
npx playwright test --ui

# Debug mode
npx playwright test --debug
```

## Building for Production

### 1. Build

```bash
npm run build
```

Output in `dist/` directory:
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── vendor chunks
```

### 2. Preview Locally

```bash
npm run preview
```

Opens at `http://localhost:4173`

### 3. Deploy to GitHub Pages

The project is configured for GitHub Pages deployment:

```bash
# Build creates dist/ with correct base path
npm run build

# Deploy (via GitHub Actions or manual)
# See .github/workflows/ for automated deployment
```

## Troubleshooting

### Port 5173 Already in Use

```bash
# Kill process using port
lsof -ti:5173 | xargs kill -9

# Or change port in vite.config.ts
```

### TypeScript Errors

```bash
# Rebuild TypeScript
npm run type-check

# Check tsconfig.json is correct
```

### Module Not Found

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### YAML Import Not Working

Check `src/vite-env.d.ts` has:
```typescript
declare module '*.yaml' {
  const content: Record<string, unknown>;
  export default content;
}
```

## Environment Variables

Create `.env.local` for local overrides:

```bash
VITE_APP_BASE_URL=/correspondence-games/
```

**NEVER commit `.env.local`** - it's gitignored.

## Security Notes

- **GAME_SECRET**: Defined in `src/shared/utils/constants.ts`
  - For local dev only
  - Production should use environment variables
  - Used for AES encryption and HMAC signing

- **localStorage**: Protected with SHA-256 checksums
- **URLs**: Protected with HMAC-SHA256 signatures
- **All external data**: Validated with Zod schemas

## Getting Help

1. **Check documentation**: `PRPs/configurable-game-framework.md`
2. **Use Claude Code**: `/development:prime-core` to understand codebase
3. **Check tests**: Integration tests show usage patterns
4. **Read PRD**: `PRPs/configurable-game-framework-prd.md`

## Quick Reference

```bash
# Most common commands
npm install              # Install dependencies
npm run dev              # Start dev server
npm run build            # Build for production
npm run type-check       # Check TypeScript
npm run test             # Run unit tests
npx playwright test      # Run integration tests

# Clean slate
rm -rf node_modules dist
npm install
npm run dev
```

---

**Happy coding!** 🎮

For more details on the PRP methodology and framework architecture, see:
- `PRPs/configurable-game-framework.md` - Complete implementation guide
- `PRPs/configurable-game-framework-prd.md` - Product requirements
- `CLAUDE.md` - Project-specific Claude Code guidelines
