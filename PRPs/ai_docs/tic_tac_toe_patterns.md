# Tic-Tac-Toe Implementation Patterns & Best Practices

Research compiled for implementing Tic-Tac-Toe as a correspondence game with React, TypeScript, localStorage, and URL-based state sharing.

---

## TOPIC: Win Detection Algorithms

### BEST_PRACTICES

- **practice**: Use predefined winning combinations array for O(1) checking
  - source_url: https://stackoverflow.com/questions/1056316/algorithm-for-determining-tic-tac-toe-game-over
  - code_example:
    ```typescript
    const WIN_PATTERNS = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    function checkWin(board: string[], player: string): boolean {
      return WIN_PATTERNS.some(pattern =>
        pattern.every(index => board[index] === player)
      );
    }
    ```
  - why_critical: Only 8 win patterns exist - checking all is faster than dynamic detection. Since there are only 255,168 possible games total, exhaustive checking is optimal.

- **practice**: Check for winner ONLY after a move is made, not on every render
  - source_url: https://stackoverflow.com/questions/1056316/algorithm-for-determining-tic-tac-toe-game-over
  - why_critical: Soonest a player can win is turn 5 (5th square marked). Don't run expensive checks before it's possible.

- **practice**: Check win condition BEFORE draw condition
  - source_url: https://stackoverflow.com/questions/27812213/java-determining-a-tie-in-tic-tac-toe
  - code_example:
    ```typescript
    // CORRECT order:
    const winResult = checkWinCondition(board, player);
    if (winResult.won) {
      return { status: 'won', winner: player };
    }

    // ONLY then check draw
    if (board.every(cell => cell !== null)) {
      return { status: 'draw' };
    }
    ```
  - why_critical: Turn 9 can create both a win and full board - win must take precedence.

- **practice**: Store winning pattern indices for UI highlighting
  - source_url: https://react.dev/learn/tutorial-tic-tac-toe
  - code_example:
    ```typescript
    interface WinResult {
      won: boolean;
      pattern: number[] | null; // [0, 4, 8] for diagonal
      name: string | null;      // "Top-left to Bottom-right"
    }
    ```
  - why_critical: Allows highlighting the winning line in the UI - common UX improvement often overlooked.

### ALGORITHMS

- **name**: Predefined Patterns with Array.some()
  - approach: Store all 8 winning patterns, iterate with .some() to find match
  - complexity: O(1) time (fixed 8 patterns), O(1) space
  - source_url: https://stackoverflow.com/questions/1056316/algorithm-for-determining-tic-tac-toe-game-over
  - implementation_hint: Use TypeScript const assertion for WIN_PATTERNS to ensure type safety

- **name**: Last-Move-Only Checking
  - approach: Only check win patterns that include the last move position (max 4 patterns)
  - complexity: O(1) time, O(1) space
  - source_url: https://cs.stackexchange.com/questions/70563/the-fastest-way-to-check-if-a-move-is-a-winning-move-in-tic-tac-toe
  - implementation_hint: Each cell is only in 4 possible win patterns (row, column, and up to 2 diagonals). For URLs with delta-based updates, this optimization is overkill but technically optimal.

- **name**: Checksum-Based Win Detection (CRITICAL for correspondence games)
  - approach: Calculate checksum of board BEFORE and AFTER win detection
  - complexity: O(n) for checksum, but ensures state integrity
  - source_url: Project's delta-based URL architecture (lines 678-961 in tic-tac-toe-prd.md)
  - implementation_hint:
    ```typescript
    // After detecting win, verify board integrity
    const winResult = checkWinCondition(newBoard, player, config);
    const newChecksum = calculateBoardChecksum(newBoard);

    if (winResult.won) {
      // Store both winner AND checksum for verification
      return {
        winner: player,
        winningPattern: winResult.pattern,
        checksum: newChecksum
      };
    }
    ```

### GOTCHAS

- **issue**: Not handling the "Cat's Game" (draw) condition
  - source_url: https://github.com/reactjs/react.dev/issues/6966
  - solution: Check `board.every(cell => cell !== null)` AND no winner detected. This is the most commonly missed edge case in React implementations.

- **issue**: Continuing to allow moves after a winner is declared
  - source_url: https://stackoverflow.com/questions/39702254/disabling-buttons-after-tic-tac-toe-game-has-ended
  - solution: Set game status to 'won' or 'draw' and check this before allowing moves:
    ```typescript
    if (gameState.status !== 'in-progress') {
      return; // Don't allow moves
    }
    ```

- **issue**: Win detection failing on last turn (turn 9)
  - source_url: https://stackoverflow.com/questions/27812213/java-determining-a-tie-in-tic-tac-toe
  - solution: Always check win BEFORE draw. A full board with 3-in-a-row is a win, not a draw.

- **issue**: Performance bottleneck from checking win on every render
  - source_url: https://www.geeksforgeeks.org/simple-tic-tac-toe-game-using-javascript/
  - solution: Only run win detection inside the move handler (after board update), not in render function.

### REACT_PATTERNS

- **pattern**: Use Array.some() with predefined patterns for declarative code
  - source_url: https://react.dev/learn/tutorial-tic-tac-toe
  - when_to_use: When board state is stored as flat array (0-8 indices). Matches official React tutorial approach.
  - code_example:
    ```typescript
    const winner = WIN_PATTERNS.find(pattern =>
      pattern.every(index => board[index] === board[pattern[0]] && board[index])
    );
    ```

- **pattern**: Memoize win calculation with useMemo
  - source_url: https://react.dev/learn/tutorial-tic-tac-toe
  - when_to_use: If recalculating win state on every render (though checking after moves is better)
  - code_example:
    ```typescript
    const winner = useMemo(() =>
      calculateWinner(board),
      [board]
    );
    ```

### RECOMMENDED_LIBRARIES

None - vanilla JavaScript/TypeScript is sufficient for tic-tac-toe win detection. Adding a library would be overkill.

