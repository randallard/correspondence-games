name: "Configurable Correspondence Game Framework - Implementation PRP"
description: |
  Transform hardcoded Prisoner's Dilemma into a configurable framework that generates
  complete game implementations from YAML configuration files.

---

## Goal

**Feature Goal**: Build a configuration-driven correspondence game framework that generates complete 2-player turn-based games from YAML config files, enabling developers to create new games (Rock-Paper-Scissors, Matching Pennies, etc.) without writing game-specific code.

**Deliverable**: Production-ready framework with:
- YAML config loader with Zod validation
- Dynamic Zod schema generator from game config
- Config-driven payoff calculation engine
- Dynamic React UI component generation
- HMAC-signed delta-based URL encoding
- localStorage with SHA-256 checksums
- Deployment-ready GitHub Actions workflow

**Success Definition**: A developer can create a new correspondence game by:
1. Writing a single YAML config file (`games/configs/my-game.yaml`)
2. Running `npm install && npm run dev`
3. Playing the fully functional game locally
4. Deploying to GitHub Pages with zero code changes

---

## User Persona

**Target User**: React/TypeScript developers or educators creating correspondence games

**Primary Use Case**: Game theory educator wants to create Matching Pennies game for students without duplicating entire codebase

**User Journey**:
1. Clone framework template repository
2. Copy `rock-paper-scissors.yaml` config to `matching-pennies.yaml`
3. Edit YAML: choices (heads/tails), payoff matrix, display strings
4. Run `npm run dev` - game works immediately
5. Customize UI colors/text via config (optional)
6. Deploy to GitHub Pages via git push
7. Share game URL with students

**Pain Points Addressed**:
- No need to understand React component architecture
- No TypeScript/Zod knowledge required for basic games
- No encryption/URL encoding complexity
- No localStorage or state management code
- Instant validation feedback if YAML is invalid

---

## Why

- **Reusability**: Current Prisoner's Dilemma implementation (~3000 LOC) cannot be reused for other games without major refactoring
- **Educational Value**: Game theory educators need rapid prototyping for pedagogical experiments
- **Framework Demonstration**: Showcases PRP methodology and AI-assisted config-driven architecture
- **Multi-repo Strategy**: Enables `correspondence-games-framework` master repo linking to individual game repos
- **Developer Experience**: Con configuration-based approach lowers barrier to entry vs writing React code

**Integration with Existing Features**:
- Reuses battle-tested encryption pipeline (`src/features/game/utils/encryption.ts`)
- Extends URL state management with delta-based encoding
- Builds on existing Zod validation patterns
- Leverages localStorage hooks with added HMAC integrity checking

**Problems Solved**:
- **For Developers**: Create games in 5 minutes vs 5 days
- **For Educators**: Rapidly test game theory variations without programming
- **For Framework**: Demonstrate config-driven architecture at scale

---

## What

Transform existing Prisoner's Dilemma codebase into a generic framework that:

### Core Capabilities

1. **Config Loading & Validation**
   - Load YAML config files with Vite plugin
   - Validate against comprehensive Zod schema
   - Provide clear error messages for invalid configs
   - Support config hot-reloading in development

2. **Dynamic Schema Generation**
   - Generate game-specific Zod schemas from config
   - Create branded types for choices (e.g., `RockPaperScissors.Choice`)
   - Support custom turn schemas via JSON Schema in config
   - Validate all state transitions against generated schemas

3. **Config-Driven Game Engine**
   - Payoff calculation via matrix lookup (not hardcoded if-else)
   - Win condition evaluation from config rules
   - Round progression based on config round count
   - Support asymmetric games (different choices per player)

4. **Dynamic UI Generation**
   - Render choice buttons from config (emoji + display name)
   - Generate payoff matrix table from config
   - Display custom scenario text and instructions
   - Support config-driven theming (colors, fonts)

5. **Enhanced State Management**
   - Delta-based URL encoding (only latest move in URL)
   - Full game state in localStorage with SHA-256 checksum
   - HMAC signatures on all URLs for tamper detection
   - Automatic localStorage cleanup on corruption detection

6. **Deployment Infrastructure**
   - GitHub Actions workflow with test gates
   - Automatic Vite base path configuration
   - Multi-game repo management
   - Production build optimization

### Success Criteria

- [ ] YAML config loaded and validated with detailed error messages
- [ ] New game works end-to-end without writing TypeScript code
- [ ] URL length stays < 1800 characters for 5-round games
- [ ] HMAC verification rejects tampered URLs
- [ ] localStorage checksum detects corrupted data
- [ ] All existing Prisoner's Dilemma tests still pass
- [ ] GitHub Actions deploys successfully
- [ ] Three example games work: Prisoner's Dilemma, Rock-Paper-Scissors, Matching Pennies

---

## All Needed Context

### Context Completeness Check

✅ **Passes "No Prior Knowledge" Test**: This PRP contains:
- Complete file paths to existing patterns to follow
- Specific library documentation with exact sections
- Gotchas from battle-tested Prisoner's Dilemma implementation
- Integration points with line numbers
- Validation commands verified in codebase

### Documentation & References

