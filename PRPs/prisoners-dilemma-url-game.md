name: "Prisoner's Dilemma URL-Based Correspondence Game - Complete Implementation"
description: |
  Implement a serverless, URL-based Prisoner's Dilemma game using React 19 + TypeScript + Vite.
  Game state is encrypted and shared via URLs, enabling asynchronous play without servers.

---

## Goal

**Feature Goal**: Create a fully functional Prisoner's Dilemma correspondence game where encrypted game state is shared via URLs, enabling asynchronous strategic gameplay between two players across any communication platform.

**Deliverable**: Complete React application deployable to GitHub Pages with URL-based state management, AES encryption, 5-round gameplay, and social features (messaging, rematches).

**Success Definition**: Players can start a game, make strategic choices, share URLs via any platform, complete 5 rounds with authentic game theory dynamics, and optionally continue with rematch chains.

## User Persona

**Target User**: Educators, students, friends, and game theory enthusiasts who want to explore cooperation vs. competition dynamics through authentic strategic interaction.

**Use Case**: A professor wants to demonstrate game theory concepts to students, or friends want to engage in strategic thinking exercises during asynchronous communication.

**User Journey**:
1. Player 1 visits landing page, learns rules, makes first choice
2. Shares generated URL with Player 2 via text/email/Discord
3. Player 2 clicks URL, makes choice, sees Round 1 results
4. Players alternate making choices and sharing URLs for 5 rounds
5. Final results shown with messaging and rematch options

**Pain Points Addressed**:
- No servers or accounts required for strategic gaming
- Authentic game theory experience without time pressure
- Universal accessibility across all communication platforms
- Educational value through hands-on strategic decision making

## Why

- **Educational Impact**: Makes abstract game theory concepts tangible through authentic strategic interaction
- **Universal Accessibility**: Works on any device/browser without installation or accounts
- **Authentic Dynamics**: Asynchronous play creates genuine trust/betrayal tension
- **Viral Mechanics**: URL sharing enables organic growth and repeated engagement
- **Technical Innovation**: Demonstrates advanced client-side architecture patterns

## What

A single-page React application that encrypts game state in shareable URLs. Players experience authentic Prisoner's Dilemma dynamics through 5 rounds of strategic choices, with results revealed only after both players choose. Includes social features like messaging and rematch chains.

### Success Criteria

- [ ] Complete 5-round gameplay with authentic payoff matrix (3/0/5/1 gold distribution)
- [ ] URL encryption/decryption with AES-256 keeps game state under 1500 characters
- [ ] Mobile-responsive interface with clear payoff matrix display
- [ ] Results revealed only after both players make choices each round
- [ ] Final messaging and rematch functionality
- [ ] Works across all major browsers and devices
- [ ] 80%+ test coverage with comprehensive validation
- [ ] GitHub Pages deployment with CI/CD pipeline
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] URL sharing via copy/clipboard with social media optimization

## All Needed Context

### Context Completeness Check

_"If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_ ✅ YES - This PRP provides complete context including design specs, architectural patterns, validation commands, and specific implementation guidance.

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- url: https://react.dev/blog/2024/04/25/react-19
  why: React 19 new features, Actions API, use() hook, compiler optimizations
  critical: React Compiler eliminates need for manual memoization, new type patterns

- url: https://vitejs.dev/config/
  why: Vite configuration for GitHub Pages deployment and production builds
  critical: Base path configuration, manual chunks, asset optimization patterns

- url: https://github.com/colinhacks/zod
  why: Data validation patterns and TypeScript integration
  critical: Branded types, schema inference, runtime validation patterns

- url: https://github.com/brix/crypto-js
  why: AES encryption implementation for browser environments
  critical: AES.encrypt/decrypt, UTF8 encoding, secure key handling

- url: https://github.com/pieroxy/lz-string
  why: String compression for URL state optimization
  critical: compressToEncodedURIComponent for URL-safe output

- file: /home/ryankhetlyr/Development/correspondence-games/correspondence-pattern.md
  why: Complete URL-based state sharing architecture and patterns
  pattern: Encryption/decryption flow, URL structure, state management
  gotcha: Browser URL length limits, cross-platform sharing considerations

