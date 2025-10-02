/**
 * @fileoverview Unit tests for rematch functionality
 * @module features/game/utils/rematch.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createRematchGame,
  processRematchForP1,
  convertGameStateToCompletedGame,
} from './rematch';
import { createNewGame } from './payoffCalculation';
import type { GameState } from '../schemas/gameSchema';
import type { CompletedGame } from '../types/history';

// Mock localStorage functions
vi.mock('../hooks/useLocalStorage', () => ({
  saveCompletedGame: vi.fn(),
  getPlayerName: vi.fn(() => 'TestPlayer'),
}));

describe('Rematch Utilities', () => {
  let completedGameState: GameState;

  beforeEach(() => {
    // Create a completed game state
    completedGameState = createNewGame();
    completedGameState.gamePhase = 'finished';
    completedGameState.currentRound = 4;
    completedGameState.players.p1.name = 'Alice';
    completedGameState.players.p2.name = 'Bob';

    // Complete all rounds
    for (let i = 0; i < 5; i++) {
      completedGameState.rounds[i].choices = { p1: 'silent', p2: 'silent' };
      completedGameState.rounds[i].results = { p1Gold: 3, p2Gold: 3 };
      completedGameState.rounds[i].isComplete = true;
      completedGameState.rounds[i].completedAt = new Date().toISOString();
    }

    completedGameState.totals = { p1Gold: 15, p2Gold: 15 };
  });

  describe('convertGameStateToCompletedGame', () => {
    it('should convert finished game state to completed game', () => {
      const completedGame = convertGameStateToCompletedGame(completedGameState);

      expect(completedGame.gameId).toBe(completedGameState.gameId);
      expect(completedGame.playerNames.p1).toBe('Alice');
      expect(completedGame.playerNames.p2).toBe('Bob');
      expect(completedGame.totals.p1Gold).toBe(15);
      expect(completedGame.totals.p2Gold).toBe(15);
      expect(completedGame.rounds).toHaveLength(5);
    });

    it('should determine winner correctly', () => {
      completedGameState.totals = { p1Gold: 18, p2Gold: 12 };
      const completedGame = convertGameStateToCompletedGame(completedGameState);

      expect(completedGame.winner).toBe('p1');
    });

    it('should detect tie', () => {
      completedGameState.totals = { p1Gold: 15, p2Gold: 15 };
      const completedGame = convertGameStateToCompletedGame(completedGameState);

      expect(completedGame.winner).toBe('tie');
    });

    it('should include final message if present', () => {
      completedGameState.socialFeatures = {
        finalMessage: {
          from: 'p2',
          text: 'Good game!',
          timestamp: new Date().toISOString(),
        },
      };

      const completedGame = convertGameStateToCompletedGame(completedGameState);

      expect(completedGame.finalMessage).toBeDefined();
      expect(completedGame.finalMessage?.text).toBe('Good game!');
    });

    it('should set start and end times', () => {
      const completedGame = convertGameStateToCompletedGame(completedGameState);

      expect(completedGame.startTime).toBeDefined();
      expect(completedGame.endTime).toBeDefined();
      expect(new Date(completedGame.startTime)).toBeInstanceOf(Date);
      expect(new Date(completedGame.endTime)).toBeInstanceOf(Date);
    });
  });

  describe('createRematchGame', () => {
    it('should create new game with new gameId', () => {
      const previousGame = convertGameStateToCompletedGame(completedGameState);
      const rematchGame = createRematchGame(completedGameState, previousGame);

      expect(rematchGame.gameId).not.toBe(completedGameState.gameId);
      expect(rematchGame.gameId).toBeDefined();
    });

    it('should link to previous game', () => {
      const previousGame = convertGameStateToCompletedGame(completedGameState);
      const rematchGame = createRematchGame(completedGameState, previousGame);

      expect(rematchGame.previousGameId).toBe(previousGame.gameId);
    });

    it('should preserve player names', () => {
      const previousGame = convertGameStateToCompletedGame(completedGameState);
      const rematchGame = createRematchGame(completedGameState, previousGame);

      expect(rematchGame.players.p1.name).toBe('Alice');
      expect(rematchGame.players.p2.name).toBe('Bob');
    });

    it('should set P2 as first to move', () => {
      const previousGame = convertGameStateToCompletedGame(completedGameState);
      const rematchGame = createRematchGame(completedGameState, previousGame);

      expect(rematchGame.players.p2.isActive).toBe(true);
      expect(rematchGame.players.p1.isActive).toBe(false);
    });

    it('should start fresh with round 1', () => {
      const previousGame = convertGameStateToCompletedGame(completedGameState);
      const rematchGame = createRematchGame(completedGameState, previousGame);

      expect(rematchGame.currentRound).toBe(0);
      expect(rematchGame.gamePhase).toBe('playing');
      expect(rematchGame.rounds[0].choices.p1).toBeUndefined();
      expect(rematchGame.rounds[0].choices.p2).toBeUndefined();
    });

    it('should reset totals to zero', () => {
      const previousGame = convertGameStateToCompletedGame(completedGameState);
      const rematchGame = createRematchGame(completedGameState, previousGame);

      expect(rematchGame.totals.p1Gold).toBe(0);
      expect(rematchGame.totals.p2Gold).toBe(0);
    });

    it('should include previousGameResults for P1', () => {
      const previousGame = convertGameStateToCompletedGame(completedGameState);
      const rematchGame = createRematchGame(completedGameState, previousGame);

      expect(rematchGame.previousGameResults).toBeDefined();
      expect(rematchGame.previousGameResults).toEqual(previousGame);
    });
  });

  describe('processRematchForP1', () => {
    it('should extract previous game results', () => {
      const previousGame = convertGameStateToCompletedGame(completedGameState);
      const rematchGame = createRematchGame(completedGameState, previousGame);

      const result = processRematchForP1(rematchGame);

      expect(result.previousGame).toBeDefined();
      expect(result.previousGame?.gameId).toBe(previousGame.gameId);
    });

    it('should remove previousGameResults from game state', () => {
      const previousGame = convertGameStateToCompletedGame(completedGameState);
      const rematchGame = createRematchGame(completedGameState, previousGame);

      const result = processRematchForP1(rematchGame);

      expect(result.cleanedGameState.previousGameResults).toBeUndefined();
    });

    it('should return null if no previous game results', () => {
      const gameWithoutPrevious = createNewGame();

      const result = processRematchForP1(gameWithoutPrevious);

      expect(result.previousGame).toBeNull();
      expect(result.cleanedGameState).toEqual(gameWithoutPrevious);
    });

    it('should preserve all other game state properties', () => {
      const previousGame = convertGameStateToCompletedGame(completedGameState);
      const rematchGame = createRematchGame(completedGameState, previousGame);

      const result = processRematchForP1(rematchGame);

      expect(result.cleanedGameState.gameId).toBe(rematchGame.gameId);
      expect(result.cleanedGameState.players).toEqual(rematchGame.players);
      expect(result.cleanedGameState.currentRound).toBe(rematchGame.currentRound);
      expect(result.cleanedGameState.previousGameId).toBe(rematchGame.previousGameId);
    });
  });
});