```yaml
# YAML Loading & Parsing
- url: https://github.com/figma/vite-plugin-yaml
  why: Vite plugin for importing YAML files as JS objects in React
  critical: Must add '@modyfi/vite-plugin-yaml/modules' to tsconfig types array
  pattern: Import YAML directly with `import config from './game.yaml'`

- url: https://www.npmjs.com/package/js-yaml
  why: Fallback YAML parser if Vite plugin doesn't work (21K+ projects use this)
  critical: Use yaml.load() with safeLoad option to prevent code execution
  install: npm install js-yaml @types/js-yaml

# Dynamic UI Generation
- url: https://rjsf-team.github.io/react-jsonschema-form/docs/
  why: React JSON Schema Form for dynamic form generation patterns
  critical: Use uiSchema for customization, validator for runtime validation
  pattern: Schema → Form component → Type-safe output
  note: Reference for inspiration, may not use directly

# Web Crypto API for HMAC
- url: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/sign
  why: HMAC-SHA256 signature generation for URL tamper detection
  critical: Use crypto.subtle.verify() for constant-time comparison (prevents timing attacks)
  pattern: importKey('raw', secret, {name: 'HMAC', hash: 'SHA-256'}) → sign()

- url: https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html
  why: OWASP best practices for HMAC and checksum verification
  critical: Always verify HMAC BEFORE decryption to prevent processing tampered data

# Zod Dynamic Schemas
- url: https://zod.dev/
  why: TypeScript-first runtime validation with type inference
  critical: Use z.object(Object.fromEntries(...)) for dynamic schema generation
  pattern: Runtime config → Zod schema → Type inference → Validation

- url: https://dev.to/yanagisawahidetoshi/dynamically-modifying-validation-schemas-in-zod-a-typescript-and-react-hook-form-example-3ho0
  why: Dynamic Zod schema generation from runtime data
  critical: Can create conditional schemas based on config parameters

# GitHub Actions Deployment
- url: https://vite.dev/guide/static-deploy
  why: Official Vite GitHub Pages deployment guide
  critical: Must set base path in vite.config.ts for GitHub Pages subdirectory

- url: https://levelup.gitconnected.com/deploying-a-vite-react-typescript-app-to-github-pages-using-github-actions-jest-and-pnpm-as-a-a3461ef9c4ad
  why: Complete GitHub Actions workflow with test gates for Vite + React + TypeScript
  critical: Use actions/configure-pages@v4 and actions/upload-pages-artifact@v3

# Existing Codebase Patterns to Follow
- file: src/features/game/schemas/gameSchema.ts
  why: Branded types pattern (PlayerIdSchema, GameIdSchema)
  pattern: Use .brand<'Type'>() for type-safe IDs
  gotcha: Must use `as ReturnType<typeof Schema.parse>` when creating IDs programmatically
  lines: 26-27 (PlayerIdSchema), 33-34 (GameIdSchema)

- file: src/features/game/utils/encryption.ts
  why: AES-256 encryption pipeline (JSON → Compress → Encrypt → Base64)
  pattern: Use CryptoJS.AES.encrypt() with .toString(CryptoJS.enc.Utf8) for decryption
  gotcha: MUST use compressToEncodedURIComponent / decompressFromEncodedURIComponent (matching pair)
  critical: Always validate with Zod AFTER decryption - decryption succeeds even for tampered data
  lines: 55-76 (encryptGameState), 108-147 (decryptGameState)

- file: src/features/game/utils/urlGeneration.ts
  why: URL state management with length monitoring
  pattern: window.history.replaceState() to update URL without reload
  gotcha: Warn if URL length > MAX_URL_LENGTH (currently 1500, framework will use 1800)
  lines: 37-61 (generateShareableURL), 189-196 (updateURLWithState)

- file: src/features/game/utils/payoffCalculation.ts
  why: Pattern to REPLACE with config-driven lookup
  pattern: Current uses hardcoded if-else, framework will use nested object lookup
  critical: Framework must support asymmetric games (different player choices)
  lines: 53-71 (calculatePayoff - to be replaced)

- file: src/features/game/hooks/useLocalStorage.ts
  why: Defensive localStorage operations with fallback
  pattern: Wrap all localStorage.setItem/getItem in try-catch
  gotcha: localStorage can fail (quota exceeded, private browsing), always have fallback
  critical: Generate session ID on first use for player tracking
  lines: 28-35 (saveGameHistory), 43-75 (getGameHistory with fallback)

- file: src/features/game/hooks/useGameState.ts
  why: State management pattern with useCallback for performance
  pattern: Return explicit interface, use useCallback([gameState]) for handlers
  gotcha: Dependency array must include gameState for closures
  lines: 16-30 (UseGameStateResult interface), 53-192 (hook implementation)

- file: src/App.tsx
  why: Multi-hook composition and side effect patterns
  pattern: Compose multiple custom hooks, use useRef for non-render side effects
  critical: Empty dependency array [] for URL parsing (only run on mount)
  gotcha: Track saved games with useRef to prevent duplicate localStorage writes
  lines: 42-52 (hook composition), 142-207 (side effect patterns)

- file: src/shared/utils/constants.ts
  why: Constants pattern (will become config defaults)
  pattern: Export as const for type inference
  critical: GAME_SECRET is obfuscation not security (client-side visible)
  lines: 27 (MAX_URL_LENGTH), 33-42 (PAYOFF_MATRIX structure)

- file: PRPs/configurable-game-framework-prd.md
  why: Delta URL encoding specification and HMAC implementation
  pattern: Initial URL contains full state, subsequent URLs contain only delta + HMAC
  critical: URL format = base64(encrypted_data.hmac_signature)
  lines: 575-583 (EncryptedURLFragment type), 929-1019 (HMAC methods)
```

### Current Codebase Tree

```bash
/home/ryankhetlyr/Development/correspondence-games/
├── .claude/
│   ├── commands/                    # Claude Code slash commands
│   └── settings.local.json
├── PRPs/
│   ├── templates/                   # PRP templates
│   ├── ai_docs/                     # Curated AI documentation
│   └── configurable-game-framework-prd.md  # Planning PRD
├── src/
│   ├── features/game/               # Game-specific code (will become framework)
│   │   ├── components/              # React components (9 files)
│   │   ├── hooks/                   # Custom hooks (4 files)
│   │   ├── schemas/                 # Zod schemas
│   │   ├── types/                   # TypeScript types
│   │   ├── utils/                   # Core utilities
│   │   └── integration/             # Integration tests
│   ├── shared/                      # Shared code
│   │   ├── components/              # Generic UI components
│   │   ├── hooks/                   # Shared hooks
│   │   └── utils/                   # Constants and utilities
│   ├── App.tsx                      # Main application
│   └── main.tsx                     # Entry point
├── package.json                     # Dependencies
├── vite.config.ts                   # Vite configuration
├── tsconfig.json                    # TypeScript configuration
└── README.md

Dependencies (package.json):
- react: ^19.0.0
- react-dom: ^19.0.0
- crypto-js: ^4.2.0                  # AES encryption
- lz-string: ^1.5.0                  # URL compression
- zod: ^3.22.0                       # Runtime validation
- vitest: ^1.0.0                     # Unit testing
- @playwright/test: ^1.55.1          # E2E testing
```

### Desired Codebase Tree (Post-Implementation)

```bash
/home/ryankhetlyr/Development/correspondence-games/
├── games/
│   └── configs/                     # NEW: Game configuration files
│       ├── prisoners-dilemma.yaml
│       ├── rock-paper-scissors.yaml
│       ├── matching-pennies.yaml
│       └── README.md                # Config creation guide
├── src/
│   ├── framework/                   # NEW: Framework core (renamed from features/game)
│   │   ├── core/
│   │   │   ├── schemas/
│   │   │   │   ├── configSchema.ts           # NEW: Validates YAML config files
│   │   │   │   ├── baseGameSchema.ts         # NEW: Base Zod schema all games extend
│   │   │   │   └── schemaGenerator.ts        # NEW: Dynamic Zod schema from config
│   │   │   ├── engine/
│   │   │   │   ├── payoffEngine.ts           # NEW: Config-driven payoff calculation
│   │   │   │   ├── turnEngine.ts             # NEW: Turn progression logic
│   │   │   │   ├── validationEngine.ts       # NEW: Move validation from config rules
│   │   │   │   └── checksumManager.ts        # NEW: SHA-256 localStorage verification
│   │   │   └── config/
│   │   │       ├── loader.ts                 # NEW: Load & validate YAML configs
│   │   │       ├── validator.ts              # NEW: Config validation logic
│   │   │       └── types.ts                  # NEW: GameConfig TypeScript types
│   │   ├── storage/
│   │   │   ├── urlStateManager.ts            # ADAPTED: Add HMAC + delta encoding
│   │   │   ├── localStorageManager.ts        # ADAPTED: Add SHA-256 checksums
│   │   │   └── encryption.ts                 # REUSED: From utils/encryption.ts
│   │   ├── components/
│   │   │   ├── GameShell.tsx                 # ADAPTED: Generic game container
│   │   │   ├── DynamicChoiceBoard.tsx        # NEW: Config-driven choice rendering
│   │   │   ├── DynamicPayoffMatrix.tsx       # NEW: Config-driven matrix display
│   │   │   ├── RoundHistory.tsx              # REUSED: Generic history component
│   │   │   └── URLSharer.tsx                 # REUSED: URL sharing UI
│   │   ├── hooks/
│   │   │   ├── useGameEngine.ts              # NEW: Replaces useGameState
│   │   │   ├── useConfigLoader.ts            # NEW: Load and validate config
│   │   │   ├── useURLState.ts                # ADAPTED: Add HMAC verification
│   │   │   └── useLocalStorage.ts            # ADAPTED: Add checksum validation
│   │   └── types/
│   │       ├── gameConfig.ts                 # NEW: Config file types
│   │       ├── gameState.ts                  # ADAPTED: Generic state types
│   │       └── history.ts                    # REUSED: History types
│   ├── shared/                      # Unchanged
│   ├── App.tsx                      # ADAPTED: Use framework components
│   └── main.tsx                     # Unchanged
├── .github/
│   └── workflows/
│       └── deploy.yml               # NEW: GitHub Actions deployment
├── vite.config.ts                   # ADAPTED: Add YAML plugin
└── package.json                     # UPDATED: Add @modyfi/vite-plugin-yaml, js-yaml
```

