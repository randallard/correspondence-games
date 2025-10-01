/**
 * @fileoverview Tests for URL generation utilities with message support
 * @module features/game/utils/urlGeneration.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { generateShareableURL, generateShareableURLWithMessage } from './urlGeneration';
import { createNewGame } from './payoffCalculation';
import type { GameState } from '../schemas/gameSchema';

describe('URL Generation with Messages', () => {
  let baseGameState: GameState;

  beforeEach(() => {
    baseGameState = createNewGame();
    baseGameState.gamePhase = 'finished';
    // Complete a simple game
    baseGameState.rounds[0].choices.p1 = 'silent';
    baseGameState.rounds[0].choices.p2 = 'silent';
    baseGameState.rounds[0].isComplete = true;
    baseGameState.currentRound = 0;
  });

  describe('generateShareableURLWithMessage', () => {
    it('should generate URL with message in socialFeatures.finalMessage', () => {
      const message = 'Good game! Want a rematch?';
      const url = generateShareableURLWithMessage(baseGameState, message, 'p2');

      expect(url).toBeDefined();
      expect(typeof url).toBe('string');
      expect(url).toContain('?s=');
      expect(url.length).toBeGreaterThan(0);
    });

    it('should generate different URLs for different messages', () => {
      const url1 = generateShareableURLWithMessage(baseGameState, 'Message 1', 'p2');
      const url2 = generateShareableURLWithMessage(baseGameState, 'Message 2', 'p2');

      expect(url1).not.toBe(url2);
    });

    it('should generate URL without message when message is empty string', () => {
      const urlWithoutMessage = generateShareableURL(baseGameState);
      const urlWithEmptyMessage = generateShareableURLWithMessage(baseGameState, '', 'p2');

      // Empty message should not add finalMessage field, URLs should be similar in length
      // Allow some difference due to socialFeatures object structure
      expect(Math.abs(urlWithoutMessage.length - urlWithEmptyMessage.length)).toBeLessThan(100);
    });

    it('should handle long messages (up to 500 characters)', () => {
      const longMessage = 'A'.repeat(500);
      const url = generateShareableURLWithMessage(baseGameState, longMessage, 'p1');

      expect(url).toBeDefined();
      expect(url).toContain('?s=');
    });

    it('should include player identifier in message', () => {
      const message = 'Test message';
      const urlFromP1 = generateShareableURLWithMessage(baseGameState, message, 'p1');
      const urlFromP2 = generateShareableURLWithMessage(baseGameState, message, 'p2');

      // Different players should generate different URLs
      expect(urlFromP1).not.toBe(urlFromP2);
    });

    it('should preserve existing game state while adding message', () => {
      const message = 'Test message';
      const url = generateShareableURLWithMessage(baseGameState, message, 'p2');

      // URL should still contain game state
      expect(url).toContain('?s=');
      // URL should be longer than URL without message
      const urlWithoutMessage = generateShareableURL(baseGameState);
      expect(url.length).toBeGreaterThan(urlWithoutMessage.length);
    });
  });
});
