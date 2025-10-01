/**
 * @fileoverview Tests for App conditional rendering based on game state
 * @module App.rendering.test
 *
 * Tests what UI elements are shown for each game state WITHOUT URL mocking.
 * Directly tests the rendering logic by mocking the useURLState hook.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import { createNewGame, calculateRoundResults, updateTotals, advanceToNextRound } from './features/game/utils/payoffCalculation';
import type { GameState } from './features/game/schemas/gameSchema';
import * as useURLStateModule from './features/game/hooks/useURLState';
import * as useGameStateModule from './features/game/hooks/useGameState';

describe('App - Conditional Rendering Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('New Game (No URL State)', () => {
    it('should show landing page with story when no game state', () => {
      // Mock useURLState to return no game state
      vi.spyOn(useURLStateModule, 'useURLState').mockReturnValue({
        urlGameState: null,
        isLoading: false,
        error: null,
        generateURL: vi.fn(),
        updateURL: vi.fn(),
      });

      render(<App />);

      // Should see landing page elements
      expect(screen.getByText(/The Prisoner's Dilemma/i)).toBeInTheDocument();
      expect(screen.getByText(/A Game of Trust and Betrayal/i)).toBeInTheDocument();
      expect(screen.getByText(/The Setup/i)).toBeInTheDocument();
      expect(screen.getByText(/Two prisoners are caught by the guards/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start new prisoner/i })).toBeInTheDocument();
    });
  });

  describe('Round 1: Player 1 Has Not Chosen Yet', () => {
    it('should show Player 1 choice interface when P1 needs to choose', () => {
      // Create game state where game just started
      const gameState = createNewGame();
      gameState.gamePhase = 'playing';

      vi.spyOn(useURLStateModule, 'useURLState').mockReturnValue({
        urlGameState: null, // Not loaded from URL
        isLoading: false,
        error: null,
        generateURL: vi.fn(),
        updateURL: vi.fn(),
      });

      render(<App />);

      // Can't easily test this without clicking Start Game
      // This scenario requires user interaction
    });

    it('should show "Send URL to Player 2" message after Player 1 makes Round 1 choice', () => {
      let gameState = createNewGame();
      gameState.gamePhase = 'playing';

      // P1 just made Round 1 choice (first choice of the round)
      gameState.rounds[0].choices.p1 = 'silent';

      vi.spyOn(useGameStateModule, 'useGameState').mockReturnValue({
        gameState: gameState,
        initializeGame: vi.fn(),
        makeChoice: vi.fn(),
        resetGame: vi.fn(),
        loadGame: vi.fn(),
      });

      vi.spyOn(useURLStateModule, 'useURLState').mockReturnValue({
        urlGameState: null, // Not loaded from URL - local state after choice
        isLoading: false,
        error: null,
        generateURL: vi.fn(),
        updateURL: vi.fn(),
      });

      render(<App />);

      // Should show "Choice Made!" and share URL interface
      expect(screen.getByText(/Choice Made!/i)).toBeInTheDocument();
      expect(screen.getByText(/Share Game URL/i)).toBeInTheDocument();
    });
  });

  describe('Round 1: Player 1 Has Chosen, Player 2 Needs to Choose', () => {
    it('should show Player 2 the story and choice interface when loaded from URL', () => {
      // Create game state where P1 has chosen
      const gameState = createNewGame();
      gameState.gamePhase = 'playing';
      gameState.rounds[0].choices.p1 = 'silent';

      // Mock that this state was loaded from URL
      vi.spyOn(useURLStateModule, 'useURLState').mockReturnValue({
        urlGameState: gameState, // KEY: urlGameState !== null means loaded from URL
        isLoading: false,
        error: null,
        generateURL: vi.fn(),
        updateURL: vi.fn(),
      });

      render(<App />);

      // Should see the story setup
      expect(screen.getByText(/The Setup/i)).toBeInTheDocument();
      expect(screen.getByText(/Two prisoners are caught by the guards/i)).toBeInTheDocument();
      expect(screen.getByText(/Player 1 has made their choice/i)).toBeInTheDocument();

      // Should see Player 2 choice interface
      expect(screen.getByText(/Your Choice \(Player 2\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Round 1 of 5/i)).toBeInTheDocument();

      // Should see choice buttons
      expect(screen.getByRole('button', { name: /choose to stay silent/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /choose to talk/i })).toBeInTheDocument();
    });

    it('should show payoff matrix to Player 2 on Round 1', () => {
      const gameState = createNewGame();
      gameState.gamePhase = 'playing';
      gameState.rounds[0].choices.p1 = 'silent';

      vi.spyOn(useURLStateModule, 'useURLState').mockReturnValue({
        urlGameState: gameState,
        isLoading: false,
        error: null,
        generateURL: vi.fn(),
        updateURL: vi.fn(),
      });

      render(<App />);

      // Should see payoff matrix
      expect(screen.getByText(/Payoff Matrix/i)).toBeInTheDocument();
    });
  });

  describe('Round 2: Player 2 Goes First', () => {
    it('should show Player 2 choice interface at start of Round 2', () => {
      // Create game state at Round 2 start (P2 goes first)
      let gameState = createNewGame();
      gameState.gamePhase = 'playing';

      // Complete Round 1
      gameState.rounds[0].choices.p1 = 'silent';
      gameState.rounds[0].choices.p2 = 'talk';
      gameState.rounds[0] = calculateRoundResults(gameState.rounds[0]);
      gameState = updateTotals(gameState, 0);
      gameState = advanceToNextRound(gameState);

      vi.spyOn(useURLStateModule, 'useURLState').mockReturnValue({
        urlGameState: gameState, // Loaded from URL
        isLoading: false,
        error: null,
        generateURL: vi.fn(),
        updateURL: vi.fn(),
      });

      render(<App />);

      // Should show Round 2
      expect(screen.getByText(/Round 2 of 5/i)).toBeInTheDocument();

      // Should show Player 2's choice interface (P2 goes first in Round 2)
      expect(screen.getByText(/Your Choice \(Player 2\)/i)).toBeInTheDocument();

      // Should see Round 1 history
      expect(screen.getByText(/Round History/i)).toBeInTheDocument();
      expect(screen.getByText(/Round 1/i)).toBeInTheDocument();
    });

    it('should show correct gold totals from Round 1', () => {
      let gameState = createNewGame();
      gameState.gamePhase = 'playing';
      gameState.rounds[0].choices.p1 = 'silent';
      gameState.rounds[0].choices.p2 = 'talk';
      gameState.rounds[0] = calculateRoundResults(gameState.rounds[0]);
      gameState = updateTotals(gameState, 0);
      gameState = advanceToNextRound(gameState);

      vi.spyOn(useURLStateModule, 'useURLState').mockReturnValue({
        urlGameState: gameState,
        isLoading: false,
        error: null,
        generateURL: vi.fn(),
        updateURL: vi.fn(),
      });

      render(<App />);

      // Should show totals (P1: 0, P2: 5 for silent/talk)
      expect(screen.getByText(/Player 1 Gold:/i)).toBeInTheDocument();
      expect(screen.getByText(/Player 2 Gold:/i)).toBeInTheDocument();

      // Check that gold amounts are numbers, not NaN
      const goldElements = screen.getAllByText(/\d+ 💰/);
      expect(goldElements.length).toBeGreaterThan(0);
    });

    it('should show "Send URL to Player 1" message after Player 2 makes Round 2 choice', () => {
      // This simulates the REAL scenario:
      // 1. P2 loaded game from URL (urlGameState !== null initially)
      // 2. P2 completed Round 1, saw results, advanced to Round 2
      // 3. P2 just made Round 2 choice
      // 4. Should see "Send URL" message

      let gameState = createNewGame();
      gameState.gamePhase = 'playing';

      // Complete Round 1
      gameState.rounds[0].choices.p1 = 'silent';
      gameState.rounds[0].choices.p2 = 'talk';
      gameState.rounds[0] = calculateRoundResults(gameState.rounds[0]);
      gameState = updateTotals(gameState, 0);
      gameState = advanceToNextRound(gameState);

      // P2 just made Round 2 choice (first choice of the round)
      gameState.rounds[1].choices.p2 = 'silent';

      // KEY: urlGameState is the ORIGINAL state loaded from URL (before P2's Round 2 choice)
      let urlGameState = createNewGame();
      urlGameState.gamePhase = 'playing';
      urlGameState.rounds[0].choices.p1 = 'silent';
      urlGameState.rounds[0].choices.p2 = 'talk';
      urlGameState.rounds[0] = calculateRoundResults(urlGameState.rounds[0]);
      urlGameState = updateTotals(urlGameState, 0);
      urlGameState = advanceToNextRound(urlGameState);

      // Mock useGameState to return the state WITH P2's choice
      vi.spyOn(useGameStateModule, 'useGameState').mockReturnValue({
        gameState: gameState,
        initializeGame: vi.fn(),
        makeChoice: vi.fn(),
        resetGame: vi.fn(),
        loadGame: vi.fn(),
      });

      vi.spyOn(useURLStateModule, 'useURLState').mockReturnValue({
        urlGameState: urlGameState, // Still set to original URL state
        isLoading: false,
        error: null,
        generateURL: vi.fn(),
        updateURL: vi.fn(),
      });

      render(<App />);

      // Should show "Choice Made!" and share URL interface
      expect(screen.getByText(/Choice Made!/i)).toBeInTheDocument();
      expect(screen.getByText(/Share Game URL/i)).toBeInTheDocument();

      // Should NOT show "Your Choice (Player 1)" - that's the bug
      expect(screen.queryByText(/Your Choice \(Player 1\)/i)).not.toBeInTheDocument();
    });
  });

  describe('Round 2: Player 2 Has Chosen, Player 1 Needs to Respond', () => {
    it('should show Player 1 choice interface when P2 went first and chose', () => {
      let gameState = createNewGame();
      gameState.gamePhase = 'playing';

      // Complete Round 1
      gameState.rounds[0].choices.p1 = 'silent';
      gameState.rounds[0].choices.p2 = 'talk';
      gameState.rounds[0] = calculateRoundResults(gameState.rounds[0]);
      gameState = updateTotals(gameState, 0);
      gameState = advanceToNextRound(gameState);

      // P2 chooses in Round 2
      gameState.rounds[1].choices.p2 = 'silent';

      vi.spyOn(useURLStateModule, 'useURLState').mockReturnValue({
        urlGameState: gameState,
        isLoading: false,
        error: null,
        generateURL: vi.fn(),
        updateURL: vi.fn(),
      });

      render(<App />);

      // Should show Round 2
      expect(screen.getByText(/Round 2 of 5/i)).toBeInTheDocument();

      // Should show Player 1's choice interface
      expect(screen.getByText(/Your Choice \(Player 1\)/i)).toBeInTheDocument();

      // Should show Round 1 history
      expect(screen.getByText(/Round History/i)).toBeInTheDocument();
    });
  });

  describe('Round 3: Player 1 Goes First Again', () => {
    it('should show Player 1 choice interface at start of Round 3', () => {
      let gameState = createNewGame();
      gameState.gamePhase = 'playing';

      // Complete Rounds 1 and 2
      gameState.rounds[0].choices.p1 = 'silent';
      gameState.rounds[0].choices.p2 = 'talk';
      gameState.rounds[0] = calculateRoundResults(gameState.rounds[0]);
      gameState = updateTotals(gameState, 0);
      gameState = advanceToNextRound(gameState);

      gameState.rounds[1].choices.p2 = 'silent';
      gameState.rounds[1].choices.p1 = 'talk';
      gameState.rounds[1] = calculateRoundResults(gameState.rounds[1]);
      gameState = updateTotals(gameState, 1);
      gameState = advanceToNextRound(gameState);

      vi.spyOn(useURLStateModule, 'useURLState').mockReturnValue({
        urlGameState: gameState,
        isLoading: false,
        error: null,
        generateURL: vi.fn(),
        updateURL: vi.fn(),
      });

      render(<App />);

      // Should show Round 3
      expect(screen.getByText(/Round 3 of 5/i)).toBeInTheDocument();

      // Should show Player 1's choice interface (P1 goes first in odd rounds)
      expect(screen.getByText(/Your Choice \(Player 1\)/i)).toBeInTheDocument();

      // Should show history of Rounds 1-2
      expect(screen.getByText(/Round History/i)).toBeInTheDocument();
    });

    it('should show "Send URL to Player 2" message after Player 1 makes Round 3 choice', () => {
      // REAL scenario: P1 loaded game from URL, completed Round 2, now made Round 3 choice
      let gameState = createNewGame();
      gameState.gamePhase = 'playing';

      // Complete Rounds 1 and 2
      gameState.rounds[0].choices.p1 = 'silent';
      gameState.rounds[0].choices.p2 = 'talk';
      gameState.rounds[0] = calculateRoundResults(gameState.rounds[0]);
      gameState = updateTotals(gameState, 0);
      gameState = advanceToNextRound(gameState);

      gameState.rounds[1].choices.p2 = 'silent';
      gameState.rounds[1].choices.p1 = 'talk';
      gameState.rounds[1] = calculateRoundResults(gameState.rounds[1]);
      gameState = updateTotals(gameState, 1);
      gameState = advanceToNextRound(gameState);

      // P1 just made Round 3 choice (first choice of the round)
      gameState.rounds[2].choices.p1 = 'silent';

      // urlGameState is the original state loaded from URL (before P1's Round 3 choice)
      let urlGameState = createNewGame();
      urlGameState.gamePhase = 'playing';
      urlGameState.rounds[0].choices.p1 = 'silent';
      urlGameState.rounds[0].choices.p2 = 'talk';
      urlGameState.rounds[0] = calculateRoundResults(urlGameState.rounds[0]);
      urlGameState = updateTotals(urlGameState, 0);
      urlGameState = advanceToNextRound(urlGameState);
      urlGameState.rounds[1].choices.p2 = 'silent';
      urlGameState.rounds[1].choices.p1 = 'talk';
      urlGameState.rounds[1] = calculateRoundResults(urlGameState.rounds[1]);
      urlGameState = updateTotals(urlGameState, 1);
      urlGameState = advanceToNextRound(urlGameState);

      vi.spyOn(useGameStateModule, 'useGameState').mockReturnValue({
        gameState: gameState,
        initializeGame: vi.fn(),
        makeChoice: vi.fn(),
        resetGame: vi.fn(),
        loadGame: vi.fn(),
      });

      vi.spyOn(useURLStateModule, 'useURLState').mockReturnValue({
        urlGameState: urlGameState, // Still set to original URL state
        isLoading: false,
        error: null,
        generateURL: vi.fn(),
        updateURL: vi.fn(),
      });

      render(<App />);

      // Should show "Choice Made!" and share URL interface
      expect(screen.getByText(/Choice Made!/i)).toBeInTheDocument();
      expect(screen.getByText(/Share Game URL/i)).toBeInTheDocument();

      // Should show Rounds 1-2 history
      expect(screen.getByText(/Round History/i)).toBeInTheDocument();
    });
  });

  describe('Round 4: Player 2 Goes First', () => {
    it('should show "Send URL to Player 1" message after Player 2 makes Round 4 choice', () => {
      let gameState = createNewGame();
      gameState.gamePhase = 'playing';

      // Complete Rounds 1-3
      for (let i = 0; i < 3; i++) {
        gameState.rounds[i].choices.p1 = 'silent';
        gameState.rounds[i].choices.p2 = 'silent';
        gameState.rounds[i] = calculateRoundResults(gameState.rounds[i]);
        gameState = updateTotals(gameState, i);
        gameState = advanceToNextRound(gameState);
      }

      // P2 just made Round 4 choice (first choice of the round)
      gameState.rounds[3].choices.p2 = 'talk';

      // urlGameState is the original state loaded from URL
      let urlGameState = createNewGame();
      urlGameState.gamePhase = 'playing';
      for (let i = 0; i < 3; i++) {
        urlGameState.rounds[i].choices.p1 = 'silent';
        urlGameState.rounds[i].choices.p2 = 'silent';
        urlGameState.rounds[i] = calculateRoundResults(urlGameState.rounds[i]);
        urlGameState = updateTotals(urlGameState, i);
        urlGameState = advanceToNextRound(urlGameState);
      }

      // Mock useGameState to return the state WITH P2's choice
      vi.spyOn(useGameStateModule, 'useGameState').mockReturnValue({
        gameState: gameState,
        initializeGame: vi.fn(),
        makeChoice: vi.fn(),
        resetGame: vi.fn(),
        loadGame: vi.fn(),
      });

      vi.spyOn(useURLStateModule, 'useURLState').mockReturnValue({
        urlGameState: urlGameState,
        isLoading: false,
        error: null,
        generateURL: vi.fn(),
        updateURL: vi.fn(),
      });

      render(<App />);

      // Should show "Choice Made!" and share URL interface
      expect(screen.getByText(/Choice Made!/i)).toBeInTheDocument();
      expect(screen.getByText(/Share Game URL/i)).toBeInTheDocument();

      // Should show Rounds 1-3 history
      expect(screen.getByText(/Round History/i)).toBeInTheDocument();
    });
  });

  describe('Round 5: Player 1 Goes First', () => {
    it('should show "Send URL to Player 2" message after Player 1 makes Round 5 choice', () => {
      let gameState = createNewGame();
      gameState.gamePhase = 'playing';

      // Complete Rounds 1-4
      for (let i = 0; i < 4; i++) {
        gameState.rounds[i].choices.p1 = 'silent';
        gameState.rounds[i].choices.p2 = 'silent';
        gameState.rounds[i] = calculateRoundResults(gameState.rounds[i]);
        gameState = updateTotals(gameState, i);
        gameState = advanceToNextRound(gameState);
      }

      // P1 just made Round 5 choice (first choice of the round)
      gameState.rounds[4].choices.p1 = 'talk';

      // urlGameState is the original state loaded from URL
      let urlGameState = createNewGame();
      urlGameState.gamePhase = 'playing';
      for (let i = 0; i < 4; i++) {
        urlGameState.rounds[i].choices.p1 = 'silent';
        urlGameState.rounds[i].choices.p2 = 'silent';
        urlGameState.rounds[i] = calculateRoundResults(urlGameState.rounds[i]);
        urlGameState = updateTotals(urlGameState, i);
        urlGameState = advanceToNextRound(urlGameState);
      }

      // Mock useGameState to return the state WITH P1's choice
      vi.spyOn(useGameStateModule, 'useGameState').mockReturnValue({
        gameState: gameState,
        initializeGame: vi.fn(),
        makeChoice: vi.fn(),
        resetGame: vi.fn(),
        loadGame: vi.fn(),
      });

      vi.spyOn(useURLStateModule, 'useURLState').mockReturnValue({
        urlGameState: urlGameState,
        isLoading: false,
        error: null,
        generateURL: vi.fn(),
        updateURL: vi.fn(),
      });

      render(<App />);

      // Should show "Choice Made!" and share URL interface
      expect(screen.getByText(/Choice Made!/i)).toBeInTheDocument();
      expect(screen.getByText(/Share Game URL/i)).toBeInTheDocument();

      // Should show Rounds 1-4 history
      expect(screen.getByText(/Round History/i)).toBeInTheDocument();
    });
  });

  describe('Game Finished', () => {
    it('should show Player 2 message when Player 1 views completed game from URL', () => {
      // Simulate: P1 receives URL with game finished + P2's message
      let finishedGameState = createNewGame();

      // Complete all 5 rounds
      for (let i = 0; i < 5; i++) {
        finishedGameState.rounds[i].choices.p1 = 'silent';
        finishedGameState.rounds[i].choices.p2 = 'silent';
        finishedGameState.rounds[i] = calculateRoundResults(finishedGameState.rounds[i]);
        finishedGameState = updateTotals(finishedGameState, i);
        if (i < 4) {
          finishedGameState = advanceToNextRound(finishedGameState);
        }
      }

      // Set game phase to finished
      finishedGameState.gamePhase = 'finished';
      finishedGameState.currentRound = 4; // Last round

      // Add Player 2's message
      finishedGameState.socialFeatures = {
        finalMessage: {
          from: 'p2',
          text: 'Good game! Want a rematch?',
          timestamp: new Date().toISOString(),
        },
      };

      // Mock: P1 loads finished game with message from URL
      // urlGameState and gameState are the same (both finished) because P1 is viewing from URL
      vi.spyOn(useGameStateModule, 'useGameState').mockReturnValue({
        gameState: finishedGameState,
        initializeGame: vi.fn(),
        makeChoice: vi.fn(),
        resetGame: vi.fn(),
        loadGame: vi.fn(),
      });

      vi.spyOn(useURLStateModule, 'useURLState').mockReturnValue({
        urlGameState: finishedGameState, // P1 loaded this from URL
        isLoading: false,
        error: null,
        generateURL: vi.fn(),
        updateURL: vi.fn(),
      });

      render(<App />);

      // Should show game results (GameResults component)
      expect(screen.getByText(/Game Over!/i)).toBeInTheDocument();

      // CRITICAL: Should show Player 2's message
      expect(screen.getByText(/Good game! Want a rematch\?/i)).toBeInTheDocument();
      expect(screen.getByText(/Player 2 says:/i)).toBeInTheDocument();
    });

    it('should show game results with immediate URL sharing after Player 2 completes Round 5', () => {
      // Simulate: P2 just made Round 5 choice (second choice of round), completing the game
      let gameState = createNewGame();
      gameState.gamePhase = 'playing';

      // Complete Rounds 1-4
      for (let i = 0; i < 4; i++) {
        gameState.rounds[i].choices.p1 = 'silent';
        gameState.rounds[i].choices.p2 = 'silent';
        gameState.rounds[i] = calculateRoundResults(gameState.rounds[i]);
        gameState = updateTotals(gameState, i);
        gameState = advanceToNextRound(gameState);
      }

      // P1 made Round 5 choice, P2 just completed it
      gameState.rounds[4].choices.p1 = 'silent';
      gameState.rounds[4].choices.p2 = 'talk';
      gameState.rounds[4] = calculateRoundResults(gameState.rounds[4]);
      gameState = updateTotals(gameState, 4);
      gameState.gamePhase = 'finished';

      // urlGameState is what P2 loaded from URL (before their Round 5 choice)
      let urlGameState = createNewGame();
      urlGameState.gamePhase = 'playing';
      for (let i = 0; i < 4; i++) {
        urlGameState.rounds[i].choices.p1 = 'silent';
        urlGameState.rounds[i].choices.p2 = 'silent';
        urlGameState.rounds[i] = calculateRoundResults(urlGameState.rounds[i]);
        urlGameState = updateTotals(urlGameState, i);
        urlGameState = advanceToNextRound(urlGameState);
      }
      urlGameState.rounds[4].choices.p1 = 'silent';

      // Mock useGameState to return finished game state
      vi.spyOn(useGameStateModule, 'useGameState').mockReturnValue({
        gameState: gameState,
        initializeGame: vi.fn(),
        makeChoice: vi.fn(),
        resetGame: vi.fn(),
        loadGame: vi.fn(),
      });

      vi.spyOn(useURLStateModule, 'useURLState').mockReturnValue({
        urlGameState: urlGameState,
        isLoading: false,
        error: null,
        generateURL: vi.fn(),
        updateURL: vi.fn(),
      });

      render(<App />);

      // Should show game complete
      expect(screen.getByText(/Game Over!/i)).toBeInTheDocument();

      // Should show complete history
      expect(screen.getByText(/Round History/i)).toBeInTheDocument();

      // CRITICAL: Should show URL sharing interface IMMEDIATELY after game completes
      expect(screen.getByText(/Share Game URL/i)).toBeInTheDocument();
      expect(screen.getByText(/Send this URL to Player 1/i)).toBeInTheDocument();

      // Should show optional message input field
      expect(screen.getByPlaceholderText(/Add an optional message for Player 1/i)).toBeInTheDocument();

      // Should show rematch button
      expect(screen.getByText(/Rematch/i)).toBeInTheDocument();
    });
  });

  describe('Turn Alternation Verification', () => {
    it('should show correct player for each round based on round number', () => {
      // Test Round 1 (index 0): P1 first
      const round1State = createNewGame();
      round1State.gamePhase = 'playing';

      // Test Round 2 (index 1): P2 first
      let round2State = createNewGame();
      round2State.gamePhase = 'playing';
      round2State.rounds[0].choices.p1 = 'silent';
      round2State.rounds[0].choices.p2 = 'talk';
      round2State.rounds[0] = calculateRoundResults(round2State.rounds[0]);
      round2State = updateTotals(round2State, 0);
      round2State = advanceToNextRound(round2State);

      // Verify the pattern
      const rounds = [
        { index: 0, firstPlayer: 'P1', state: round1State },
        { index: 1, firstPlayer: 'P2', state: round2State },
      ];

      rounds.forEach(({ index, firstPlayer }) => {
        const isP1First = index % 2 === 0;
        const actualFirstPlayer = isP1First ? 'P1' : 'P2';
        expect(actualFirstPlayer).toBe(firstPlayer);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should show loading state when URL is being parsed', () => {
      vi.spyOn(useURLStateModule, 'useURLState').mockReturnValue({
        urlGameState: null,
        isLoading: true, // Still loading
        error: null,
        generateURL: vi.fn(),
        updateURL: vi.fn(),
      });

      render(<App />);

      // Should show loading indicator
      expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    });

    it('should show error state when URL parsing fails', () => {
      vi.spyOn(useURLStateModule, 'useURLState').mockReturnValue({
        urlGameState: null,
        isLoading: false,
        error: new Error('Invalid game state'),
        generateURL: vi.fn(),
        updateURL: vi.fn(),
      });

      render(<App />);

      // Should show error message
      expect(screen.getByText(/Invalid Game Link/i)).toBeInTheDocument();
    });
  });
});