- file: /home/ryankhetlyr/Development/correspondence-games/games/prisoners-dilemma-design-draft.md
  why: Complete game design specification with state schema and UI patterns
  pattern: Game state structure, round progression, user flow diagrams
  gotcha: Asynchronous choice revelation, turn alternation patterns

- file: /home/ryankhetlyr/Development/correspondence-games/claude_md_files/CLAUDE-REACT.md
  why: Comprehensive React 19 development standards and TypeScript requirements
  pattern: Component structure, testing requirements, type safety patterns
  gotcha: MUST use ReactElement (not JSX.Element), strict TypeScript rules

- file: /home/ryankhetlyr/Development/correspondence-games/PRPs/prisoners-dilemma-correspondence-game-prd.md
  why: Technical architecture, component specifications, and integration requirements
  pattern: System architecture, API design, validation strategies
  gotcha: Mobile-first design, performance requirements, security considerations

- docfile: PRPs/ai_docs/react-19-patterns.md
  why: React 19 specific patterns and migration guidance for new features
  section: Actions API, use() hook, Suspense enhancements
```

### Current Codebase Tree

```bash
correspondence-games/
├── CLAUDE.md                     # Project methodology and standards
├── PRPs/                         # Product Requirement Prompts
│   ├── templates/               # PRP templates and patterns
│   ├── ai_docs/                # Curated documentation
│   └── *.md                    # Active PRPs
├── claude_md_files/             # Framework-specific guidance
│   ├── CLAUDE-REACT.md         # React 19 development standards
│   └── CLAUDE-NODE.md          # Node.js patterns (reference)
├── games/                       # Game design documents
│   ├── prisoners-dilemma-design-draft.md  # Complete game specification
│   └── prisoners-dilemma-abstract.txt     # Game mechanics summary
├── correspondence-pattern.md    # URL-based state sharing architecture
└── pyproject.toml              # Python project config (framework)
```

### Desired Codebase Tree with Files to be Added

```bash
correspondence-games/
├── package.json                 # React dependencies and scripts
├── tsconfig.json               # TypeScript strict configuration
├── vite.config.ts              # Vite build and GitHub Pages config
├── index.html                  # Entry point with meta tags
├── src/
│   ├── main.tsx                # React 19 app entry point
│   ├── App.tsx                 # Main application component
│   ├── features/
│   │   └── game/
│   │       ├── __tests__/      # Game component tests
│   │       ├── components/     # Game UI components
│   │       │   ├── GameBoard.tsx
│   │       │   ├── PayoffMatrix.tsx
│   │       │   ├── RoundHistory.tsx
│   │       │   ├── URLSharer.tsx
│   │       │   └── GameResults.tsx
│   │       ├── hooks/          # Game state management hooks
│   │       │   ├── useGameState.ts
│   │       │   ├── useURLState.ts
│   │       │   └── useGameLogic.ts
│   │       ├── schemas/        # Zod validation schemas
│   │       │   └── gameSchema.ts
│   │       ├── types/          # TypeScript type definitions
│   │       │   └── game.ts
│   │       └── utils/          # Game utilities
│   │           ├── encryption.ts
│   │           ├── payoffCalculation.ts
│   │           └── urlGeneration.ts
│   ├── shared/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── hooks/             # Shared custom hooks
│   │   │   └── useClipboard.ts
│   │   └── utils/             # Shared utilities
│   │       └── constants.ts
│   └── test/                  # Test configuration and utilities
│       ├── setup.ts           # Vitest setup
│       └── helpers.ts         # Test helpers
├── .github/
│   └── workflows/
│       └── deploy.yml         # GitHub Pages deployment
└── dist/                      # Build output (generated)
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: React 19 requires ReactElement import, not JSX.Element
import { ReactElement } from 'react';
function Component(): ReactElement { return <div />; }

// CRITICAL: Crypto-JS requires UTF8 encoding for proper string handling
const encrypted = CryptoJS.AES.encrypt(data, key).toString();
const decrypted = CryptoJS.AES.decrypt(encrypted, key).toString(CryptoJS.enc.Utf8);

// CRITICAL: LZ-String compressToEncodedURIComponent for URL safety
const compressed = LZString.compressToEncodedURIComponent(jsonString);

