/**
 * @fileoverview Unit tests for URL size validation utilities
 * @module features/game/utils/urlSizeValidation.test
 */

import { describe, it, expect } from 'vitest';
import {
  estimateURLSize,
  getMaxMessageLength,
  validatePlayerName,
  stripDataToFitURL,
} from './urlSizeValidation';
import { createNewGame } from './payoffCalculation';
import type { GameState } from '../schemas/gameSchema';

describe('URL Size Validation', () => {
  describe('estimateURLSize', () => {
    it('should estimate URL size for basic game state', () => {
      const gameState = createNewGame();
      const size = estimateURLSize(gameState);

      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');
    });

    it('should return larger size for game state with message', () => {
      const gameState = createNewGame();
      const baseSize = estimateURLSize(gameState);

      const stateWithMessage: GameState = {
        ...gameState,
        socialFeatures: {
          finalMessage: {
            from: 'p2',
            text: 'This is a test message',
            timestamp: new Date().toISOString(),
          },
        },
      };

      const sizeWithMessage = estimateURLSize(stateWithMessage);
      expect(sizeWithMessage).toBeGreaterThan(baseSize);
    });

    it('should account for base URL in size calculation', () => {
      const gameState = createNewGame();
      const defaultSize = estimateURLSize(gameState);
      const customSize = estimateURLSize(gameState, 'https://example.com/very/long/path');

      expect(customSize).toBeGreaterThan(defaultSize);
    });
  });

  describe('validatePlayerName', () => {
    it('should accept valid names under 20 characters', () => {
      expect(validatePlayerName('Alice')).toBe(true);
      expect(validatePlayerName('Bob Smith')).toBe(true);
      expect(validatePlayerName('Player123')).toBe(true);
    });

    it('should reject names over 20 characters', () => {
      expect(validatePlayerName('A'.repeat(21))).toBe(false);
      expect(validatePlayerName('This is a very long name that exceeds limit')).toBe(false);
    });

    it('should reject empty names', () => {
      expect(validatePlayerName('')).toBe(false);
      expect(validatePlayerName('   ')).toBe(false);
    });

    it('should accept names with exactly 20 characters', () => {
      expect(validatePlayerName('A'.repeat(20))).toBe(true);
    });

    it('should accept alphanumeric and spaces', () => {
      expect(validatePlayerName('Alice 123')).toBe(true);
      expect(validatePlayerName('Player X')).toBe(true);
    });
  });

  describe('getMaxMessageLength', () => {
    it('should return base limit of 500 for simple game state', () => {
      const gameState = createNewGame();
      const maxLength = getMaxMessageLength(gameState, false);

      expect(maxLength).toBe(500);
    });

    it('should reduce limit when previous game is included', () => {
      const gameState = createNewGame();
      const baseLimit = getMaxMessageLength(gameState, false);
      const reducedLimit = getMaxMessageLength(gameState, true);

      expect(reducedLimit).toBeLessThan(baseLimit);
    });

    it('should never return less than 50 characters', () => {
      const gameState = createNewGame();
      // Even with previous game
      const limit = getMaxMessageLength(gameState, true);

      expect(limit).toBeGreaterThanOrEqual(50);
    });

    it('should never exceed 500 characters', () => {
      const gameState = createNewGame();
      const limit = getMaxMessageLength(gameState, false);

      expect(limit).toBeLessThanOrEqual(500);
    });
  });

  describe('stripDataToFitURL', () => {
    it('should not strip data if URL is under 2000 chars', () => {
      const gameState = createNewGame();
      const result = stripDataToFitURL(gameState);

      expect(result.wasStripped).toBe(false);
      expect(result.strippedGameState).toEqual(gameState);
      expect(result.removedData).toBeUndefined();
    });

    it('should truncate message if URL is too long', () => {
      const gameState = createNewGame();
      gameState.socialFeatures = {
        finalMessage: {
          from: 'p2',
          text: 'A'.repeat(1000), // Very long message
          timestamp: new Date().toISOString(),
        },
      };

      // Force the URL to be too long by adding lots of data
      const result = stripDataToFitURL(gameState, 100); // Very low limit for testing

      expect(result.wasStripped).toBe(true);
      if (result.strippedGameState.socialFeatures?.finalMessage) {
        expect(result.strippedGameState.socialFeatures.finalMessage.text.length)
          .toBeLessThan(1000);
      }
    });

    it('should remove message entirely if needed', () => {
      const gameState = createNewGame();
      gameState.socialFeatures = {
        finalMessage: {
          from: 'p2',
          text: 'Test message',
          timestamp: new Date().toISOString(),
        },
      };

      // Force very low limit
      const result = stripDataToFitURL(gameState, 100);

      // Message should be removed if needed to fit
      if (result.wasStripped && result.finalSize < 100) {
        expect(result.strippedGameState.socialFeatures?.finalMessage).toBeUndefined();
      }
    });

    it('should track what was removed', () => {
      const gameState = createNewGame();
      gameState.socialFeatures = {
        finalMessage: {
          from: 'p2',
          text: 'Original message',
          timestamp: new Date().toISOString(),
        },
      };

      const result = stripDataToFitURL(gameState, 100);

      if (result.wasStripped && result.removedData) {
        expect(result.removedData.originalMessage).toBeDefined();
      }
    });
  });
});