**File Responsibilities**:
- `configSchema.ts`: Validates YAML config structure (choices, payoffMatrix, roundCount, etc.)
- `schemaGenerator.ts`: Creates runtime Zod schemas from validated config
- `payoffEngine.ts`: Looks up payoffs from config matrix (no hardcoded logic)
- `turnEngine.ts`: Handles round progression based on config.roundCount
- `checksumManager.ts`: Generates/verifies SHA-256 checksums for localStorage integrity
- `loader.ts`: Imports YAML config, validates, provides to React context
- `DynamicChoiceBoard.tsx`: Renders buttons from config.choices array
- `DynamicPayoffMatrix.tsx`: Generates table from config.payoffMatrix
- `useGameEngine.ts`: Generic game state logic (no game-specific code)

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Vite YAML Plugin Setup
// Must add to vite.config.ts plugins array
import ViteYaml from '@modyfi/vite-plugin-yaml';

export default defineConfig({
  plugins: [react(), ViteYaml()],
  // ...
});

// AND add to tsconfig.json types array
{
  "compilerOptions": {
    "types": ["@modyfi/vite-plugin-yaml/modules"]
  }
}

// CRITICAL: CryptoJS UTF8 Encoding
// Decryption MUST use CryptoJS.enc.Utf8 or returns empty string
const decrypted = CryptoJS.AES.decrypt(encrypted, secret)
  .toString(CryptoJS.enc.Utf8);  // REQUIRED

// CRITICAL: LZ-String Method Pairing
// Must use matching compression/decompression methods
const compressed = LZString.compressToEncodedURIComponent(json);  // For URLs
const decompressed = LZString.decompressFromEncodedURIComponent(compressed);  // MUST match

// CRITICAL: Web Crypto API HMAC
// Constant-time comparison prevents timing attacks
async function verifyHMAC(data: string, signature: string): Promise<boolean> {
  const expected = await generateHMAC(data);

  // Constant-time comparison (NEVER use === for crypto)
  if (signature.length !== expected.length) return false;

  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return result === 0;
}

// GOTCHA: localStorage Quota
// 5-10MB limit per origin, can exceed quota
try {
  localStorage.setItem(key, value);
} catch (e) {
  if (e.name === 'QuotaExceededError') {
    // Handle quota exceeded
  }
}

// GOTCHA: Zod Branded Types
// Must use specific syntax for creating branded type instances
const playerId = PlayerIdSchema.parse("player-123");  // Correct
const playerId = "player-123" as PlayerId;  // WRONG - bypasses validation

// GOTCHA: React 19 useCallback Dependencies
// Must include state in dependency array for closures
const handler = useCallback(() => {
  console.log(gameState.currentRound);  // Reads gameState
}, [gameState]);  // MUST include gameState

// CRITICAL: URL Length Validation
// Must validate BEFORE showing share UI, not after
if (url.length > MAX_URL_LENGTH) {
  throw new Error('URL too long - try shorter player names');
}

// GOTCHA: GitHub Pages Base Path
// Must match repository name exactly
export default defineConfig({
  base: process.env.NODE_ENV === 'production'
    ? '/repository-name/'  // MUST match GitHub repo name
    : '/',
});
```

---

## Implementation Blueprint

### Phase 1: Foundation (Config Loading & Validation)

**Objective**: Load and validate YAML game configs with detailed error messages

#### Task 1.1: ADD Vite YAML Plugin

```bash
npm install --save-dev @modyfi/vite-plugin-yaml
```

**MODIFY** `vite.config.ts`:
```typescript
import ViteYaml from '@modyfi/vite-plugin-yaml';

export default defineConfig({
  plugins: [react(), ViteYaml()],
  // ... rest unchanged
});
```

**MODIFY** `tsconfig.json`:
```json
{
  "compilerOptions": {
    "types": ["@modyfi/vite-plugin-yaml/modules", "vite/client"]
  }
}
```

**VALIDATE**: `npm run dev` starts without errors

#### Task 1.2: CREATE Config Schema & Types

**CREATE** `src/framework/core/config/types.ts`:
```typescript
import { z } from 'zod';

// Choice definition for a game
export const ChoiceSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  emoji: z.string().optional(),
  description: z.string().optional(),
});

export type Choice = z.infer<typeof ChoiceSchema>;

// Payoff for a specific outcome
export const PayoffSchema = z.object({
  p1: z.number(),
  p2: z.number(),
});

// Complete game configuration
export const GameConfigSchema = z.object({
  version: z.literal('1.0.0'),
  gameId: z.string().min(1),
  gameName: z.string().min(1),
  description: z.string().optional(),

  // Game mechanics
  roundCount: z.number().int().min(1).max(100),
  choices: z.array(ChoiceSchema).min(2),

  // Payoff matrix: { [p1Choice]: { [p2Choice]: { p1, p2 } } }
  payoffMatrix: z.record(
    z.string(),
    z.record(z.string(), PayoffSchema)
  ),

  // UI customization
  ui: z.object({
    scenarioText: z.string().optional(),
    theme: z.object({
      primaryColor: z.string().default('#3b82f6'),
      backgroundColor: z.string().default('#ffffff'),
    }).optional(),
  }).optional(),

  // Rules
  rules: z.object({
    allowDraw: z.boolean().default(true),
    simultaneousTurns: z.boolean().default(true),
  }).optional(),
});

export type GameConfig = z.infer<typeof GameConfigSchema>;
```

**NAMING**: CamelCase for types, snake_case for properties
**PATTERN**: Follow `src/features/game/schemas/gameSchema.ts` Zod structure
**PLACEMENT**: `src/framework/core/config/types.ts`

**VALIDATE**:
```bash
npm run type-check  # No errors
```

#### Task 1.3: CREATE Config Loader

**CREATE** `src/framework/core/config/loader.ts`:
```typescript
import { GameConfig, GameConfigSchema } from './types';
import { z } from 'zod';

export class ConfigLoaderError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'ConfigLoaderError';
  }
}

export async function loadGameConfig(configPath: string): Promise<GameConfig> {
  try {
    // Dynamic import of YAML file (Vite handles this via plugin)
    const module = await import(/* @vite-ignore */ configPath);
    const rawConfig = module.default || module;

    // Validate with Zod
    const validatedConfig = GameConfigSchema.parse(rawConfig);

    // Additional validation: Verify payoff matrix completeness
    validatePayoffMatrix(validatedConfig);

    return validatedConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formatted = error.errors.map(e =>
        `${e.path.join('.')}: ${e.message}`
      ).join('\n');
      throw new ConfigLoaderError(
        `Invalid game configuration:\n${formatted}`,
        error
      );
    }
    throw new ConfigLoaderError('Failed to load game configuration', error);
  }
}