// CRITICAL: Vite requires base path for GitHub Pages deployment
// In vite.config.ts: base: '/repository-name/'

// CRITICAL: URL length must stay under 1500 characters for compatibility
// Use short property names in game state schema

// CRITICAL: Zod schemas must validate ALL external data
const gameState = GameStateSchema.parse(unknownData); // Never trust input

// CRITICAL: React 19 Actions API requires proper async handling
const [state, submitAction, isPending] = useActionState(asyncAction, null);

// CRITICAL: TypeScript exactOptionalPropertyTypes requires conditional spreads
<Component {...(condition ? { optionalProp: value } : {})} />
```

## Implementation Blueprint

### Data Models and Structure

Create type-safe game state models ensuring consistency and validation.

```typescript
// src/features/game/schemas/gameSchema.ts - Zod schemas for runtime validation
import { z } from 'zod';

// Branded types for type safety
const PlayerIdSchema = z.string().min(1).brand<'PlayerId'>();
const GameIdSchema = z.string().uuid().brand<'GameId'>();

const ChoiceSchema = z.enum(['silent', 'talk']);
const GamePhaseSchema = z.enum(['setup', 'playing', 'finished']);

const RoundSchema = z.object({
  roundNumber: z.number().min(1).max(5),
  choices: z.object({
    p1: ChoiceSchema.optional(),
    p2: ChoiceSchema.optional(),
  }),
  results: z.object({
    p1Gold: z.number().min(0),
    p2Gold: z.number().min(0),
  }).optional(),
  isComplete: z.boolean(),
  completedAt: z.string().datetime().optional(),
});

const GameStateSchema = z.object({
  version: z.literal('1.0.0'),
  gameId: GameIdSchema,
  players: z.object({
    p1: PlayerIdSchema,
    p2: PlayerIdSchema,
  }),
  rounds: z.array(RoundSchema).length(5),
  currentRound: z.number().min(0).max(4),
  gamePhase: GamePhaseSchema,
  totals: z.object({
    p1Gold: z.number().min(0),
    p2Gold: z.number().min(0),
  }),
  metadata: z.object({
    createdAt: z.string().datetime(),
    lastMoveAt: z.string().datetime(),
    turnCount: z.number().min(0),
  }),
  socialFeatures: z.object({
    finalMessage: z.object({
      from: z.enum(['p1', 'p2']),
      text: z.string().max(500),
      timestamp: z.string().datetime(),
    }).optional(),
    rematchOffered: z.boolean().optional(),
    rematchGameId: GameIdSchema.optional(),
  }).optional(),
});

// TypeScript types derived from schemas
export type Choice = z.infer<typeof ChoiceSchema>;
export type GamePhase = z.infer<typeof GamePhaseSchema>;
export type Round = z.infer<typeof RoundSchema>;
export type GameState = z.infer<typeof GameStateSchema>;
export type PlayerId = z.infer<typeof PlayerIdSchema>;
export type GameId = z.infer<typeof GameIdSchema>;

export { GameStateSchema, RoundSchema, ChoiceSchema };
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE project configuration files
  - IMPLEMENT: package.json with React 19, TypeScript, Vite, Zod, Crypto-JS, LZ-String
  - IMPLEMENT: tsconfig.json with strict mode, React 19 JSX transform
  - IMPLEMENT: vite.config.ts with GitHub Pages base path and optimization
  - FOLLOW pattern: /home/ryankhetlyr/Development/correspondence-games/claude_md_files/CLAUDE-REACT.md (TypeScript strict config)
  - NAMING: Standard configuration files in project root
  - PLACEMENT: Project root directory

Task 2: CREATE core game schemas and types
  - IMPLEMENT: src/features/game/schemas/gameSchema.ts with complete Zod validation
  - IMPLEMENT: src/features/game/types/game.ts with TypeScript interfaces
  - FOLLOW pattern: CLAUDE-REACT.md (branded types, strict validation)
  - NAMING: PascalCase for types, camelCase for schema exports
  - DEPENDENCIES: Zod library configuration
  - PLACEMENT: Feature-specific schema and type files

