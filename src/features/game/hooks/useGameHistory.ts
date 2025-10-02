/**
 * @fileoverview Custom hook for managing game history with localStorage
 * @module features/game/hooks/useGameHistory
 */

import { useState, useCallback, useEffect } from 'react';
import type { CompletedGame, GameHistory } from '../types/history';
import {
  getGameHistory,
  saveCompletedGame,
  clearGameHistory,
  getPlayerName,
  setPlayerName as setPlayerNameInStorage,
} from '../hooks/useLocalStorage';

/** Maximum number of games to keep in history */
const MAX_HISTORY_SIZE = 50;

/**
 * Result type for useGameHistory hook.
 */
export interface UseGameHistoryResult {
  /** Current player name */
  playerName: string | null;
  /** Array of completed games */
  games: CompletedGame[];
  /** Adds a completed game to history (enforces max size) */
  addCompletedGame: (game: CompletedGame) => void;
  /** Clears all game history but preserves player name */
  clearHistory: () => void;
  /** Removes a specific game from history */
  removeGame: (gameId: string) => void;
  /** Sets the player name */
  setPlayerName: (name: string) => void;
  /** Whether history data is loading */
  isLoading: boolean;
}

/**
 * Custom hook for managing game history with localStorage.
 *
 * Provides a convenient interface for:
 * - Accessing game history
 * - Adding completed games
 * - Managing player name
 * - Clearing history
 *
 * Features:
 * - Automatic size limiting (max 50 games)
 * - SSR-safe localStorage access
 * - Error handling with fallback to empty state
 *
 * @returns Game history management utilities
 *
 * @example
 * ```tsx
 * function GameContainer() {
 *   const { games, playerName, addCompletedGame } = useGameHistory();
 *
 *   return (
 *     <div>
 *       <p>Welcome, {playerName}!</p>
 *       <p>Games played: {games.length}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useGameHistory(): UseGameHistoryResult {
  const [history, setHistory] = useState<GameHistory | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load history on mount (SSR-safe)
  useEffect(() => {
    // Only access localStorage in browser
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    try {
      const loadedHistory = getGameHistory();
      setHistory(loadedHistory);
    } catch (error) {
      console.error('Failed to load game history:', error);
      // Fallback to empty history
      setHistory({
        playerName: '',
        sessionId: `session-${Date.now()}`,
        games: [],
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Adds a completed game to history with size limiting.
   */
  const addCompletedGame = useCallback((game: CompletedGame): void => {
    try {
      // Save to localStorage
      saveCompletedGame(game);

      // Update local state
      setHistory(prev => {
        if (!prev) return prev;

        const updatedGames = [...prev.games, game];

        // Enforce max size (keep most recent)
        if (updatedGames.length > MAX_HISTORY_SIZE) {
          updatedGames.splice(0, updatedGames.length - MAX_HISTORY_SIZE);
        }

        return {
          ...prev,
          games: updatedGames,
        };
      });
    } catch (error) {
      console.error('Failed to add game to history:', error);
      throw error;
    }
  }, []);

  /**
   * Clears all game history but preserves player name and session ID.
   */
  const clearHistory = useCallback((): void => {
    try {
      clearGameHistory();

      // Update local state
      setHistory(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          games: [],
        };
      });
    } catch (error) {
      console.error('Failed to clear history:', error);
      throw error;
    }
  }, []);

  /**
   * Removes a specific game from history by game ID.
   */
  const removeGame = useCallback((gameId: string): void => {
    try {
      setHistory(prev => {
        if (!prev) return prev;

        const updatedGames = prev.games.filter(g => g.gameId !== gameId);

        // Re-save to localStorage
        const updatedHistory = {
          ...prev,
          games: updatedGames,
        };

        // Save directly using localStorage (since we don't have a removeGame in useLocalStorage)
        localStorage.setItem('prisoners-dilemma-history', JSON.stringify(updatedHistory));

        return updatedHistory;
      });
    } catch (error) {
      console.error('Failed to remove game from history:', error);
      throw error;
    }
  }, []);

  /**
   * Sets the player name in history.
   */
  const setPlayerName = useCallback((name: string): void => {
    try {
      setPlayerNameInStorage(name);

      // Update local state
      setHistory(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          playerName: name,
        };
      });
    } catch (error) {
      console.error('Failed to set player name:', error);
      throw error;
    }
  }, []);

  return {
    playerName: history?.playerName || null,
    games: history?.games || [],
    addCompletedGame,
    clearHistory,
    removeGame,
    setPlayerName,
    isLoading,
  };
}