---

## TOPIC: Board State Management

### BEST_PRACTICES

- **practice**: Use flat array (9 elements) over 2D array for board representation
  - source_url: https://react.dev/learn/tutorial-tic-tac-toe
  - code_example:
    ```typescript
    // PREFERRED: Flat array
    const board = Array(9).fill(null); // [null, null, null, ...]
    board[4] = 'X'; // Center position

    // AVOID: 2D array (harder to index, serialize, and check)
    const board2D = [
      [null, null, null],
      [null, 'X', null],
      [null, null, null]
    ];
    ```
  - why_critical: Easier to serialize to URL, simpler win detection indexing, matches React tutorial conventions.

- **practice**: Store only minimal state - derive the rest
  - source_url: https://react.dev/learn/tutorial-tic-tac-toe
  - code_example:
    ```typescript
    // STORE THIS:
    interface GameState {
      board: (string | null)[];
      currentTurn: number;
      currentPlayer: 1 | 2;
    }

    // DERIVE THIS (don't store):
    const nextPlayer = currentPlayer === 1 ? 2 : 1;
    const isPlayerTurn = currentPlayer === myPlayerId;
    const availableMoves = board.map((cell, i) => cell === null ? i : null).filter(x => x !== null);
    ```
  - why_critical: Reduces URL size for delta-based state sharing. Every stored field increases URL length.

- **practice**: Use immutable state updates with spread operator
  - source_url: https://react.dev/learn/updating-objects-in-state
  - code_example:
    ```typescript
    // CORRECT: Create new array
    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);

    // WRONG: Mutate existing array
    board[index] = 'X'; // React won't detect change
    setBoard(board);
    ```
  - why_critical: React's rendering optimization relies on detecting state changes through reference equality. Mutation breaks this.

- **practice**: Lift state to parent component for board management
  - source_url: https://react.dev/learn/tutorial-tic-tac-toe
  - code_example:
    ```typescript
    // App.tsx or Game.tsx manages state
    const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));

    // Child components receive props
    <Board board={board} onCellClick={handleCellClick} />
    <Square value={board[index]} onClick={() => onCellClick(index)} />
    ```
  - why_critical: Single source of truth prevents state desynchronization. Critical for correspondence games where state must match across players.

- **practice**: Use TypeScript union types for cell values
  - source_url: https://dev.to/baliachbryan/tic-tac-toe-exploring-a-typescript-code-example-1jah
  - code_example:
    ```typescript
    type CellValue = 'X' | 'O' | null;
    type Board = CellValue[];

    // Compile-time safety:
    const board: Board = Array(9).fill(null);
    board[0] = 'X'; // ✅ Valid
    board[1] = 'Q'; // ❌ TypeScript error
    ```
  - why_critical: Prevents invalid board states at compile time, catches bugs before runtime.

### ALGORITHMS

- **name**: Array(9).fill(null) initialization
  - approach: Create flat array of 9 null values for empty board
  - complexity: O(1) time and space
  - source_url: https://react.dev/learn/tutorial-tic-tac-toe
  - implementation_hint: More efficient than Array.from() or map

- **name**: Index-based position mapping
  - approach: Map 2D grid positions to 1D array indices
  - complexity: O(1) access time
  - source_url: https://stackoverflow.com/questions/26964025/making-a-tic-tac-toe-board-in-html-css-or-javascript
  - implementation_hint:
    ```typescript
    // Grid to index: row * 3 + col
    // Index to grid: { row: Math.floor(i / 3), col: i % 3 }

    const positionToIndex = (row: number, col: number) => row * 3 + col;
    const indexToPosition = (i: number) => ({
      row: Math.floor(i / 3),
      col: i % 3
    });
    ```

### GOTCHAS

- **issue**: Using 2D array makes win detection more complex
  - source_url: https://stackoverflow.com/questions/26964025/making-a-tic-tac-toe-board-in-html-css-or-javascript
  - solution: Use flat array for storage, derive 2D positions when needed for UI

- **issue**: Storing derived state (like availableMoves) causes desync
  - source_url: https://react.dev/learn/tutorial-tic-tac-toe
  - solution: Calculate derived values from board state, don't store them

- **issue**: Not resetting board state when starting new game
  - source_url: https://www.geeksforgeeks.org/simple-tic-tac-toe-game-using-javascript/
  - solution: Explicitly reset to `Array(9).fill(null)` on game restart

- **issue**: State updates not triggering re-renders due to mutation
  - source_url: https://react.dev/learn/updating-objects-in-state
  - solution: Always create new array with spread operator or .slice()

### REACT_PATTERNS

- **pattern**: useState with lazy initialization for board
  - source_url: https://react.dev/learn/tutorial-tic-tac-toe
  - when_to_use: When initializing from URL or localStorage
  - code_example:
    ```typescript
    const [board, setBoard] = useState<Board>(() => {
      // Only runs once on mount
      const saved = localStorage.getItem('ttt-board');
      return saved ? JSON.parse(saved) : Array(9).fill(null);
    });
    ```

- **pattern**: Controlled components for board cells
  - source_url: https://react.dev/learn/tutorial-tic-tac-toe
  - when_to_use: Always - maintains single source of truth
  - code_example:
    ```typescript
    function Square({ value, onClick, disabled }: SquareProps) {
      return (
        <button onClick={onClick} disabled={disabled || value !== null}>
          {value}
        </button>
      );
    }
    ```

- **pattern**: useCallback for cell click handler
  - source_url: https://react.dev/learn/tutorial-tic-tac-toe
  - when_to_use: Prevents unnecessary re-renders of Square components
  - code_example:
    ```typescript
    const handleCellClick = useCallback((index: number) => {
      if (board[index] || winner) return;

      const newBoard = [...board];
      newBoard[index] = currentPlayer;
      setBoard(newBoard);
    }, [board, currentPlayer, winner]);
    ```

### RECOMMENDED_LIBRARIES