Task 3: CREATE encryption and URL utilities
  - IMPLEMENT: src/features/game/utils/encryption.ts with AES encryption/decryption
  - IMPLEMENT: src/features/game/utils/urlGeneration.ts with URL state management
  - FOLLOW pattern: /home/ryankhetlyr/Development/correspondence-games/correspondence-pattern.md (encryption flow)
  - NAMING: camelCase function names, descriptive parameter names
  - DEPENDENCIES: Crypto-JS, LZ-String, game schemas from Task 2
  - PLACEMENT: Game feature utilities

Task 4: CREATE payoff calculation engine
  - IMPLEMENT: src/features/game/utils/payoffCalculation.ts with game logic
  - FOLLOW pattern: /home/ryankhetlyr/Development/correspondence-games/games/prisoners-dilemma-design-draft.md (payoff matrix)
  - NAMING: calculatePayoff, advanceRound, checkGameComplete functions
  - DEPENDENCIES: Game types and schemas from Task 2
  - PLACEMENT: Game feature utilities

Task 5: CREATE core game state hooks
  - IMPLEMENT: src/features/game/hooks/useGameState.ts with React 19 patterns
  - IMPLEMENT: src/features/game/hooks/useURLState.ts with URL parameter management
  - IMPLEMENT: src/features/game/hooks/useGameLogic.ts with game progression logic
  - FOLLOW pattern: CLAUDE-REACT.md (custom hook patterns, ReactElement types)
  - NAMING: use[Feature] naming convention, explicit return types
  - DEPENDENCIES: Schemas, utilities, React 19 hooks
  - PLACEMENT: Game feature hooks directory

Task 6: CREATE shared UI components
  - IMPLEMENT: src/shared/components/Button.tsx with variants and accessibility
  - IMPLEMENT: src/shared/components/ErrorBoundary.tsx with error handling
  - IMPLEMENT: src/shared/components/LoadingSpinner.tsx with loading states
  - FOLLOW pattern: CLAUDE-REACT.md (component documentation, prop types)
  - NAMING: PascalCase component names, descriptive prop interfaces
  - DEPENDENCIES: React 19, TypeScript strict mode
  - PLACEMENT: Shared components directory

Task 7: CREATE game UI components
  - IMPLEMENT: src/features/game/components/PayoffMatrix.tsx with visual matrix
  - IMPLEMENT: src/features/game/components/GameBoard.tsx with choice interface
  - IMPLEMENT: src/features/game/components/RoundHistory.tsx with game history
  - IMPLEMENT: src/features/game/components/URLSharer.tsx with sharing interface
  - IMPLEMENT: src/features/game/components/GameResults.tsx with final results
  - FOLLOW pattern: CLAUDE-REACT.md (component structure, JSDoc documentation)
  - NAMING: PascalCase components, descriptive prop interfaces
  - DEPENDENCIES: Game hooks, shared components, game types
  - PLACEMENT: Game feature components directory

Task 8: CREATE main application components
  - IMPLEMENT: src/App.tsx with routing and state management
  - IMPLEMENT: src/main.tsx with React 19 entry point
  - IMPLEMENT: index.html with meta tags and social sharing optimization
  - FOLLOW pattern: CLAUDE-REACT.md (React 19 patterns, strict TypeScript)
  - NAMING: Standard React application structure
  - DEPENDENCIES: All game components and hooks
  - PLACEMENT: Source root and project root

Task 9: CREATE comprehensive test suite
  - IMPLEMENT: src/test/setup.ts with Vitest configuration
  - IMPLEMENT: src/features/game/__tests__/ with component and hook tests
  - IMPLEMENT: src/shared/__tests__/ with shared component tests
  - FOLLOW pattern: CLAUDE-REACT.md (80% coverage, React Testing Library)
  - NAMING: test files match component names with .test.tsx extension
  - COVERAGE: All public APIs, user interactions, error states
  - PLACEMENT: Co-located tests in __tests__ directories

Task 10: CREATE deployment configuration
  - IMPLEMENT: .github/workflows/deploy.yml with GitHub Actions
  - IMPLEMENT: production build optimization in vite.config.ts
  - FOLLOW pattern: CLAUDE-REACT.md (deployment best practices)
  - NAMING: Standard GitHub Actions workflow naming
  - DEPENDENCIES: All application code and tests
  - PLACEMENT: GitHub workflows directory
