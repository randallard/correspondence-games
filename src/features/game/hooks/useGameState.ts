/**
 * @fileoverview Custom hook for managing game state
 * @module features/game/hooks/useGameState
 */

import { useState, useCallback } from 'react';
import { GameState, Choice } from '../schemas/gameSchema';
import {
  createNewGame,
  calculateRoundResults,
  updateTotals,
  advanceToNextRound,
  canCalculateResults,
} from '../utils/payoffCalculation';

/**
 * Result type for useGameState hook
 */
export interface UseGameStateResult {
  /** Current game state */
  gameState: GameState | null;
  /** Initialize a new game */
  initializeGame: (p1Name?: string, p2Name?: string) => void;
  /** Record a player's choice for current round */
  makeChoice: (playerId: 'p1' | 'p2', choice: Choice) => void;
  /** Reset to initial state */
  resetGame: () => void;
  /** Load existing game state */
  loadGame: (state: GameState) => void;
}

/**
 * Custom hook for managing game state with Prisoner's Dilemma logic
 *
 * Handles game initialization, player choices, round progression,
 * and game state updates following React 19 best practices.
 *
 * @returns Game state management utilities
 *
 * @example
 * ```tsx
 * function GameContainer() {
 *   const { gameState, initializeGame, makeChoice } = useGameState();
 *
 *   if (!gameState) {
 *     return <button onClick={() => initializeGame()}>Start Game</button>;
 *   }
 *
 *   return <GameBoard gameState={gameState} onChoice={makeChoice} />;
 * }
 * ```
 */
export function useGameState(): UseGameStateResult {
  const [gameState, setGameState] = useState<GameState | null>(null);

  /**
   * Initializes a new game with fresh state
   */
  const initializeGame = useCallback((p1Name?: string, p2Name?: string): void => {
    const newGame = createNewGame(p1Name, p2Name);
    setGameState({
      ...newGame,
      gamePhase: 'playing', // Start in playing phase
    });
  }, []);

  /**
   * Records a player's choice and handles game progression logic
   *
   * CRITICAL: Implements the simultaneous choice reveal mechanism
   * - If first choice: Store choice, wait for opponent
   * - If second choice: Store choice, calculate results, advance round
   */
  const makeChoice = useCallback(
    (playerId: 'p1' | 'p2', choice: Choice): void => {
      if (!gameState) {
        console.error('Cannot make choice: No active game');
        return;
      }

      const currentRoundIndex = gameState.currentRound;
      const currentRound = gameState.rounds[currentRoundIndex];

      if (!currentRound) {
        console.error('Cannot make choice: Current round not found');
        return;
      }

      if (currentRound.isComplete) {
        console.error('Cannot make choice: Round is already complete');
        return;
      }

      // Update round with player's choice
      const updatedRound = {
        ...currentRound,
        choices: {
          ...currentRound.choices,
          [playerId]: choice,
        },
      };

      // Check if both players have now chosen
      const bothChosen = canCalculateResults(updatedRound);

      let finalRound = updatedRound;
      let updatedGameState = { ...gameState };

      if (bothChosen) {
        // Calculate results since both players have chosen
        finalRound = calculateRoundResults(updatedRound);

        // Update rounds array
        const updatedRounds = gameState.rounds.map((round, index) =>
          index === currentRoundIndex ? finalRound : round
        );

        updatedGameState = {
          ...gameState,
          rounds: updatedRounds,
        };

        // Update totals with this round's results
        updatedGameState = updateTotals(updatedGameState, currentRoundIndex);

        // Advance to next round or finish game
        updatedGameState = advanceToNextRound(updatedGameState);
      } else {
        // Only one player has chosen, update rounds array
        const updatedRounds = gameState.rounds.map((round, index) =>
          index === currentRoundIndex ? finalRound : round
        );

        updatedGameState = {
          ...gameState,
          rounds: updatedRounds,
        };
      }

      // Update metadata
      updatedGameState = {
        ...updatedGameState,
        metadata: {
          ...updatedGameState.metadata,
          lastMoveAt: new Date().toISOString(),
          turnCount: updatedGameState.metadata.turnCount + 1,
        },
      };

      setGameState(updatedGameState);
    },
    [gameState]
  );

  /**
   * Resets game to null state
   */
  const resetGame = useCallback((): void => {
    setGameState(null);
  }, []);

  /**
   * Loads an existing game state (e.g., from URL)
   */
  const loadGame = useCallback((state: GameState): void => {
    setGameState(state);
  }, []);

  return {
    gameState,
    initializeGame,
    makeChoice,
    resetGame,
    loadGame,
  };
}