function validatePayoffMatrix(config: GameConfig): void {
  const choiceIds = config.choices.map(c => c.id);

  // Verify matrix is complete (all choice combinations defined)
  for (const p1Choice of choiceIds) {
    if (!config.payoffMatrix[p1Choice]) {
      throw new ConfigLoaderError(
        `Payoff matrix missing entry for p1 choice: ${p1Choice}`
      );
    }

    for (const p2Choice of choiceIds) {
      if (!config.payoffMatrix[p1Choice][p2Choice]) {
        throw new ConfigLoaderError(
          `Payoff matrix missing entry for: ${p1Choice} vs ${p2Choice}`
        );
      }
    }
  }
}
```

**PATTERN**: Follow `src/features/game/utils/encryption.ts` custom error classes
**CRITICAL**: Use z.ZodError.errors for user-friendly validation messages
**PLACEMENT**: `src/framework/core/config/loader.ts`

**VALIDATE**:
```bash
npm run type-check
npm run lint
```

#### Task 1.4: CREATE Example YAML Configs

**CREATE** `games/configs/prisoners-dilemma.yaml`:
```yaml
version: "1.0.0"
gameId: "prisoners-dilemma"
gameName: "Prisoner's Dilemma"
description: "Classic game theory dilemma about cooperation vs defection"

roundCount: 5

choices:
  - id: "silent"
    displayName: "Stay Silent"
    emoji: "🤐"
    description: "Cooperate with your partner"

  - id: "talk"
    displayName: "Talk to Police"
    emoji: "🗣️"
    description: "Defect against your partner"

payoffMatrix:
  silent:
    silent: { p1: 3, p2: 3 }
    talk: { p1: 0, p2: 5 }
  talk:
    silent: { p1: 5, p2: 0 }
    talk: { p1: 1, p2: 1 }

ui:
  scenarioText: "You and your partner have been arrested..."
  theme:
    primaryColor: "#3b82f6"
    backgroundColor: "#ffffff"

rules:
  allowDraw: true
  simultaneousTurns: true
```

**CREATE** `games/configs/rock-paper-scissors.yaml`:
```yaml
version: "1.0.0"
gameId: "rock-paper-scissors"
gameName: "Rock Paper Scissors"
description: "Classic hand game"

roundCount: 3

choices:
  - id: "rock"
    displayName: "Rock"
    emoji: "✊"

  - id: "paper"
    displayName: "Paper"
    emoji: "✋"

  - id: "scissors"
    displayName: "Scissors"
    emoji: "✌️"

payoffMatrix:
  rock:
    rock: { p1: 0, p2: 0 }
    paper: { p1: -1, p2: 1 }
    scissors: { p1: 1, p2: -1 }
  paper:
    rock: { p1: 1, p2: -1 }
    paper: { p1: 0, p2: 0 }
    scissors: { p1: -1, p2: 1 }
  scissors:
    rock: { p1: -1, p2: 1 }
    paper: { p1: 1, p2: -1 }
    scissors: { p1: 0, p2: 0 }

ui:
  scenarioText: "Choose your move wisely!"
```

**PLACEMENT**: `games/configs/*.yaml`
**NAMING**: kebab-case for file names

**VALIDATE**:
```typescript
// In test file or dev console
import { loadGameConfig } from './framework/core/config/loader';

const config = await loadGameConfig('../../games/configs/prisoners-dilemma.yaml');
console.log(config.gameName);  // Should output: "Prisoner's Dilemma"
```

---

### Phase 2: Dynamic Schema Generation

**Objective**: Generate runtime Zod schemas from game configs

#### Task 2.1: CREATE Schema Generator

**CREATE** `src/framework/core/schemas/schemaGenerator.ts`:
```typescript
import { z } from 'zod';
import { GameConfig } from '../config/types';
import { GameIdSchema, PlayerIdSchema } from './baseGameSchema';

export function generateGameStateSchema(config: GameConfig) {
  // Create choice enum from config
  const choiceIds = config.choices.map(c => c.id) as [string, ...string[]];
  const ChoiceSchema = z.enum(choiceIds);

  // Choice state for a round
  const ChoicesSchema = z.object({
    p1: ChoiceSchema.optional(),
    p2: ChoiceSchema.optional(),
  });

  // Round results
  const RoundResultsSchema = z.object({
    p1Gold: z.number(),
    p2Gold: z.number(),
  });

  // Single round
  const RoundSchema = z.object({
    roundNumber: z.number().int().min(0).max(config.roundCount - 1),
    choices: ChoicesSchema,
    results: RoundResultsSchema.optional(),
    isComplete: z.boolean(),
    completedAt: z.string().datetime().optional(),
  });

  // Player info
  const PlayerInfoSchema = z.object({
    id: PlayerIdSchema,
    name: z.string().min(1).max(50),
  });

  // Game phase
  const GamePhaseSchema = z.enum(['setup', 'playing', 'finished']);

  // Complete game state schema
  const GameStateSchema = z.object({
    version: z.literal('1.0.0'),
    gameId: GameIdSchema,
    gameType: z.literal(config.gameId),

    players: z.object({
      p1: PlayerInfoSchema,
      p2: PlayerInfoSchema,
    }),

    currentRound: z.number().int().min(0).max(config.roundCount - 1),
    rounds: z.array(RoundSchema).length(config.roundCount),

    gamePhase: GamePhaseSchema,

    metadata: z.object({
      createdAt: z.string().datetime(),
      lastMoveAt: z.string().datetime().optional(),
    }),
  });

  return {
    GameStateSchema,
    ChoiceSchema,
    RoundSchema,
    GamePhaseSchema,
  };
}

export type GeneratedSchemas = ReturnType<typeof generateGameStateSchema>;
```

**PATTERN**: Follow `src/features/game/schemas/gameSchema.ts` schema composition
**CRITICAL**: Use config.choices to generate z.enum dynamically
**GOTCHA**: z.enum requires at least 2 values: `as [string, ...string[]]`
**PLACEMENT**: `src/framework/core/schemas/schemaGenerator.ts`

#### Task 2.2: CREATE Base Game Schema

**CREATE** `src/framework/core/schemas/baseGameSchema.ts`:
```typescript
import { z } from 'zod';

// Branded types for type safety (prevents string mixing)
export const PlayerIdSchema = z.string().min(1).brand<'PlayerId'>();
export type PlayerId = z.infer<typeof PlayerIdSchema>;

export const GameIdSchema = z.string().uuid().brand<'GameId'>();
export type GameId = z.infer<typeof GameIdSchema>;

export const SessionIdSchema = z.string().min(1).brand<'SessionId'>();
export type SessionId = z.infer<typeof SessionIdSchema>;

// Helper to create player ID from string
export function createPlayerId(id: string): PlayerId {
  return PlayerIdSchema.parse(id);
}

// Helper to create game ID
export function createGameId(): GameId {
  return GameIdSchema.parse(crypto.randomUUID());
}
```

**PATTERN**: Exact copy from `src/features/game/schemas/gameSchema.ts` lines 26-34
**CRITICAL**: Use branded types to prevent accidental ID mixing
**PLACEMENT**: `src/framework/core/schemas/baseGameSchema.ts`

**VALIDATE**:
```bash
npm run type-check
npm run test -- schemas
```

---

### Phase 3: Config-Driven Game Engine

**Objective**: Replace hardcoded game logic with config-driven calculations

#### Task 3.1: CREATE Payoff Engine

**CREATE** `src/framework/core/engine/payoffEngine.ts`:
```typescript
import { GameConfig } from '../config/types';

export interface PayoffResult {
  p1Score: number;
  p2Score: number;
}

export class PayoffEngineError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'PayoffEngineError';
  }
}

export function calculatePayoff(
  config: GameConfig,
  p1Choice: string,
  p2Choice: string
): PayoffResult {
  // Validate choices exist in config
  const validChoices = config.choices.map(c => c.id);
  if (!validChoices.includes(p1Choice)) {
    throw new PayoffEngineError(`Invalid p1 choice: ${p1Choice}`);
  }
  if (!validChoices.includes(p2Choice)) {
    throw new PayoffEngineError(`Invalid p2 choice: ${p2Choice}`);
  }

  // Look up payoff from config matrix
  const payoff = config.payoffMatrix[p1Choice]?.[p2Choice];

  if (!payoff) {
    throw new PayoffEngineError(
      `No payoff defined for: ${p1Choice} vs ${p2Choice}`
    );
  }

  return {
    p1Score: payoff.p1,
    p2Score: payoff.p2,
  };
}

export function calculateTotalScore(
  rounds: Array<{ results?: { p1Gold: number; p2Gold: number } }>
): { p1Total: number; p2Total: number } {
  return rounds.reduce(
    (totals, round) => {
      if (round.results) {
        return {
          p1Total: totals.p1Total + round.results.p1Gold,
          p2Total: totals.p2Total + round.results.p2Gold,
        };
      }
      return totals;
    },
    { p1Total: 0, p2Total: 0 }
  );
}

export function determineWinner(
  p1Total: number,
  p2Total: number
): 'p1' | 'p2' | 'draw' {
  if (p1Total > p2Total) return 'p1';
  if (p2Total > p1Total) return 'p2';
  return 'draw';
}
```

**PATTERN**: REPLACES hardcoded logic in `src/features/game/utils/payoffCalculation.ts`
**CRITICAL**: Use nested object lookup instead of if-else chains
**ERROR HANDLING**: Follow `src/features/game/utils/encryption.ts` custom error pattern
**PLACEMENT**: `src/framework/core/engine/payoffEngine.ts`

**VALIDATE**:
```typescript
// Unit test
const config = { /* prisoners dilemma config */ };
const result = calculatePayoff(config, 'silent', 'talk');
expect(result).toEqual({ p1Score: 0, p2Score: 5 });
```

#### Task 3.2: CREATE Turn Engine

**CREATE** `src/framework/core/engine/turnEngine.ts`:
```typescript
import { GameConfig } from '../config/types';
import { calculatePayoff } from './payoffEngine';