```

### Implementation Patterns & Key Details

```typescript
// React 19 component pattern with Actions API
import { ReactElement, useActionState } from 'react';

/**
 * Game choice component using React 19 Actions for state management.
 *
 * @component
 * @example
 * ```tsx
 * <GameChoice
 *   currentRound={2}
 *   onChoice={(choice) => handleChoice(choice)}
 *   disabled={isWaitingForOpponent}
 * />
 * ```
 */
interface GameChoiceProps {
  currentRound: number;
  onChoice: (choice: Choice) => Promise<void>;
  disabled?: boolean;
}

const GameChoice = ({ currentRound, onChoice, disabled = false }: GameChoiceProps): ReactElement => {
  const [state, submitAction, isPending] = useActionState(
    async (previousState: any, formData: FormData) => {
      const choice = formData.get('choice') as Choice;
      const validated = ChoiceSchema.parse(choice);
      await onChoice(validated);
      return { success: true, choice: validated };
    },
    null
  );

  return (
    <form action={submitAction}>
      <fieldset disabled={disabled || isPending}>
        <legend>Round {currentRound} - Your Choice:</legend>
        <button
          name="choice"
          value="silent"
          type="submit"
          aria-label="Stay Silent - Cooperate with your partner"
        >
          Stay Silent
        </button>
        <button
          name="choice"
          value="talk"
          type="submit"
          aria-label="Talk - Defect against your partner"
        >
          Talk
        </button>
      </fieldset>
    </form>
  );
};

// URL state management pattern
const useURLState = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encodedState = params.get('s');

    if (encodedState) {
      try {
        const decrypted = decryptGameState(encodedState);
        const validated = GameStateSchema.parse(decrypted);
        setGameState(validated);
      } catch (error) {
        console.error('Invalid game state in URL:', error);
        // Redirect to new game
      }
    }
  }, []);

  const generateShareURL = useCallback((state: GameState): string => {
    const encrypted = encryptGameState(state);
    return `${window.location.origin}${window.location.pathname}?s=${encrypted}`;
  }, []);

  return { gameState, setGameState, generateShareURL };
};

// Encryption utility pattern
export const encryptGameState = (gameState: GameState): string => {
  // CRITICAL: Follow exact pattern from correspondence-pattern.md
  const json = JSON.stringify(gameState);
  const compressed = LZString.compressToEncodedURIComponent(json);
  const encrypted = CryptoJS.AES.encrypt(compressed, GAME_SECRET).toString();
  return btoa(encrypted);
};

export const decryptGameState = (encoded: string): GameState => {
  const encrypted = atob(encoded);
  const decrypted = CryptoJS.AES.decrypt(encrypted, GAME_SECRET)
    .toString(CryptoJS.enc.Utf8);
  const json = LZString.decompressFromEncodedURIComponent(decrypted);
  return JSON.parse(json);
};
```

### Integration Points

```yaml
GITHUB_PAGES:
  - config: vite.config.ts base path configuration
  - deploy: GitHub Actions workflow with artifact upload
  - domain: Custom domain configuration (optional)

PACKAGE_DEPENDENCIES:
  - react: "^19.0.0"
  - react-dom: "^19.0.0"
  - typescript: "^5.3.0"
  - vite: "^5.0.0"
  - zod: "^3.22.0"
  - crypto-js: "^4.2.0"
  - lz-string: "^1.5.0"

BUILD_OPTIMIZATION:
  - manual chunks: React vendor, crypto vendor separation
  - asset optimization: Image compression, CSS minification
  - bundle analysis: Size monitoring and optimization

ACCESSIBILITY:
  - aria labels: All interactive elements properly labeled
  - keyboard navigation: Full keyboard accessibility
  - screen readers: Semantic HTML and ARIA attributes
  - color contrast: WCAG 2.1 AA compliance
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding
npm run type-check                # TypeScript strict validation
npm run lint                      # ESLint with React 19 rules
npm run format                    # Prettier formatting

# Project-wide validation
npm run lint:fix                  # Auto-fix linting issues
npm run validate                  # Combined type-check + lint + test

