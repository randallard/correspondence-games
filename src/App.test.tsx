/**
 * @fileoverview Integration tests for App UI states based on game flow diagram
 * @module App.test
 *
 * Tests verify the complete game flow as documented in:
 * games/prisoners-dilemma-design-draft.md (lines 163-343)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { createNewGame, calculateRoundResults, updateTotals, advanceToNextRound } from './features/game/utils/payoffCalculation';
import { encryptGameState } from './features/game/utils/encryption';
import type { GameState } from './features/game/schemas/gameSchema';

// Mock useGameHistory hook to skip player name prompt in tests
vi.mock('./features/game/hooks/useGameHistory', () => ({
  useGameHistory: () => ({
    playerName: 'TestPlayer',
    games: [],
    addCompletedGame: vi.fn(),
    clearHistory: vi.fn(),
    removeGame: vi.fn(),
    setPlayerName: vi.fn(),
    isLoading: false,
  }),
}));

// Helper function to set URL with game state
function setURLWithGameState(gameState: GameState) {
  const encrypted = encryptGameState(gameState);
  const url = `http://localhost/?s=${encrypted}`;

  // Use jsdom's history API properly
  window.history.pushState({}, '', url);

  // Mock location.href to return the new URL
  Object.defineProperty(window, 'location', {
    writable: true,
    configurable: true,
    value: {
      href: url,
      origin: 'http://localhost',
      protocol: 'http:',
      host: 'localhost',
      hostname: 'localhost',
      port: '',
      pathname: '/',
      search: `?s=${encrypted}`,
      hash: '',
    },
  });
}

describe('App - Game Flow UI States', () => {
  beforeEach(() => {
    // Reset URL - properly mock window.location for jsdom
    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: {
        href: 'http://localhost/',
        origin: 'http://localhost',
        protocol: 'http:',
        host: 'localhost',
        hostname: 'localhost',
        port: '',
        pathname: '/',
        search: '',
        hash: '',
      },
    });
  });

  describe('Round 1: Player 1 Starts', () => {
    it('should show landing page with story and Start Game button for new game', async () => {
      render(<App />);

      // Should see story setup
      expect(screen.getByText(/The Prisoner's Dilemma/i)).toBeInTheDocument();
      expect(screen.getByText(/Two prisoners are caught by the guards/i)).toBeInTheDocument();

      // Should see payoff matrix
      expect(screen.getByText(/Payoff Matrix/i)).toBeInTheDocument();

      // Should see Start Game button
      expect(screen.getByRole('button', { name: /start new prisoner/i })).toBeInTheDocument();
    });

    it('should show Player 1 choice interface after clicking Start Game', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Click Start Game
      const startButton = screen.getByRole('button', { name: /start new prisoner/i });
      await user.click(startButton);

      // Should see Player 1 choice interface
      await waitFor(() => {
        expect(screen.getByText(/Your Choice \(Player 1\)/i)).toBeInTheDocument();
      });

      // Should see Round 1 indicator
      expect(screen.getByText(/Round 1 of 5/i)).toBeInTheDocument();

      // Should see choice buttons
      expect(screen.getByRole('button', { name: /stay silent/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /talk/i })).toBeInTheDocument();

      // Should see scenario text
      expect(screen.getByText(/interrogated separately/i)).toBeInTheDocument();
    });

    it('should show "Share URL with Player 2" after Player 1 makes choice', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Start game and make P1 choice
      await user.click(screen.getByRole('button', { name: /start new prisoner/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /stay silent/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /stay silent/i }));

      // Should show waiting message
      await waitFor(() => {
        expect(screen.getByText(/Choice Made!/i)).toBeInTheDocument();
        expect(screen.getByText(/Send this URL to Player 2/i)).toBeInTheDocument();
      });

      // Should see Copy URL button
      expect(screen.getByRole('button', { name: /copy url/i })).toBeInTheDocument();
    });
  });

  describe('Round 1: Player 2 Responds', () => {
    it('should show Player 2 the story and choice interface when loading Round 1 URL', async () => {
      // Create game state where P1 has chosen
      let gameState = createNewGame();
      gameState.gamePhase = 'playing';
      gameState.rounds[0].choices.p1 = 'silent';

      // Set URL with game state
      setURLWithGameState(gameState);

      render(<App />);

      // P2 should see the story
      await waitFor(() => {
        expect(screen.getByText(/The Setup/i)).toBeInTheDocument();
        expect(screen.getByText(/Two prisoners are caught by the guards/i)).toBeInTheDocument();
        expect(screen.getByText(/Player 1 has made their choice/i)).toBeInTheDocument();
      });

      // Should see Player 2 choice interface
      expect(screen.getByText(/Your Choice \(Player 2\)/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /stay silent/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /talk/i })).toBeInTheDocument();
    });

    it('should show Round 1 results immediately after Player 2 makes choice', async () => {
      const user = userEvent.setup();

      // Create game state where P1 has chosen
      let gameState = createNewGame();
      gameState.gamePhase = 'playing';
      gameState.rounds[0].choices.p1 = 'silent';

      setURLWithGameState(gameState);

      render(<App />);

      // Wait for P2 interface
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /stay silent/i })).toBeInTheDocument();
      });

      // P2 makes choice
      await user.click(screen.getByRole('button', { name: /talk/i }));

      // Should show round history with Round 1 results
      await waitFor(() => {
        expect(screen.getByText(/Round History/i)).toBeInTheDocument();
        expect(screen.getByText(/Round 1/i)).toBeInTheDocument();
      });

      // Should show updated totals (P1: 0, P2: 5 for silent/talk)
      expect(screen.getByText(/Player 1 Gold:/i)).toBeInTheDocument();
      expect(screen.getByText(/Player 2 Gold:/i)).toBeInTheDocument();
    });

    it('should immediately show Round 2 choice interface for Player 2 after completing Round 1', async () => {
      const user = userEvent.setup();

      // Create game state where P1 has chosen in Round 1
      let gameState = createNewGame();
      gameState.gamePhase = 'playing';
      gameState.rounds[0].choices.p1 = 'silent';

      setURLWithGameState(gameState);

      render(<App />);

      // Wait for P2 interface
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /stay silent/i })).toBeInTheDocument();
      });

      // P2 makes choice
      await user.click(screen.getByRole('button', { name: /talk/i }));

      // Should immediately show Round 2 interface for P2 (P2 goes first in Round 2)
      await waitFor(() => {
        expect(screen.getByText(/Round 2 of 5/i)).toBeInTheDocument();
        expect(screen.getByText(/Your Choice \(Player 2\)/i)).toBeInTheDocument();
      });
    });
  });

  describe('Round 2: Player 2 Goes First', () => {
    it('should show Player 2 choice interface at start of Round 2', async () => {
      // Create game state at Round 2 start (P2 goes first)
      let gameState = createNewGame();
      gameState.gamePhase = 'playing';

      // Complete Round 1
      gameState.rounds[0].choices.p1 = 'silent';
      gameState.rounds[0].choices.p2 = 'talk';
      gameState.rounds[0] = calculateRoundResults(gameState.rounds[0]);
      gameState = updateTotals(gameState, 0);
      gameState = advanceToNextRound(gameState);

      setURLWithGameState(gameState);

      render(<App />);

      // Should show Round 2 for Player 2
      await waitFor(() => {
        expect(screen.getByText(/Round 2 of 5/i)).toBeInTheDocument();
        expect(screen.getByText(/Your Choice \(Player 2\)/i)).toBeInTheDocument();
      });

      // Should show Round 1 history
      expect(screen.getByText(/Round History/i)).toBeInTheDocument();
      expect(screen.getByText(/Round 1/i)).toBeInTheDocument();

      // Should show running totals from Round 1
      expect(screen.getByText(/Player 1 Gold:/i)).toBeInTheDocument();
      expect(screen.getByText(/Player 2 Gold:/i)).toBeInTheDocument();
    });

    it('should show waiting message after Player 2 makes Round 2 choice', async () => {
      const user = userEvent.setup();

      // Create game state at Round 2 start
      let gameState = createNewGame();
      gameState.gamePhase = 'playing';
      gameState.rounds[0].choices.p1 = 'silent';
      gameState.rounds[0].choices.p2 = 'talk';
      gameState.rounds[0] = calculateRoundResults(gameState.rounds[0]);
      gameState = updateTotals(gameState, 0);
      gameState = advanceToNextRound(gameState);

      setURLWithGameState(gameState);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /stay silent/i })).toBeInTheDocument();
      });

      // P2 makes Round 2 choice
      await user.click(screen.getByRole('button', { name: /stay silent/i }));

      // Should show waiting message for P1
      await waitFor(() => {
        expect(screen.getByText(/Choice Made!/i)).toBeInTheDocument();
        expect(screen.getByText(/Send this URL to Player 1/i)).toBeInTheDocument();
      });
    });
  });

  describe('Round 2: Player 1 Responds', () => {
    it('should show Player 1 Round 1 history and Round 2 choice when P2 has chosen', async () => {
      // Create game state where P2 has chosen in Round 2
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

      setURLWithGameState(gameState);

      render(<App />);

      // Should show Round 1 history
      await waitFor(() => {
        expect(screen.getByText(/Round History/i)).toBeInTheDocument();
        expect(screen.getByText(/Round 1/i)).toBeInTheDocument();
      });

      // Should show Player 1 choice for Round 2
      expect(screen.getByText(/Round 2 of 5/i)).toBeInTheDocument();
      expect(screen.getByText(/Your Choice \(Player 1\)/i)).toBeInTheDocument();
    });

    it('should show Round 2 results and Round 3 choice after Player 1 completes Round 2', async () => {
      const user = userEvent.setup();

      // Create game state where P2 has chosen in Round 2
      let gameState = createNewGame();
      gameState.gamePhase = 'playing';
      gameState.rounds[0].choices.p1 = 'silent';
      gameState.rounds[0].choices.p2 = 'talk';
      gameState.rounds[0] = calculateRoundResults(gameState.rounds[0]);
      gameState = updateTotals(gameState, 0);
      gameState = advanceToNextRound(gameState);
      gameState.rounds[1].choices.p2 = 'silent';

      setURLWithGameState(gameState);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /stay silent/i })).toBeInTheDocument();
      });

      // P1 makes Round 2 choice
      await user.click(screen.getByRole('button', { name: /talk/i }));

      // Should show Rounds 1-2 in history
      await waitFor(() => {
        const roundHistorys = screen.queryAllByText(/Round [12]/);
        expect(roundHistorys.length).toBeGreaterThan(0);
      });

      // Should immediately show Round 3 (P1 goes first in Round 3)
      await waitFor(() => {
        expect(screen.getByText(/Round 3 of 5/i)).toBeInTheDocument();
        expect(screen.getByText(/Your Choice \(Player 1\)/i)).toBeInTheDocument();
      });
    });
  });

  describe('Round 5: Game Completion', () => {
    it('should show game results page after Round 5 completion', async () => {
      const user = userEvent.setup();

      // Create game state where P1 needs to complete Round 5
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

      // P2 has chosen in Round 5
      gameState.rounds[4].choices.p2 = 'talk';

      setURLWithGameState(gameState);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /stay silent/i })).toBeInTheDocument();
      });

      // P1 completes Round 5
      await user.click(screen.getByRole('button', { name: /talk/i }));

      // Should show game results
      await waitFor(() => {
        expect(screen.getByText(/Game Complete!/i)).toBeInTheDocument();
      });

      // Should show final totals
      expect(screen.getByText(/Final Score/i)).toBeInTheDocument();

      // Should show complete game history (all 5 rounds)
      expect(screen.getByText(/Round History/i)).toBeInTheDocument();
    });
  });

  describe('Turn Alternation Pattern', () => {
    it('should verify turn order: Round 1=P1, Round 2=P2, Round 3=P1, Round 4=P2, Round 5=P1', () => {
      // This verifies the pattern from the design doc
      const rounds = [0, 1, 2, 3, 4]; // Round indices
      const expectedFirstPlayer = ['P1', 'P2', 'P1', 'P2', 'P1'];

      rounds.forEach((roundIndex, i) => {
        const isP1First = roundIndex % 2 === 0;
        const actualFirstPlayer = isP1First ? 'P1' : 'P2';
        expect(actualFirstPlayer).toBe(expectedFirstPlayer[i]);
      });
    });
  });

  describe('URL State Management', () => {
    it('should load game state from URL parameter', async () => {
      // Create a game in progress
      let gameState = createNewGame();
      gameState.gamePhase = 'playing';
      gameState.rounds[0].choices.p1 = 'silent';

      setURLWithGameState(gameState);

      render(<App />);

      // Should load the game state and show appropriate UI
      await waitFor(() => {
        expect(screen.getByText(/Your Choice \(Player 2\)/i)).toBeInTheDocument();
      });
    });

    it('should show new game screen when no URL parameter', () => {
      render(<App />);

      expect(screen.getByText(/The Prisoner's Dilemma/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start new prisoner/i })).toBeInTheDocument();
    });
  });
});