- **library**: use-immer
  - url: https://github.com/immerjs/use-immer
  - why_useful: Simplifies immutable updates for complex nested state (though not needed for flat board array)
  - integration:
    ```typescript
    import { useImmer } from 'use-immer';

    const [board, updateBoard] = useImmer<Board>(Array(9).fill(null));

    // Simpler syntax (but overkill for tic-tac-toe):
    updateBoard(draft => {
      draft[index] = 'X';
    });
    ```

---

## TOPIC: Turn Management & Player State

### BEST_PRACTICES

- **practice**: Store currentPlayer in state, calculate nextPlayer on-demand
  - source_url: https://react.dev/learn/tutorial-tic-tac-toe
  - code_example:
    ```typescript
    const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);

    // After move:
    setCurrentPlayer(prev => prev === 1 ? 2 : 1);

    // Or extract to function:
    const getNextPlayer = (player: 1 | 2): 1 | 2 => player === 1 ? 2 : 1;
    ```
  - why_critical: Clear turn tracking prevents "out of turn" moves. Essential for correspondence games.

- **practice**: Track turn number separately from player
  - source_url: https://medium.com/@drewisatlas/how-i-made-a-turn-based-game-in-react-part-2-turn-based-logic-9ddd84af5f7
  - code_example:
    ```typescript
    interface GameState {
      currentTurn: number;      // 1-9
      currentPlayer: 1 | 2;     // Whose turn
      moves: Move[];            // History
    }

    // Validation:
    if (urlDelta.move.turn !== gameState.currentTurn) {
      throw new Error('Turn mismatch - out of sync');
    }
    ```
  - why_critical: Turn number enables checksum verification and out-of-sync detection in delta-based URLs.

- **practice**: Determine player role from URL state (not hardcode)
  - source_url: Project's correspondence pattern (correspondence-pattern.md)
  - code_example:
    ```typescript
    function getPlayerFromURL(urlState: URLState | null): 1 | 2 {
      if (!urlState) {
        return 1; // Starting new game = Player 1 (X)
      }

      // Opening opponent's URL = you're the next player
      return urlState.currentPlayer === 1 ? 2 : 1;
    }
    ```
  - why_critical: Allows same codebase to render both player perspectives from URL.

- **practice**: Use Finite State Machine (FSM) pattern for game states
  - source_url: https://gameprogrammingpatterns.com/state.html
  - code_example:
    ```typescript
    type GameStatus = 'in-progress' | 'won' | 'draw';

    // Valid transitions:
    // in-progress → won (when 3-in-a-row detected)
    // in-progress → draw (when board full, no winner)
    // won/draw → in-progress (when new game started)

    function transitionGameState(
      current: GameStatus,
      event: 'move' | 'win' | 'draw' | 'reset'
    ): GameStatus {
      // FSM logic here
    }
    ```
  - why_critical: Prevents invalid state transitions (like moving after game ended).

### ALGORITHMS

- **name**: Alternating turn calculation
  - approach: Toggle player 1 ↔ 2 after each move
  - complexity: O(1)
  - source_url: https://react.dev/learn/tutorial-tic-tac-toe
  - implementation_hint: `nextPlayer = 3 - currentPlayer` is clever but less readable than ternary

- **name**: Turn-based state validation
  - approach: Verify URL turn number matches expected next turn
  - complexity: O(1)
  - source_url: Project's PRD (lines 786-854 in tic-tac-toe-prd.md)
  - implementation_hint:
    ```typescript
    if (delta.move.turn !== currentState.currentTurn + 1) {
      throw new Error('Invalid turn sequence');
    }
    ```

### GOTCHAS

- **issue**: Not disabling board when game is over
  - source_url: https://stackoverflow.com/questions/39702254/disabling-buttons-after-tic-tac-toe-game-has-ended
  - solution: Check game status before allowing moves. Disable all cells when status is 'won' or 'draw'.

- **issue**: Allowing player to make move when it's opponent's turn
  - source_url: https://medium.com/@drewisatlas/how-i-made-a-turn-based-game-in-react-part-2-turn-based-logic-9ddd84af5f7
  - solution: Validate current player matches expected player from state:
    ```typescript
    if (urlState.currentPlayer !== myPlayerId) {
      alert("Not your turn!");
      return;
    }
    ```

- **issue**: Turn counter getting out of sync between players
  - source_url: Project's delta-based checksum approach
  - solution: Include turn number in delta URL and verify on load. Mismatch = desync.

### REACT_PATTERNS

- **pattern**: useReducer for complex turn management
  - source_url: https://react.dev/reference/react/useReducer
  - when_to_use: When turn logic involves multiple state updates
  - code_example:
    ```typescript
    type Action =
      | { type: 'MAKE_MOVE', payload: { index: number } }
      | { type: 'END_GAME', payload: { winner: 1 | 2 | null } }
      | { type: 'RESET' };

    function gameReducer(state: GameState, action: Action): GameState {
      switch (action.type) {
        case 'MAKE_MOVE':
          return {
            ...state,
            board: updateBoard(state.board, action.payload.index),
            currentTurn: state.currentTurn + 1,
            currentPlayer: getNextPlayer(state.currentPlayer)
          };
        // ... other cases
      }
    }

    const [state, dispatch] = useReducer(gameReducer, initialState);
    ```

- **pattern**: Custom useGameState hook
  - source_url: Project's framework hooks (useGameState.ts)
  - when_to_use: Encapsulate all game state logic in reusable hook
  - code_example:
    ```typescript
    function useGameState(initialState?: GameState) {
      const [state, setState] = useState<GameState>(initialState || defaultState);

      const makeMove = useCallback((position: number) => {
        // Move logic + validation
      }, [state]);

      const reset = useCallback(() => {
        setState(defaultState);
      }, []);

      return { state, makeMove, reset };
    }
    ```

### RECOMMENDED_LIBRARIES