# Expected: Zero errors and warnings. Fix all issues before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test each component as it's created
npm test -- src/features/game/components/PayoffMatrix.test.tsx
npm test -- src/features/game/hooks/useGameState.test.ts

# Feature-specific test suites
npm test -- src/features/game/__tests__/
npm test -- src/shared/__tests__/

# Coverage validation (mandatory 80% minimum)
npm run test:coverage
npx vitest --coverage --reporter=verbose

# Expected: All tests pass, 80%+ coverage. Debug and fix any failures.
```

### Level 3: Integration Testing (System Validation)

```bash
# Development server validation
npm run dev &
sleep 5  # Allow startup time

# Manual testing checklist
curl -I http://localhost:5173/  # Verify page loads
curl -I http://localhost:5173/?s=test  # Verify URL parameter handling

# Production build validation
npm run build
npm run preview &
sleep 3
curl -I http://localhost:4173/  # Verify production build

# Build artifact validation
ls -la dist/  # Verify assets generated
du -sh dist/  # Check bundle size

# Expected: Successful builds, functional preview, reasonable bundle size
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Game Logic Validation
# Test complete 5-round game flow manually
# Validate payoff calculations: 3/3, 0/5, 5/0, 1/1 scenarios
# Test URL sharing across different browsers/devices

# Encryption Validation
# Test round-trip encryption/decryption with various game states
# Validate URL length stays under 1500 characters
# Test with corrupted URLs and invalid state data

# Cross-Browser Testing
# Test on Chrome, Firefox, Safari, Edge
# Test mobile responsiveness on iOS/Android
# Validate accessibility with screen readers

# Performance Testing
# Lighthouse audit for performance score
# Bundle size analysis with vite-bundle-analyzer
# Mobile performance testing on slower devices

# Social Sharing Validation
# Test URL sharing via messaging apps
# Validate social media preview meta tags
# Test deep linking and state restoration

# Expected: All manual tests pass, performance metrics met, accessibility compliant
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] TypeScript compiles with zero errors: `npm run type-check`
- [ ] ESLint passes with zero warnings: `npm run lint`
- [ ] All tests pass with 80%+ coverage: `npm run test:coverage`
- [ ] Production build succeeds: `npm run build`
- [ ] Preview deployment functional: `npm run preview`

### Feature Validation

- [ ] Complete 5-round gameplay implemented and tested
- [ ] URL encryption/decryption working with state under 1500 characters
- [ ] Payoff matrix displays correctly with all scenarios (3/3, 0/5, 5/0, 1/1)
- [ ] Round history shows complete game progression
- [ ] URL sharing functionality with clipboard integration
- [ ] Final messaging and rematch features working
- [ ] Mobile-responsive design tested on multiple devices
- [ ] Cross-browser compatibility verified (Chrome, Firefox, Safari, Edge)

### Code Quality Validation

- [ ] All components documented with JSDoc and examples
- [ ] Component files under 200 lines each
- [ ] Functions have single responsibility and clear names
- [ ] Zod schemas validate all external data inputs
- [ ] Error states handled gracefully with user-friendly messages
- [ ] Loading states implemented for async operations
- [ ] Accessibility compliance verified (WCAG 2.1 AA)

### Deployment & Performance

- [ ] GitHub Pages deployment working via Actions
- [ ] Social media meta tags optimized for sharing
- [ ] Lighthouse performance score > 90
- [ ] Bundle size optimized with appropriate chunks
- [ ] Error monitoring and graceful degradation implemented

---

## Anti-Patterns to Avoid

- ❌ Don't use `any` type - use specific types or `unknown` with validation
- ❌ Don't skip Zod validation for external data - always validate URL parameters and user inputs
- ❌ Don't ignore test coverage - maintain 80% minimum across all components
- ❌ Don't use `JSX.Element` - use `ReactElement` for React 19 compatibility
- ❌ Don't hardcode game constants - use configuration files and environment variables
- ❌ Don't skip accessibility attributes - include ARIA labels and semantic HTML
- ❌ Don't ignore mobile experience - design mobile-first with responsive breakpoints
- ❌ Don't trust URL parameters - always decrypt and validate game state
- ❌ Don't exceed URL length limits - monitor compressed state size continuously
- ❌ Don't skip error boundaries - handle all error states gracefully