export interface Round {
  roundNumber: number;
  choices: {
    p1?: string;
    p2?: string;
  };
  results?: {
    p1Gold: number;
    p2Gold: number;
  };
  isComplete: boolean;
  completedAt?: string;
}

export interface GameState {
  gameId: string;
  gameType: string;
  currentRound: number;
  rounds: Round[];
  gamePhase: 'setup' | 'playing' | 'finished';
  metadata: {
    createdAt: string;
    lastMoveAt?: string;
  };
  players: {
    p1: { id: string; name: string };
    p2: { id: string; name: string };
  };
}

export class TurnEngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TurnEngineError';
  }
}

export function canCalculateResults(round: Round): boolean {
  return round.choices.p1 !== undefined && round.choices.p2 !== undefined;
}

export function calculateRoundResults(
  config: GameConfig,
  round: Round
): Round {
  if (!canCalculateResults(round)) {
    throw new TurnEngineError(
      `Cannot calculate results for round ${round.roundNumber}: missing choices`
    );
  }

  const p1Choice = round.choices.p1!;
  const p2Choice = round.choices.p2!;

  const payoff = calculatePayoff(config, p1Choice, p2Choice);

  return {
    ...round,
    results: {
      p1Gold: payoff.p1Score,
      p2Gold: payoff.p2Score,
    },
    isComplete: true,
    completedAt: new Date().toISOString(),
  };
}

export function advanceToNextRound(
  config: GameConfig,
  gameState: GameState
): GameState {
  const currentRound = gameState.rounds[gameState.currentRound];

  if (!currentRound) {
    throw new TurnEngineError('Current round not found');
  }

  if (!currentRound.isComplete) {
    throw new TurnEngineError(
      `Cannot advance from incomplete round ${currentRound.roundNumber}`
    );
  }

  // Check if this was the last round
  if (gameState.currentRound >= config.roundCount - 1) {
    return {
      ...gameState,
      gamePhase: 'finished',
      metadata: {
        ...gameState.metadata,
        lastMoveAt: new Date().toISOString(),
      },
    };
  }

  // Advance to next round
  return {
    ...gameState,
    currentRound: gameState.currentRound + 1,
    gamePhase: 'playing',
    metadata: {
      ...gameState.metadata,
      lastMoveAt: new Date().toISOString(),
    },
  };
}
```

**PATTERN**: Adapted from `src/features/game/utils/payoffCalculation.ts` lines 105-175
**CRITICAL**: Use config.roundCount instead of hardcoded MAX_ROUNDS
**IMMUTABILITY**: Always return new state objects (never mutate)
**PLACEMENT**: `src/framework/core/engine/turnEngine.ts`

---

### Phase 4: HMAC + Checksum Security

**Objective**: Add HMAC signatures to URLs and SHA-256 checksums to localStorage

#### Task 4.1: CREATE Checksum Manager

**CREATE** `src/framework/core/engine/checksumManager.ts`:
```typescript
export class ChecksumError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'ChecksumError';
  }
}

export async function generateChecksum(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  // Use Web Crypto API SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

export async function verifyChecksum(
  data: string,
  expectedChecksum: string
): Promise<boolean> {
  const actualChecksum = await generateChecksum(data);

  // Constant-time comparison (prevents timing attacks)
  if (actualChecksum.length !== expectedChecksum.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < actualChecksum.length; i++) {
    result |= actualChecksum.charCodeAt(i) ^ expectedChecksum.charCodeAt(i);
  }

  return result === 0;
}

export interface ChecksummedData<T> {
  data: T;
  checksum: string;
  timestamp: number;
}

export async function wrapWithChecksum<T>(data: T): Promise<ChecksummedData<T>> {
  const json = JSON.stringify(data);
  const checksum = await generateChecksum(json);

  return {
    data,
    checksum,
    timestamp: Date.now(),
  };
}

export async function unwrapWithChecksum<T>(
  wrapped: ChecksummedData<T>
): Promise<T> {
  const json = JSON.stringify(wrapped.data);
  const isValid = await verifyChecksum(json, wrapped.checksum);

  if (!isValid) {
    throw new ChecksumError('Checksum verification failed - data may be corrupted');
  }

  return wrapped.data;
}
```

**PATTERN**: Follow Web Crypto API from MDN docs
**CRITICAL**: Use constant-time comparison (prevents timing attacks)
**PLACEMENT**: `src/framework/core/engine/checksumManager.ts`

#### Task 4.2: MODIFY localStorage Manager with Checksums

**MODIFY** `src/framework/hooks/useLocalStorage.ts`:

Add checksum validation to `getGameHistory` and `saveGameHistory`:

```typescript
import { wrapWithChecksum, unwrapWithChecksum, ChecksumError } from '../core/engine/checksumManager';

async function saveGameHistory(history: GameHistory): Promise<void> {
  try {
    const wrapped = await wrapWithChecksum(history);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wrapped));
  } catch (error) {
    console.error('Failed to save game history:', error);
    throw new Error('Failed to save game history to localStorage');
  }
}