- **library**: zustand (with persist middleware)
  - url: https://github.com/pmndrs/zustand
  - why_useful: Simpler than Redux for turn-based game state, includes localStorage persistence
  - integration:
    ```typescript
    import create from 'zustand';
    import { persist } from 'zustand/middleware';

    const useGameStore = create(
      persist(
        (set) => ({
          board: Array(9).fill(null),
          currentPlayer: 1,
          makeMove: (index) => set((state) => ({
            board: [...state.board].map((v, i) => i === index ? state.currentPlayer : v),
            currentPlayer: state.currentPlayer === 1 ? 2 : 1
          }))
        }),
        { name: 'ttt-game-storage' }
      )
    );
    ```

---

## TOPIC: localStorage Integration & URL State Sharing

### BEST_PRACTICES

- **practice**: Use custom useLocalStorage hook for game state persistence
  - source_url: https://blog.logrocket.com/using-localstorage-react-hooks/
  - code_example:
    ```typescript
    function useLocalStorage<T>(key: string, defaultValue: T) {
      const [value, setValue] = useState<T>(() => {
        // Lazy initialization - only runs once
        if (typeof window === 'undefined') return defaultValue;

        try {
          const saved = localStorage.getItem(key);
          return saved !== null ? JSON.parse(saved) : defaultValue;
        } catch (error) {
          console.error(`Error loading localStorage key "${key}":`, error);
          return defaultValue;
        }
      });

      useEffect(() => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
          console.error(`Error saving localStorage key "${key}":`, error);
        }
      }, [key, value]);

      return [value, setValue] as const;
    }

    // Usage:
    const [gameState, setGameState] = useLocalStorage<GameState>('ttt-game', initialState);
    ```
  - why_critical: Survives page refreshes, provides offline-first experience. Essential for correspondence games.

- **practice**: Sync localStorage with URL state using checksums
  - source_url: https://cgarethc.medium.com/syncing-browser-local-storage-with-react-state-and-the-browser-url-in-a-spa-cd97adb10edc
  - code_example:
    ```typescript
    // Project's delta-based approach (PRD lines 678-961)
    interface URLDelta {
      gameId: string;
      move: { player: 1 | 2; position: string; turn: number };
      prevChecksum: string;  // Expected before move
      newChecksum: string;   // Expected after move
      hmac: string;
    }

    // On URL load:
    const currentState = loadGameState(delta.gameId);
    if (calculateChecksum(currentState.board) !== delta.prevChecksum) {
      throw new Error('Board state mismatch - out of sync');
    }
    ```
  - why_critical: Detects out-of-sync states between players. Critical for anti-cheat in correspondence games.

- **practice**: Always wrap localStorage operations in try-catch
  - source_url: https://mmazzarolo.com/blog/2022-06-25-local-storage-status/
  - code_example:
    ```typescript
    function isQuotaExceededError(err: unknown): boolean {
      return (
        err instanceof DOMException &&
        (err.code === 22 ||           // Most browsers
         err.code === 1014 ||          // Firefox
         err.name === "QuotaExceededError")
      );
    }

    try {
      localStorage.setItem(key, value);
    } catch (error) {
      if (isQuotaExceededError(error)) {
        console.error('localStorage quota exceeded');
        // Implement cleanup strategy
      }
    }
    ```
  - why_critical: localStorage can fail (quota exceeded, private browsing, disabled). Must handle gracefully.

- **practice**: Use namespaced keys to prevent conflicts
  - source_url: https://blog.logrocket.com/using-localstorage-react-hooks/
  - code_example:
    ```typescript
    const APP_PREFIX = 'ttt_';
    const STORAGE_KEYS = {
      GAME_STATE: `${APP_PREFIX}game_state`,
      CHOICE_LOCK: `${APP_PREFIX}choice_lock`,
      CHECKSUM: `${APP_PREFIX}checksum`
    } as const;

    localStorage.setItem(STORAGE_KEYS.GAME_STATE, jsonData);
    ```
  - why_critical: Prevents conflicts with other apps on same domain. Enables cleanup.

- **practice**: Store only essential data, derive the rest
  - source_url: Project's localStorage patterns (localStorage-react-patterns-2024-2025.md)
  - why_critical: localStorage has 5-10MB limit. Keep minimal state (board + turn + checksum).

### ALGORITHMS

