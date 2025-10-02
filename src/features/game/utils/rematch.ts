/**
 * @fileoverview Rematch functionality for creating and processing rematch games
 * @module features/game/utils/rematch
 */

import { v4 as uuidv4 } from 'uuid';
import type { GameState } from '../schemas/gameSchema';
import type { CompletedGame } from '../types/history';
import { createNewGame } from './payoffCalculation';

/**
 * Converts a finished game state to a completed game record for history storage.
 *
 * @param gameState - Finished game state to convert
 * @returns Completed game record
 */
export function convertGameStateToCompletedGame(gameState: GameState): CompletedGame {
  // Determine winner
  let winner: 'p1' | 'p2' | 'tie';
  if (gameState.totals.p1Gold > gameState.totals.p2Gold) {
    winner = 'p1';
  } else if (gameState.totals.p2Gold > gameState.totals.p1Gold) {
    winner = 'p2';
  } else {
    winner = 'tie';
  }

  // Use metadata timestamps or generate new ones
  const startTime = gameState.metadata?.createdAt || new Date().toISOString();
  const endTime = gameState.rounds[4]?.completedAt || new Date().toISOString();

  return {
    gameId: gameState.gameId,
    startTime,
    endTime,
    playerNames: {
      p1: gameState.players.p1.name || 'Player 1',
      p2: gameState.players.p2.name || 'Player 2',
    },
    totals: {
      p1Gold: gameState.totals.p1Gold,
      p2Gold: gameState.totals.p2Gold,
    },
    rounds: gameState.rounds,
    finalMessage: gameState.socialFeatures?.finalMessage,
    winner,
  };
}

/**
 * Creates a new rematch game from a completed game.
 *
 * Key features:
 * - Generates new game ID
 * - Links to previous game via previousGameId
 * - Player 2 goes first (role reversal)
 * - Includes previousGameResults temporarily for P1's first view
 * - Fresh rounds with no choices
 * - Resets totals to zero
 *
 * @param completedGameState - The finished game state
 * @param previousGame - Completed game record to embed
 * @returns New game state for the rematch
 */
export function createRematchGame(
  completedGameState: GameState,
  previousGame: CompletedGame
): GameState {
  // Create base new game
  const newGame = createNewGame();

  // Set player names from previous game
  newGame.players.p1.name = completedGameState.players.p1.name;
  newGame.players.p2.name = completedGameState.players.p2.name;

  // Player 2 goes first in rematch
  newGame.players.p1.isActive = false;
  newGame.players.p2.isActive = true;

  // Link to previous game
  newGame.previousGameId = previousGame.gameId;

  // Embed previous game results (temporary, will be cleared after P1 sees it)
  newGame.previousGameResults = previousGame as any; // Type assertion for z.any() schema

  // Set game to playing phase (skip setup)
  newGame.gamePhase = 'playing';

  return newGame;
}

/**
 * Processes a rematch game state for Player 1's first view.
 *
 * Extracts the embedded previous game results and returns a cleaned game state
 * without the previousGameResults field (to keep URL size down after P1 has seen it).
 *
 * @param gameState - Game state that may contain previousGameResults
 * @returns Object with previous game (if any) and cleaned game state
 */
export function processRematchForP1(gameState: GameState): {
  previousGame: CompletedGame | null;
  cleanedGameState: GameState;
} {
  // Check if previousGameResults exists
  if (!gameState.previousGameResults) {
    return {
      previousGame: null,
      cleanedGameState: gameState,
    };
  }

  // Extract previous game
  const previousGame = gameState.previousGameResults as CompletedGame;

  // Create cleaned game state without previousGameResults
  const cleanedGameState: GameState = {
    ...gameState,
    previousGameResults: undefined,
  };

  return {
    previousGame,
    cleanedGameState,
  };
}

/**
 * Determines if a game state is a rematch invitation.
 * A game is a rematch invitation if it has previousGameResults embedded.
 *
 * @param gameState - Game state to check
 * @returns True if this is a rematch invitation
 */
export function isRematchInvitation(gameState: GameState): boolean {
  return gameState.previousGameResults !== undefined;
}

/**
 * Gets the rematch game label for display.
 * Shows which rematch number this is in the chain.
 *
 * @param gameState - Current game state
 * @param allGames - All completed games from history
 * @returns Label like "Rematch #2" or "New Game"
 */
export function getRematchLabel(gameState: GameState, allGames: CompletedGame[]): string {
  if (!gameState.previousGameId) {
    return 'New Game';
  }

  // Count how many games link back in the chain
  let count = 1;
  let currentId = gameState.previousGameId;

  while (currentId) {
    const previousGame = allGames.find(g => g.gameId === currentId);
    if (!previousGame) break;

    count++;
    // Note: We'd need to track previousGameId in CompletedGame to continue the chain
    // For now, just return the count
    break;
  }

  return `Rematch #${count}`;
}