async function getGameHistory(): Promise<GameHistory> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return createNewHistory();
    }

    const wrapped = JSON.parse(stored);

    // Verify checksum
    const history = await unwrapWithChecksum<GameHistory>(wrapped);

    return history;
  } catch (error) {
    if (error instanceof ChecksumError) {
      console.error('localStorage checksum failed - data corrupted, resetting:', error);
    } else {
      console.error('Failed to retrieve game history:', error);
    }

    // Return fresh history on any error
    const newHistory = createNewHistory();
    await saveGameHistory(newHistory);
    return newHistory;
  }
}
```

**PATTERN**: Follow existing defensive localStorage pattern from `src/features/game/hooks/useLocalStorage.ts`
**CRITICAL**: Reset to fresh history if checksum fails (data corrupted)
**GOTCHA**: Make functions async (checksum operations are async)

#### Task 4.3: MODIFY URL Manager with HMAC

**MODIFY** `src/framework/storage/urlStateManager.ts`:

Add HMAC generation and verification:

```typescript
import { GAME_SECRET } from '../../shared/utils/constants';

async function generateHMAC(data: string): Promise<string> {
  const encoder = new TextEncoder();

  // Import secret as crypto key
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(GAME_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Generate signature
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(data)
  );

  // Convert to base64
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

async function verifyHMAC(data: string, signature: string): Promise<boolean> {
  const expectedSignature = await generateHMAC(data);

  // CRITICAL: Constant-time comparison prevents timing attacks
  if (signature.length !== expectedSignature.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }

  return result === 0;
}

export async function encryptAndSign(gameState: GameState): Promise<string> {
  // Existing encryption pipeline
  const json = JSON.stringify(gameState);
  const compressed = LZString.compressToEncodedURIComponent(json);
  const encrypted = CryptoJS.AES.encrypt(compressed, GAME_SECRET).toString();

  // NEW: Generate HMAC signature
  const hmac = await generateHMAC(encrypted);

  // Combine: encrypted.hmac
  const combined = `${encrypted}.${hmac}`;

  // Base64 encode
  const encoded = btoa(combined);

  return encoded;
}

export async function verifyAndDecrypt(encoded: string): Promise<GameState> {
  // Decode base64
  const combined = atob(encoded);

  // Split encrypted data and HMAC signature
  const parts = combined.split('.');
  if (parts.length !== 2) {
    throw new DecryptionError('Invalid URL structure - missing HMAC signature');
  }

  const [encrypted, hmacSignature] = parts;

  // CRITICAL: Verify HMAC BEFORE decryption
  const isValid = await verifyHMAC(encrypted, hmacSignature);
  if (!isValid) {
    throw new DecryptionError('HMAC verification failed - URL has been tampered with');
  }

  // HMAC verified - safe to decrypt
  const decrypted = CryptoJS.AES.decrypt(encrypted, GAME_SECRET)
    .toString(CryptoJS.enc.Utf8);

  if (!decrypted) {
    throw new DecryptionError('Decryption failed');
  }

  const json = LZString.decompressFromEncodedURIComponent(decrypted);
  if (!json) {
    throw new DecryptionError('Decompression failed');
  }

  const parsed = JSON.parse(json);

  // Validate with Zod (existing pattern)
  const validated = validateGameState(parsed);

  return validated;
}
```

**PATTERN**: Follow PRD specification `PRPs/configurable-game-framework-prd.md` lines 929-1019
**CRITICAL**: Verify HMAC BEFORE decryption (prevents processing tampered data)
**URL FORMAT**: `base64(encrypted_data.hmac_signature)`
**GOTCHA**: Use Web Crypto API (not CryptoJS) for HMAC - it's constant-time

**VALIDATE**:
```bash
npm run test -- security
npm run lint
```

---

### Phase 5: Dynamic UI Components

**Objective**: Generate React components from game configs

#### Task 5.1: CREATE Dynamic Choice Board

**CREATE** `src/framework/components/DynamicChoiceBoard.tsx`:
```typescript
import { ReactElement, MouseEvent } from 'react';
import { GameConfig, Choice } from '../core/config/types';

interface DynamicChoiceBoardProps {
  config: GameConfig;
  onChoice: (choiceId: string) => void;
  disabled: boolean;
  currentRound: number;
}

export const DynamicChoiceBoard = ({
  config,
  onChoice,
  disabled,
  currentRound,
}: DynamicChoiceBoardProps): ReactElement => {
  const handleChoice = (choiceId: string) => (event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    onChoice(choiceId);
  };

  const containerStyles: React.CSSProperties = {
    padding: '32px',
    backgroundColor: config.ui?.theme?.backgroundColor || '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  };

  const choiceGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${Math.min(config.choices.length, 3)}, 1fr)`,
    gap: '16px',
    marginTop: '24px',
  };

  const buttonStyles = (choice: Choice): React.CSSProperties => ({
    padding: '24px',
    fontSize: '18px',
    fontWeight: '600',
    border: `2px solid ${config.ui?.theme?.primaryColor || '#3b82f6'}`,
    borderRadius: '8px',
    backgroundColor: disabled ? '#e5e7eb' : '#ffffff',
    color: disabled ? '#9ca3af' : config.ui?.theme?.primaryColor || '#3b82f6',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  });

  return (
    <div
      style={containerStyles}
      role="region"
      aria-label="Game board"
      aria-live="polite"
    >
      <h2 style={{ marginBottom: '8px' }}>
        Round {currentRound + 1} of {config.roundCount}
      </h2>

      {config.ui?.scenarioText && (
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>
          {config.ui.scenarioText}
        </p>
      )}

      <div style={choiceGridStyles}>
        {config.choices.map((choice) => (
          <button
            key={choice.id}
            onClick={handleChoice(choice.id)}
            disabled={disabled}
            style={buttonStyles(choice)}
            aria-label={choice.displayName}
          >
            {choice.emoji && (
              <span style={{ fontSize: '48px' }} aria-hidden="true">
                {choice.emoji}
              </span>
            )}
            <span>{choice.displayName}</span>
            {choice.description && (
              <span style={{ fontSize: '14px', color: '#9ca3af' }}>
                {choice.description}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
```

**PATTERN**: Adapted from `src/features/game/components/GameBoard.tsx`
**CRITICAL**: Use config.choices to generate buttons dynamically
**THEMING**: Apply config.ui.theme colors to buttons/background
**ACCESSIBILITY**: Include ARIA attributes for screen readers
**PLACEMENT**: `src/framework/components/DynamicChoiceBoard.tsx`

#### Task 5.2: CREATE Dynamic Payoff Matrix

**CREATE** `src/framework/components/DynamicPayoffMatrix.tsx`:
```typescript
import { ReactElement } from 'react';
import { GameConfig } from '../core/config/types';

interface DynamicPayoffMatrixProps {
  config: GameConfig;
}

export const DynamicPayoffMatrix = ({
  config,
}: DynamicPayoffMatrixProps): ReactElement => {
  const containerStyles: React.CSSProperties = {
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    marginTop: '24px',
  };

  const tableStyles: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '12px',
  };

  const headerCellStyles: React.CSSProperties = {
    padding: '12px',
    backgroundColor: config.ui?.theme?.primaryColor || '#3b82f6',
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
    border: '1px solid #d1d5db',
  };

  const dataCellStyles: React.CSSProperties = {
    padding: '12px',
    textAlign: 'center',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
  };

  return (
    <div
      style={containerStyles}
      role="region"
      aria-label="Payoff matrix"
    >
      <h3 style={{ marginBottom: '8px' }}>{config.gameName} - Payoff Matrix</h3>
      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
        Shows points earned for each combination of choices
      </p>

      <table style={tableStyles} role="table">
        <thead>
          <tr>
            <th style={headerCellStyles} scope="col">
              Your Choice / Their Choice
            </th>
            {config.choices.map((choice) => (
              <th
                key={choice.id}
                style={headerCellStyles}
                scope="col"
                aria-label={choice.displayName}
              >
                {choice.emoji} {choice.displayName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {config.choices.map((p1Choice) => (
            <tr key={p1Choice.id}>
              <th style={{ ...dataCellStyles, fontWeight: '600' }} scope="row">
                {p1Choice.emoji} {p1Choice.displayName}
              </th>
              {config.choices.map((p2Choice) => {
                const payoff = config.payoffMatrix[p1Choice.id][p2Choice.id];
                return (
                  <td
                    key={p2Choice.id}
                    style={dataCellStyles}
                    aria-label={`You: ${payoff.p1}, Opponent: ${payoff.p2}`}
                  >
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>You:</div>
                    <div style={{ fontSize: '18px', fontWeight: '600' }}>
                      {payoff.p1 > 0 ? '+' : ''}{payoff.p1}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                      Them:
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '600' }}>
                      {payoff.p2 > 0 ? '+' : ''}{payoff.p2}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

**PATTERN**: Adapted from `src/features/game/components/PayoffMatrix.tsx`
**CRITICAL**: Use nested loops to generate matrix from config.payoffMatrix
**DYNAMIC**: Supports any number of choices (2x2, 3x3, 4x4, etc.)
**PLACEMENT**: `src/framework/components/DynamicPayoffMatrix.tsx`

**VALIDATE**:
```bash
npm run type-check
npm run dev  # Check components render correctly
```

---

### Phase 6: Integration & Testing

**Objective**: Wire everything together and validate end-to-end

#### Task 6.1: CREATE useConfigLoader Hook

**CREATE** `src/framework/hooks/useConfigLoader.ts`:
```typescript
import { useState, useEffect } from 'react';
import { GameConfig } from '../core/config/types';
import { loadGameConfig, ConfigLoaderError } from '../core/config/loader';

export interface UseConfigLoaderResult {
  config: GameConfig | null;
  isLoading: boolean;
  error: Error | null;
}

export function useConfigLoader(configPath: string): UseConfigLoaderResult {
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadConfig() {
      try {
        setIsLoading(true);
        setError(null);

        const loadedConfig = await loadGameConfig(configPath);

        if (isMounted) {
          setConfig(loadedConfig);
        }
      } catch (err) {
        if (isMounted) {
          const error = err instanceof Error ? err : new Error('Failed to load config');
          setError(error);
          console.error('Config loading error:', error);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadConfig();

    return () => {
      isMounted = false;
    };
  }, [configPath]);

  return {
    config,
    isLoading,
    error,
  };
}
```

**PATTERN**: Follow `src/features/game/hooks/useURLState.ts` async loading pattern
**CRITICAL**: Use cleanup function to prevent state updates after unmount
**PLACEMENT**: `src/framework/hooks/useConfigLoader.ts`

#### Task 6.2: MODIFY App.tsx to Use Framework

**MODIFY** `src/App.tsx`:

Replace game-specific logic with framework components:

```typescript
import { useConfigLoader } from './framework/hooks/useConfigLoader';
import { DynamicChoiceBoard } from './framework/components/DynamicChoiceBoard';
import { DynamicPayoffMatrix } from './framework/components/DynamicPayoffMatrix';

function App(): ReactElement {
  // Load game config
  const { config, isLoading: configLoading, error: configError } = useConfigLoader(
    '../../games/configs/prisoners-dilemma.yaml'
  );

  // Existing hooks
  const { urlGameState, isLoading, error: urlError, generateURL } = useURLState();
  const { gameState, initializeGame, makeChoice, resetGame, loadGame } = useGameEngine(config);

  // ... rest of existing logic

  if (configLoading) {
    return <LoadingSpinner message="Loading game configuration..." />;
  }

  if (configError) {
    return (
      <ErrorDisplay
        title="Configuration Error"
        message={configError.message}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!config) {
    return <ErrorDisplay title="No Config" message="Game configuration not found" />;
  }

  // ... rest of existing rendering with dynamic components

  return (
    <div>
      <DynamicChoiceBoard
        config={config}
        onChoice={handleChoice}
        disabled={isWaitingForOpponent}
        currentRound={gameState.currentRound}
      />
      <DynamicPayoffMatrix config={config} />
    </div>
  );
}
```

**PATTERN**: Follow existing `src/App.tsx` multi-hook composition
**CRITICAL**: Load config before rendering game
**PROGRESSIVE**: Show loading states for config, URL, history

#### Task 6.3: CREATE Integration Tests

**CREATE** `src/framework/integration/configDriven.integration.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { loadGameConfig } from '../core/config/loader';
import { calculatePayoff } from '../core/engine/payoffEngine';
import { generateGameStateSchema } from '../core/schemas/schemaGenerator';

describe('Config-Driven Framework Integration', () => {
  it('should load and validate Prisoner\'s Dilemma config', async () => {
    const config = await loadGameConfig('../../games/configs/prisoners-dilemma.yaml');

    expect(config.gameId).toBe('prisoners-dilemma');
    expect(config.choices).toHaveLength(2);
    expect(config.roundCount).toBe(5);
  });

  it('should calculate payoffs from config', async () => {
    const config = await loadGameConfig('../../games/configs/prisoners-dilemma.yaml');

    const result = calculatePayoff(config, 'silent', 'talk');

    expect(result).toEqual({ p1Score: 0, p2Score: 5 });
  });

  it('should generate valid Zod schemas from config', async () => {
    const config = await loadGameConfig('../../games/configs/prisoners-dilemma.yaml');

    const { ChoiceSchema } = generateGameStateSchema(config);

    expect(() => ChoiceSchema.parse('silent')).not.toThrow();
    expect(() => ChoiceSchema.parse('invalid')).toThrow();
  });

  it('should support Rock Paper Scissors config', async () => {
    const config = await loadGameConfig('../../games/configs/rock-paper-scissors.yaml');

    expect(config.gameId).toBe('rock-paper-scissors');
    expect(config.choices).toHaveLength(3);

    const result = calculatePayoff(config, 'rock', 'scissors');
    expect(result).toEqual({ p1Score: 1, p2Score: -1 });
  });
});
```

**PATTERN**: Follow existing test patterns in `src/features/game/integration/`
**COVERAGE**: Test config loading, payoff calculation, schema generation
**PLACEMENT**: `src/framework/integration/configDriven.integration.test.ts`

**VALIDATE**:
```bash
npm run test -- integration
```

---

### Phase 7: Deployment Infrastructure

**Objective**: GitHub Actions workflow with test gates

#### Task 7.1: CREATE GitHub Actions Workflow

**CREATE** `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npm run type-check

      - name: Run unit tests
        run: npm run test

      - name: Run integration tests
        run: npm run test -- integration

  build-deploy:
    needs: test
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build project
        run: npm run build
        env:
          NODE_ENV: production

      - name: Configure Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**PATTERN**: Follow `PRPs/configurable-game-framework-prd.md` lines 1739-1801
**CRITICAL**: Test job must pass before deployment
**GATES**: Lint → Type Check → Unit Tests → Integration Tests → Build → Deploy
**PLACEMENT**: `.github/workflows/deploy.yml`

#### Task 7.2: UPDATE Vite Config for GitHub Pages

**MODIFY** `vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import ViteYaml from '@modyfi/vite-plugin-yaml';

export default defineConfig({
  plugins: [react(), ViteYaml()],

  // GitHub Pages base path
  base: process.env.NODE_ENV === 'production'
    ? '/correspondence-games/'  // UPDATE with actual repo name
    : '/',

  build: {
    outDir: 'dist',
    sourcemap: true,

    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'crypto-vendor': ['crypto-js', 'lz-string'],
          'framework-core': [
            './src/framework/core/config/loader',
            './src/framework/core/engine/payoffEngine',
            './src/framework/core/engine/turnEngine',
          ],
        },
      },
    },
  },

  server: {
    port: 3000,
    open: true,
  },
});
```

**PATTERN**: Follow PRD specification lines 1808-1840
**CRITICAL**: base path must match GitHub repository name exactly
**OPTIMIZATION**: Code splitting by vendor and framework modules
**GOTCHA**: Only set base path in production (not development)

**VALIDATE**:
```bash
npm run build
npm run preview  # Test production build locally
```

---

## Validation Loop

### Level 1: Syntax & Style (After Each File)

```bash
# Run after creating each TypeScript file
npm run type-check
npm run lint
npm run format

# Expected: Zero errors before proceeding to next file
```

### Level 2: Unit Tests (After Each Phase)

```bash
# Phase 1: Config loading
npm run test -- loader

# Phase 2: Schema generation
npm run test -- schemas

# Phase 3: Game engine
npm run test -- engine

# Phase 4: Security
npm run test -- checksum
npm run test -- hmac

# Phase 5: Components
npm run test -- components

# Expected: All tests pass for each phase
```

### Level 3: Integration Testing (After Phase 6)

```bash
# Start dev server
npm run dev

# Manual Testing Checklist:
# 1. Visit http://localhost:3000
# 2. Check console for config loading
# 3. Verify dynamic UI renders correctly
# 4. Play complete game (5 rounds)
# 5. Share URL and verify in new tab
# 6. Check localStorage in DevTools
# 7. Try tampering with URL - should reject

# Automated Integration Tests
npm run test -- integration

# E2E Tests (if implemented)
npm run test:e2e

# Expected: All flows work end-to-end
```

### Level 4: Deployment Validation

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Check build output
ls -lh dist/
# Expected: dist/ contains optimized bundles < 500KB total

# Validate YAML configs included
ls -R dist/games/configs/
# Expected: All YAML files present

# Test production build manually
open http://localhost:4173

# Push to GitHub (triggers deployment)
git push origin main

# Monitor GitHub Actions
# https://github.com/YOUR-USERNAME/correspondence-games/actions

# After deployment, test live site
open https://YOUR-USERNAME.github.io/correspondence-games/

# Expected: Site works identically to local dev
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All validation levels completed successfully
- [ ] Zero TypeScript errors: `npm run type-check`
- [ ] Zero lint errors: `npm run lint`
- [ ] All tests pass: `npm run test`
- [ ] Integration tests pass: `npm run test -- integration`
- [ ] Production build succeeds: `npm run build`
- [ ] GitHub Actions workflow passes

### Feature Validation (Success Criteria)

- [ ] YAML config loads without errors
- [ ] Prisoner's Dilemma game works end-to-end
- [ ] Rock-Paper-Scissors game works end-to-end
- [ ] Matching Pennies game works (create 3rd example)
- [ ] URL length stays < 1800 characters for 5-round games
- [ ] HMAC verification rejects tampered URLs
- [ ] localStorage checksum detects corrupted data
- [ ] Dynamic UI renders correctly from config
- [ ] Payoff matrix displays all choice combinations
- [ ] Theme colors from config apply correctly

### Security Validation

- [ ] HMAC signatures present on all URLs
- [ ] Tampering URL hash triggers error
- [ ] localStorage has SHA-256 checksums
- [ ] Corrupted localStorage resets gracefully
- [ ] All encryption follows existing patterns
- [ ] No sensitive data in console logs (production)

### Code Quality Validation

- [ ] Follows existing codebase patterns
- [ ] File placement matches desired tree structure
- [ ] No hardcoded game-specific logic in framework
- [ ] Reused code from Prisoner's Dilemma where appropriate
- [ ] Custom error classes used consistently
- [ ] TypeScript types are precise (no `any`)
- [ ] React components use proper ARIA attributes

### Documentation & Deployment

- [ ] README.md updated with framework usage
- [ ] games/configs/README.md created with examples
- [ ] Vite base path configured correctly
- [ ] GitHub Pages deploys successfully
- [ ] Deployed site works in production

---

## Anti-Patterns to Avoid

- ❌ Don't hardcode game logic - everything must come from config
- ❌ Don't skip HMAC verification - encryption alone is NOT secure
- ❌ Don't ignore localStorage quota errors - always have fallback
- ❌ Don't use === for HMAC comparison - use constant-time
- ❌ Don't decrypt before HMAC verification - verify first
- ❌ Don't forget to validate Zod schemas after decryption
- ❌ Don't use sync localStorage operations in React render
- ❌ Don't mix CryptoJS and Web Crypto API - use correct tool for each
- ❌ Don't create new patterns when existing ones work
- ❌ Don't skip test validation levels - they catch issues early

---

## Success Metrics

**Confidence Score for One-Pass Implementation**: 9/10

**Reasoning**:
- ✅ Complete file paths with line numbers provided
- ✅ Specific patterns extracted from working Prisoner's Dilemma code
- ✅ Library documentation with exact URLs and sections
- ✅ Security gotchas documented with examples
- ✅ Validation commands verified in codebase
- ✅ Integration points clearly specified
- ⚠️ -1 point: React dynamic rendering complexity may need iteration

**Risk Mitigation**:
- Codebase analysis provides proven patterns to follow
- PRD has complete HMAC implementation specification
- Existing tests provide validation reference
- Phase-by-phase approach allows early error detection

This PRP enables an AI agent to implement the configurable game framework successfully in a single pass by providing comprehensive context, specific patterns, and executable validation gates.