- **name**: Delta-based URL encoding (CRITICAL for correspondence games)
  - approach: URLs contain only last move + checksums, not full board state
  - complexity: O(1) encoding, 70-80% smaller URLs than full state
  - source_url: Project's PRD (lines 642-961 in tic-tac-toe-prd.md)
  - implementation_hint:
    ```typescript
    import LZString from 'lz-string';

    interface URLDelta {
      gameId: string;
      move: { player: 1 | 2; position: string; turn: number };
      prevChecksum: string;
      newChecksum: string;
      hmac: string;
    }

    function encodeURLDelta(delta: URLDelta): string {
      const json = JSON.stringify(delta);
      const compressed = LZString.compressToEncodedURIComponent(json);
      return `#${compressed}`;
    }

    function decodeURLDelta(hash: string): URLDelta {
      const compressed = hash.slice(1); // Remove '#'
      const json = LZString.decompressFromEncodedURIComponent(compressed);
      return JSON.parse(json);
    }
    ```

- **name**: SHA-256 checksum for board state verification
  - approach: Hash board array to detect tampering and out-of-sync states
  - complexity: O(n) where n = board size (trivial for 9 cells)
  - source_url: Project's checksumManager (PRD lines 678-707)
  - implementation_hint:
    ```typescript
    import CryptoJS from 'crypto-js';

    function calculateBoardChecksum(board: (string | null)[]): string {
      const canonical = JSON.stringify({ board });
      return CryptoJS.SHA256(canonical).toString();
    }

    function verifyBoardChecksum(board: (string | null)[], expected: string): boolean {
      return calculateBoardChecksum(board) === expected;
    }
    ```

- **name**: HMAC for URL tamper detection
  - approach: Sign URL delta with secret to prevent modification
  - complexity: O(1)
  - source_url: Project's hmacManager
  - implementation_hint:
    ```typescript
    function generateHMAC(delta: Omit<URLDelta, 'hmac'>, secret: string): string {
      const payload = JSON.stringify(delta);
      return CryptoJS.HmacSHA256(payload, secret).toString();
    }

    function verifyHMAC(delta: URLDelta, secret: string): boolean {
      const { hmac, ...payload } = delta;
      const expected = generateHMAC(payload, secret);
      return hmac === expected;
    }
    ```

### GOTCHAS

- **issue**: localStorage.setItem() stores everything as strings
  - source_url: https://blog.logrocket.com/using-localstorage-react-hooks/
  - solution: Always use JSON.stringify/JSON.parse for objects/arrays:
    ```typescript
    // WRONG:
    localStorage.setItem('board', board); // Stores "[object Object]"

    // CORRECT:
    localStorage.setItem('board', JSON.stringify(board));
    const board = JSON.parse(localStorage.getItem('board'));
    ```

- **issue**: storage event doesn't fire in same tab that made the change
  - source_url: https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event
  - solution: Manually dispatch custom event for same-tab sync:
    ```typescript
    localStorage.setItem(key, value);
    window.dispatchEvent(new Event('local-storage')); // Custom event
    ```

- **issue**: Hydration mismatches in SSR (if using Next.js)
  - source_url: https://stackoverflow.com/questions/78554615/how-to-handle-local-storage-with-nextjs-ssr
  - solution: Load from localStorage in useEffect, not during render:
    ```typescript
    const [gameState, setGameState] = useState<GameState | null>(null);

    useEffect(() => {
      const saved = localStorage.getItem('ttt-game');
      if (saved) setGameState(JSON.parse(saved));
    }, []);
    ```

- **issue**: URL too long when encoding full game state
  - source_url: Project's correspondence pattern
  - solution: Use delta-based URLs (only last move + checksums). 70-80% smaller than full state.

- **issue**: Private browsing mode blocks localStorage
  - source_url: https://mmazzarolo.com/blog/2022-06-25-local-storage-status/
  - solution: Detect and fallback to sessionStorage or in-memory state:
    ```typescript
    function isStorageSupported(): boolean {
      try {
        const test = '__test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch {
        return false;
      }
    }
    ```

### REACT_PATTERNS

- **pattern**: useSyncExternalStore for localStorage (React 18+)
  - source_url: https://www.56kode.com/posts/using-usesyncexternalstore-with-localstorage/
  - when_to_use: React 18+ concurrent rendering with localStorage
  - code_example:
    ```typescript
    import { useSyncExternalStore } from 'react';

    const getSnapshot = () => {
      return localStorage.getItem('ttt-game') || 'null';
    };

    const subscribe = (callback: () => void) => {
      window.addEventListener('storage', callback);
      return () => window.removeEventListener('storage', callback);
    };

    const gameStateJson = useSyncExternalStore(subscribe, getSnapshot);
    const gameState = JSON.parse(gameStateJson);
    ```

- **pattern**: Custom hook combining localStorage + URL state
  - source_url: https://cgarethc.medium.com/syncing-browser-local-storage-with-react-state-and-the-browser-url-in-a-spa-cd97adb10edc
  - when_to_use: Correspondence games with URL-based state sharing
  - code_example:
    ```typescript
    function useGameStateWithURL(gameId: string) {
      const [state, setState] = useLocalStorage<GameState>(`ttt-${gameId}`, defaultState);

      useEffect(() => {
        const hash = window.location.hash.slice(1);
        if (hash) {
          const delta = decodeURLDelta(hash);

          // Verify and apply delta
          if (verifyHMAC(delta, SECRET) && verifyChecksum(state.board, delta.prevChecksum)) {
            applyDelta(state, delta);
          }
        }
      }, []);

      return [state, setState] as const;
    }
    ```

### RECOMMENDED_LIBRARIES

- **library**: LZ-String
  - url: https://github.com/pieroxy/lz-string
  - why_useful: Compress JSON before URL encoding - reduces URL length by 60-70%
  - integration:
    ```typescript
    import LZString from 'lz-string';

    const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(gameState));
    window.location.hash = compressed;

    const decompressed = LZString.decompressFromEncodedURIComponent(hash);
    const gameState = JSON.parse(decompressed);
    ```

- **library**: crypto-js
  - url: https://github.com/brix/crypto-js
  - why_useful: HMAC and SHA-256 for URL tamper detection and checksums
  - integration:
    ```typescript
    import CryptoJS from 'crypto-js';

    const checksum = CryptoJS.SHA256(JSON.stringify(board)).toString();
    const hmac = CryptoJS.HmacSHA256(deltaPayload, SECRET_KEY).toString();
    ```

- **library**: usehooks-ts (useLocalStorage hook)
  - url: https://usehooks-ts.com/react-hook/use-local-storage
  - why_useful: Production-ready localStorage hook with SSR support, custom serialization
  - integration:
    ```typescript
    import { useLocalStorage } from 'usehooks-ts';

    const [gameState, setGameState, removeGameState] = useLocalStorage<GameState>(
      'ttt-game',
      defaultState,
      {
        serializer: JSON.stringify,
        deserializer: JSON.parse
      }
    );
    ```

---

## TOPIC: Validation & Anti-Cheat

### BEST_PRACTICES

- **practice**: Lock choice in localStorage after move submission
  - source_url: Project's choiceLockManager (verify-storage-and-anti-cheat-task.md)
  - code_example:
    ```typescript
    interface ChoiceLock {
      gameId: string;
      turn: number;
      player: 1 | 2;
      choiceId: string; // 'pos-4'
      timestamp: string;
    }

    function lockChoice(lock: ChoiceLock): void {
      const key = `choice-lock-${lock.gameId}-t${lock.turn}-p${lock.player}`;
      localStorage.setItem(key, JSON.stringify(lock));
    }

    function validateChoice(gameId: string, turn: number, player: 1 | 2, choiceId: string): void {
      const key = `choice-lock-${gameId}-t${turn}-p${player}`;
      const existing = localStorage.getItem(key);

      if (existing) {
        const lock = JSON.parse(existing);
        if (lock.choiceId !== choiceId) {
          throw new Error(`Choice already locked to ${lock.choiceId}`);
        }
      }
    }
    ```
  - why_critical: Prevents player from using browser back button to change move after seeing opponent's response.

- **practice**: Validate move before applying (occupied position check)
  - source_url: https://stackoverflow.com/questions/1056316/algorithm-for-determining-tic-tac-toe-game-over
  - code_example:
    ```typescript
    function validateMove(position: number, board: Board): ValidationResult {
      if (position < 0 || position > 8) {
        return { valid: false, error: 'Invalid position' };
      }

      if (board[position] !== null) {
        return { valid: false, error: 'Position already occupied' };
      }

      return { valid: true };
    }
    ```
  - why_critical: Prevents invalid moves that could corrupt game state.

- **practice**: Use HMAC to detect URL tampering
  - source_url: Project's hmacManager and PRD (lines 766-799)
  - code_example:
    ```typescript
    function verifyURLIntegrity(delta: URLDelta, secret: string): boolean {
      const { hmac, ...payload } = delta;
      const expectedHmac = CryptoJS.HmacSHA256(JSON.stringify(payload), secret).toString();

      if (hmac !== expectedHmac) {
        throw new Error('URL has been tampered with - HMAC mismatch');
      }

      return true;
    }
    ```
  - why_critical: Prevents players from modifying URL to cheat (change opponent's move, alter board state).

- **practice**: Never trust client-side data - validate everything
  - source_url: https://security.stackexchange.com/questions/260958/does-client-side-data-tampering-allow-more-than-just-evading-validation
  - why_critical: "Whatever is executed on the client side can be manipulated by the client" - fundamental security principle.

- **practice**: Use checksum verification for state consistency
  - source_url: Project's delta-based approach (PRD lines 678-961)
  - code_example:
    ```typescript
    // Before applying opponent's move:
    if (calculateChecksum(currentBoard) !== delta.prevChecksum) {
      throw new Error('Board state mismatch - you may be viewing an old URL');
    }

    // After applying move:
    if (calculateChecksum(newBoard) !== delta.newChecksum) {
      throw new Error('Move application failed - checksum mismatch');
    }
    ```
  - why_critical: Detects out-of-sync states and ensures both players see identical board.

### ALGORITHMS

- **name**: Multi-layer verification (4 independent checks)
  - approach: HMAC → prevChecksum → Choice Lock → newChecksum
  - complexity: O(1) per layer
  - source_url: Project's PRD (lines 914-960)
  - implementation_hint:
    ```typescript
    // Layer 1: HMAC (URL tamper detection)
    if (!verifyHMAC(delta, SECRET)) throw new Error('URL tampered');

    // Layer 2: Checksum (state consistency before move)
    if (!verifyChecksum(currentBoard, delta.prevChecksum)) throw new Error('State mismatch');

    // Layer 3: Choice Lock (prevent move changes)
    validateAndLock(gameId, turn, player, position);

    // Layer 4: Checksum (result verification after move)
    if (!verifyChecksum(newBoard, delta.newChecksum)) throw new Error('Move failed');
    ```

- **name**: Turn sequence validation
  - approach: Verify delta.move.turn === currentState.currentTurn + 1
  - complexity: O(1)
  - source_url: Project's PRD (lines 813-826)
  - implementation_hint: Catches out-of-order URLs (player viewing old link)

### GOTCHAS

- **issue**: Client-side validation alone is not real security
  - source_url: https://gamedev.stackexchange.com/questions/113281/prevent-cheating-in-html-javascript-game
  - solution: For correspondence games, combination of HMAC + checksum + choice lock provides "good enough" anti-cheat without backend. Understand limitations.

- **issue**: localStorage can be manually edited by player
  - source_url: https://gamedev.stackexchange.com/questions/202606/how-can-i-protect-against-a-cheater-changing-variables-on-the-client
  - solution: Checksum verification detects local tampering. If checksum doesn't match localStorage board, throw error.

- **issue**: Back button allows replaying old state
  - source_url: Project's choiceLockManager implementation
  - solution: Choice locking prevents changing moves. Checksum verification ensures current state matches expected state.

- **issue**: Opening old URL causes state desync
  - source_url: Project's PRD (lines 862-897)
  - solution: Compare turn numbers and checksums. Show helpful error:
    ```typescript
    if (currentState.currentTurn > delta.move.turn) {
      alert(`This link is from turn ${delta.move.turn}, but you're on turn ${currentState.currentTurn}. Use the latest link.`);
    }
    ```

### REACT_PATTERNS

- **pattern**: useChoiceLock hook for anti-cheat
  - source_url: Project's framework hooks
  - when_to_use: Any game where players shouldn't change moves
  - code_example:
    ```typescript
    function useChoiceLock(gameId: string, turn: number, player: 1 | 2) {
      const validateAndLock = useCallback((choiceId: string) => {
        const lock = getChoiceLock(gameId, turn, player);

        if (lock && lock.choiceId !== choiceId) {
          throw new Error(`Cannot change move from ${lock.choiceId} to ${choiceId}`);
        }

        if (!lock) {
          lockChoice({ gameId, turn, player, choiceId, timestamp: new Date().toISOString() });
        }
      }, [gameId, turn, player]);

      return { validateAndLock };
    }
    ```

- **pattern**: Error boundaries for validation failures
  - source_url: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
  - when_to_use: Catch and display HMAC/checksum errors gracefully
  - code_example:
    ```typescript
    class GameErrorBoundary extends React.Component {
      state = { hasError: false, error: null };

      static getDerivedStateFromError(error) {
        return { hasError: true, error };
      }

      render() {
        if (this.state.hasError) {
          return (
            <div>
              <h1>Invalid Game Link</h1>
              <p>{this.state.error.message}</p>
              <button onClick={() => window.location.href = '/'}>Start New Game</button>
            </div>
          );
        }

        return this.props.children;
      }
    }
    ```

### RECOMMENDED_LIBRARIES

None - crypto-js provides all needed functionality for HMAC and checksums. Choice locking is simple localStorage operations.

---

## TOPIC: UI/UX Best Practices

### BEST_PRACTICES

- **practice**: Use CSS Grid for responsive 3x3 board layout
  - source_url: https://stackoverflow.com/questions/71185411/css-trying-to-have-responsive-tic-tac-toe-horizontal-and-vertical-lines-inside
  - code_example:
    ```css
    .board {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(3, 1fr);
      gap: 4px;
      max-width: 400px;
      aspect-ratio: 1;
    }

    .cell {
      aspect-ratio: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: clamp(2rem, 8vw, 4rem);
      cursor: pointer;
    }

    .cell:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
    ```
  - why_critical: CSS Grid automatically handles responsive sizing. Use `aspect-ratio: 1` for perfect squares.

- **practice**: Keyboard navigation support for accessibility
  - source_url: https://github.com/jpdevries/tic-tac-toe
  - code_example:
    ```typescript
    // Use button elements (not divs) for automatic keyboard support
    <button
      className="cell"
      onClick={() => handleCellClick(index)}
      disabled={board[index] !== null || gameStatus !== 'in-progress'}
      aria-label={`Position ${index + 1}, ${board[index] || 'empty'}`}
      aria-disabled={board[index] !== null}
    >
      {board[index]}
    </button>
    ```
  - why_critical: Buttons are natively keyboard accessible (Tab to focus, Space/Enter to activate). ARIA labels help screen readers.

- **practice**: Highlight winning pattern with animation
  - source_url: https://react.dev/learn/tutorial-tic-tac-toe (improvement suggestions)
  - code_example:
    ```css
    @keyframes pulse {
      0%, 100% {
        background-color: #27ae60;
        transform: scale(1);
      }
      50% {
        background-color: #2ecc71;
        transform: scale(1.05);
      }
    }

    .cell.winning {
      animation: pulse 0.5s ease-in-out 3;
    }
    ```
    ```typescript
    <div className={`cell ${winningPattern?.includes(index) ? 'winning' : ''}`}>
      {board[index]}
    </div>
    ```
  - why_critical: Visual feedback helps players understand how the game was won. Commonly overlooked UX improvement.

- **practice**: Show clear turn indicator
  - source_url: https://dev.to/alimansoorcreate/component-breakdown-state-management-building-a-tic-tac-toe-game-with-react-from-scratch-16l6
  - code_example:
    ```typescript
    function TurnIndicator({ currentPlayer, isMyTurn }: Props) {
      return (
        <div className="turn-indicator">
          {isMyTurn ? (
            <p>Your turn ({currentPlayer === 1 ? 'X' : 'O'})</p>
          ) : (
            <p>Waiting for opponent ({currentPlayer === 1 ? 'X' : 'O'})</p>
          )}
        </div>
      );
    }
    ```
  - why_critical: Players need to know whose turn it is, especially in asynchronous correspondence games.

- **practice**: Disable clicks after game over
  - source_url: https://stackoverflow.com/questions/39702254/disabling-buttons-after-tic-tac-toe-game-has-ended
  - code_example:
    ```typescript
    const handleCellClick = (index: number) => {
      if (gameStatus !== 'in-progress') {
        return; // Silently ignore clicks
      }
      // ... move logic
    };

    // OR visually disable buttons:
    <button disabled={board[index] !== null || gameStatus !== 'in-progress'}>
    ```
  - why_critical: Prevents confusion and invalid moves after winner is declared.

- **practice**: Mobile-friendly touch targets (minimum 44x44px)
  - source_url: https://www.w3.org/WAI/WCAG21/Understanding/target-size.html
  - code_example:
    ```css
    .cell {
      min-width: 44px;
      min-height: 44px;
      /* For larger screens: */
      width: 100px;
      height: 100px;
    }

    @media (max-width: 480px) {
      .cell {
        font-size: 2rem;
      }
    }
    ```
  - why_critical: WCAG 2.1 AA compliance requires 44x44px minimum for touch targets.

### REACT_PATTERNS

- **pattern**: Separate presentational and container components
  - source_url: https://dev.to/alimansoorcreate/component-breakdown-state-management-building-a-tic-tac-toe-game-with-react-from-scratch-16l6
  - when_to_use: Always - keeps UI logic separate from game logic
  - code_example:
    ```typescript
    // Container (logic)
    function Game() {
      const [board, setBoard] = useState<Board>(Array(9).fill(null));
      const handleCellClick = (index: number) => { /* logic */ };

      return <Board board={board} onCellClick={handleCellClick} />;
    }

    // Presentational (UI only)
    function Board({ board, onCellClick }: BoardProps) {
      return (
        <div className="board">
          {board.map((cell, i) => (
            <Cell key={i} value={cell} onClick={() => onCellClick(i)} />
          ))}
        </div>
      );
    }
    ```

- **pattern**: Conditional rendering for game states
  - source_url: https://react.dev/learn/conditional-rendering
  - when_to_use: Switch between different screens (playing, won, draw)
  - code_example:
    ```typescript
    function Game() {
      if (gameStatus === 'won') {
        return <WinScreen winner={winner} />;
      }

      if (gameStatus === 'draw') {
        return <DrawScreen />;
      }

      return <GameBoard />;
    }
    ```

### RECOMMENDED_LIBRARIES

- **library**: Framer Motion
  - url: https://www.framer.com/motion/
  - why_useful: Simple animations for piece placement and winning line highlight
  - integration:
    ```typescript
    import { motion } from 'framer-motion';

    function Cell({ value, onClick }: CellProps) {
      return (
        <motion.button
          className="cell"
          onClick={onClick}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {value && (
            <motion.span
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring' }}
            >
              {value}
            </motion.span>
          )}
        </motion.button>
      );
    }
    ```

---

## TOPIC: Common Edge Cases & Bugs

### GOTCHAS

- **issue**: Most missed edge case - draw detection
  - source_url: https://github.com/reactjs/react.dev/issues/6966
  - solution: Check board full AND no winner:
    ```typescript
    const winResult = checkWinCondition(board, currentPlayer);
    if (winResult.won) {
      return { status: 'won', winner: currentPlayer };
    }

    if (board.every(cell => cell !== null)) {
      return { status: 'draw', winner: null };
    }
    ```

- **issue**: Player can continue playing after game ends
  - source_url: https://stackoverflow.com/questions/39702254/disabling-buttons-after-tic-tac-toe-game-has-ended
  - solution: Check game status before every move:
    ```typescript
    if (gameStatus !== 'in-progress') return;
    ```

- **issue**: Winning on the last turn (turn 9) not detected
  - source_url: https://stackoverflow.com/questions/27812213/java-determining-a-tie-in-tic-tac-toe
  - solution: ALWAYS check win before draw. Win takes precedence.

- **issue**: Back button allows changing moves (anti-cheat failure)
  - source_url: Project's choiceLockManager
  - solution: Implement choice locking in localStorage before URL generation

- **issue**: Opening old URL causes state desync
  - source_url: Project's PRD (lines 862-897)
  - solution: Include turn number in URL delta, verify on load:
    ```typescript
    if (delta.move.turn !== currentState.currentTurn + 1) {
      showError('You may be viewing an old link');
    }
    ```

- **issue**: Player opens their own URL (not opponent's)
  - source_url: Project's PRD edge cases (lines 1521-1538)
  - solution: Detect same player and show locked choice view:
    ```typescript
    const isOwnUrl = urlState?.currentPlayer === myPlayerId;
    if (isOwnUrl) {
      return <LockedChoiceView message="Waiting for opponent" />;
    }
    ```

- **issue**: localStorage disabled or quota exceeded
  - source_url: https://mmazzarolo.com/blog/2022-06-25-local-storage-status/
  - solution: Graceful degradation to sessionStorage or in-memory:
    ```typescript
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('localStorage unavailable, using sessionStorage');
      sessionStorage.setItem(key, value);
    }
    ```

---

## Project-Specific Integration Notes

### Correspondence Games Framework Context

This tic-tac-toe implementation integrates with an existing correspondence games framework that uses:

1. **localStorage-first architecture** - All game state persists locally
2. **Delta-based URLs** - URLs contain only last move + checksums (70-80% smaller than full state)
3. **Multi-layer anti-cheat**:
   - HMAC for URL tamper detection
   - Choice locking prevents move changes
   - Checksums ensure state consistency
4. **YAML-based game configuration** - All game rules in declarative config
5. **Breaking changes are acceptable** - Framework evolving to support sequential games

### Key Differences from Traditional Tic-Tac-Toe

**Turn Structure**: Alternating sequential turns (not simultaneous rounds like Prisoner's Dilemma)

**State Sharing**: Delta-based URLs with checksums (not full board state)

**Anti-Cheat**: 4-layer verification (HMAC → prevChecksum → Choice Lock → newChecksum)

**Validation**: Both players verify checksums to ensure identical board state

**URL Size**: ~60-100 characters (compressed delta) vs ~350+ characters (full state)

### Critical Implementation Requirements

1. **Checksum Calculation** - Must be deterministic (same board → same checksum always)
2. **Delta URL Format** - Include gameId, move, prevChecksum, newChecksum, HMAC
3. **Turn Validation** - Verify turn number matches expected sequence
4. **Choice Locking** - Lock at turn level: `choice-lock-{gameId}-t{turn}-p{player}`
5. **State Consistency** - Verify prevChecksum matches current localStorage before applying move

### Integration with Existing Games

The framework currently supports Prisoner's Dilemma and Rock-Paper-Scissors. Tic-Tac-Toe will:

- **Extend framework** to support sequential turns (not just simultaneous rounds)
- **Introduce breaking changes** to URL format (all games migrate to delta-based URLs)
- **Validate extensibility** for future sequential games (Connect Four, Chess, etc.)

### Testing Requirements

After implementation, verify:
- [ ] Prisoner's Dilemma still works with new delta-based URLs
- [ ] Rock-Paper-Scissors still works with new delta-based URLs
- [ ] Tic-Tac-Toe completes full game flow (win/draw)
- [ ] Checksum mismatches show helpful error messages
- [ ] Choice locking prevents move changes
- [ ] URL sizes reduced by 70-80%

---

## Additional Resources

### Documentation
- [React Official Tutorial - Tic-Tac-Toe](https://react.dev/learn/tutorial-tic-tac-toe)
- [MDN - Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [MDN - Storage Event](https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event)

### Libraries
- [usehooks-ts](https://usehooks-ts.com/react-hook/use-local-storage) - Production-ready hooks
- [LZ-String](https://github.com/pieroxy/lz-string) - URL-safe compression
- [crypto-js](https://github.com/brix/crypto-js) - HMAC and checksums

### Articles
- [LogRocket - Using localStorage with React Hooks](https://blog.logrocket.com/using-localstorage-react-hooks/)
- [Matteo Mazzarolo - Handling localStorage errors](https://mmazzarolo.com/blog/2022-06-25-local-storage-status/)
- [56kode - useSyncExternalStore with localStorage](https://www.56kode.com/posts/using-usesyncexternalstore-with-localstorage/)

---

**Research Date**: 2025-10-08
**Focus**: React + TypeScript + localStorage + URL-based state sharing for correspondence games
**Save to ai_docs**: Yes - Complex enough to warrant permanent documentation
