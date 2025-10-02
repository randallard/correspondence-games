/**
 * @fileoverview Unit tests for localStorage game history service
 * @module features/game/hooks/useLocalStorage.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { GameHistory, CompletedGame } from '../types/history';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Import after mocking
import {
  getGameHistory,
  setPlayerName,
  getPlayerName,
  saveCompletedGame,
  clearGameHistory,
  exportGameHistory,
  importGameHistory,
  getSessionId,
} from './useLocalStorage';

describe('LocalStorage Service', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('Player Name Management', () => {
    it('should save player name to localStorage', () => {
      setPlayerName('Alice');

      expect(localStorageMock.setItem).toHaveBeenCalled();
      // Get the last call since getGameHistory saves first, then setPlayerName saves
      const calls = localStorageMock.setItem.mock.calls;
      const savedData = JSON.parse(calls[calls.length - 1][1]);
      expect(savedData.playerName).toBe('Alice');
    });

    it('should retrieve saved player name', () => {
      setPlayerName('Bob');
      const name = getPlayerName();

      expect(name).toBe('Bob');
    });

    it('should return null when no player name exists', () => {
      const name = getPlayerName();
      expect(name).toBeNull();
    });

    it('should enforce 20 character limit on player names', () => {
      const longName = 'A'.repeat(25);
      setPlayerName(longName);
      const name = getPlayerName();

      expect(name?.length).toBeLessThanOrEqual(20);
    });
  });

  describe('Session ID Management', () => {
    it('should generate session ID on first access', () => {
      const sessionId = getSessionId();

      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBeGreaterThan(0);
    });

    it('should persist session ID across calls', () => {
      const sessionId1 = getSessionId();
      const sessionId2 = getSessionId();

      expect(sessionId1).toBe(sessionId2);
    });
  });

  describe('Game History Storage', () => {
    const mockCompletedGame: CompletedGame = {
      gameId: 'game-123',
      startTime: '2025-10-01T10:00:00Z',
      endTime: '2025-10-01T10:15:00Z',
      playerNames: {
        p1: 'Alice',
        p2: 'Bob',
      },
      totals: {
        p1Gold: 15,
        p2Gold: 12,
      },
      rounds: [],
      winner: 'p1',
    };

    it('should save completed game to history', () => {
      saveCompletedGame(mockCompletedGame);
      const history = getGameHistory();

      expect(history.games).toHaveLength(1);
      expect(history.games[0]).toEqual(mockCompletedGame);
    });

    it('should append multiple games to history', () => {
      const game1 = { ...mockCompletedGame, gameId: 'game-1' };
      const game2 = { ...mockCompletedGame, gameId: 'game-2' };
      const game3 = { ...mockCompletedGame, gameId: 'game-3' };

      saveCompletedGame(game1);
      saveCompletedGame(game2);
      saveCompletedGame(game3);

      const history = getGameHistory();
      expect(history.games).toHaveLength(3);
    });

    it('should return empty array when no games exist', () => {
      const history = getGameHistory();

      expect(history.games).toEqual([]);
    });

    it('should maintain player name in history', () => {
      setPlayerName('Alice');
      saveCompletedGame(mockCompletedGame);

      const history = getGameHistory();
      expect(history.playerName).toBe('Alice');
    });
  });

  describe('Clear History', () => {
    it('should clear all game history but preserve player name', () => {
      setPlayerName('Alice');
      saveCompletedGame({
        gameId: 'game-1',
        startTime: '2025-10-01T10:00:00Z',
        endTime: '2025-10-01T10:15:00Z',
        playerNames: { p1: 'Alice', p2: 'Bob' },
        totals: { p1Gold: 10, p2Gold: 12 },
        rounds: [],
        winner: 'p2',
      });

      clearGameHistory();

      const history = getGameHistory();
      expect(history.games).toHaveLength(0);
      expect(getPlayerName()).toBe('Alice');
    });

    it('should preserve session ID after clearing history', () => {
      const originalSessionId = getSessionId();
      saveCompletedGame({
        gameId: 'game-1',
        startTime: '2025-10-01T10:00:00Z',
        endTime: '2025-10-01T10:15:00Z',
        playerNames: { p1: 'Alice', p2: 'Bob' },
        totals: { p1Gold: 10, p2Gold: 12 },
        rounds: [],
        winner: 'p2',
      });

      clearGameHistory();

      expect(getSessionId()).toBe(originalSessionId);
    });
  });

  describe('Backup and Restore', () => {
    it('should export game history as JSON string', () => {
      setPlayerName('Alice');
      saveCompletedGame({
        gameId: 'game-1',
        startTime: '2025-10-01T10:00:00Z',
        endTime: '2025-10-01T10:15:00Z',
        playerNames: { p1: 'Alice', p2: 'Bob' },
        totals: { p1Gold: 15, p2Gold: 10 },
        rounds: [],
        winner: 'p1',
      });

      const exported = exportGameHistory();

      expect(exported).toBeDefined();
      const parsed = JSON.parse(exported);
      expect(parsed.playerName).toBe('Alice');
      expect(parsed.games).toHaveLength(1);
    });

    it('should import and restore game history from JSON', () => {
      const mockHistory: GameHistory = {
        playerName: 'Charlie',
        sessionId: 'session-456',
        games: [
          {
            gameId: 'game-restored',
            startTime: '2025-10-01T09:00:00Z',
            endTime: '2025-10-01T09:15:00Z',
            playerNames: { p1: 'Charlie', p2: 'Diana' },
            totals: { p1Gold: 18, p2Gold: 14 },
            rounds: [],
            winner: 'p1',
          },
        ],
      };

      const jsonData = JSON.stringify(mockHistory);
      importGameHistory(jsonData);

      const restored = getGameHistory();
      expect(restored.playerName).toBe('Charlie');
      expect(restored.games).toHaveLength(1);
      expect(restored.games[0].gameId).toBe('game-restored');
    });

    it('should throw error when importing invalid JSON', () => {
      expect(() => {
        importGameHistory('invalid json {]');
      }).toThrow();
    });
  });
});
