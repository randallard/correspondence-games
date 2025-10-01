/**
 * @fileoverview Custom hook for URL-based state management
 * @module features/game/hooks/useURLState
 */

import { useState, useEffect, useCallback } from 'react';
import { GameState } from '../schemas/gameSchema';
import {
  generateShareableURL,
  parseGameStateFromURL,
  updateURLWithState,
} from '../utils/urlGeneration';

/**
 * Result type for useURLState hook
 */
export interface UseURLStateResult {
  /** Game state loaded from URL (null if invalid or not present) */
  urlGameState: GameState | null;
  /** Whether URL is being parsed */
  isLoading: boolean;
  /** Error that occurred during URL parsing */
  error: Error | null;
  /** Generate shareable URL from game state */
  generateURL: (gameState: GameState) => string;
  /** Update browser URL without reload */
  updateURL: (gameState: GameState) => void;
}

/**
 * Custom hook for managing game state in URL parameters
 *
 * Handles:
 * - Loading game state from URL on mount
 * - Generating shareable URLs
 * - Updating URL without page reload
 *
 * @returns URL state management utilities
 *
 * @example
 * ```tsx
 * function Game() {
 *   const { urlGameState, isLoading, error, generateURL } = useURLState();
 *
 *   if (isLoading) return <Loading />;
 *   if (error) return <Error error={error} />;
 *   if (!urlGameState) return <NewGame />;
 *
 *   const shareURL = generateURL(urlGameState);
 *   return <GamePlay state={urlGameState} shareURL={shareURL} />;
 * }
 * ```
 */
export function useURLState(): UseURLStateResult {
  const [urlGameState, setURLGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Load game state from URL on mount
   */
  useEffect(() => {
    const loadStateFromURL = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('🔍 Parsing URL for game state...');
        const state = parseGameStateFromURL();

        if (state) {
          console.log('✅ Found game state in URL:', {
            gameId: state.gameId,
            currentRound: state.currentRound,
            phase: state.gamePhase,
            p1Choice: state.rounds[state.currentRound]?.choices.p1,
            p2Choice: state.rounds[state.currentRound]?.choices.p2,
          });
          setURLGameState(state);
        } else {
          console.log('ℹ️ No game state in URL - new game');
          setURLGameState(null);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load game from URL');
        console.error('❌ Error loading game state from URL:', error);
        setError(error);
        setURLGameState(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadStateFromURL();
  }, []); // Only run on mount

  /**
   * Generate shareable URL from game state
   */
  const generateURL = useCallback((gameState: GameState): string => {
    try {
      return generateShareableURL(gameState);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to generate URL');
      console.error('Error generating shareable URL:', error);
      // Return current URL as fallback
      return window.location.href;
    }
  }, []);

  /**
   * Update browser URL without page reload
   */
  const updateURL = useCallback((gameState: GameState): void => {
    try {
      updateURLWithState(gameState);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update URL');
      console.error('Error updating URL:', error);
      // Non-critical error, don't block user flow
    }
  }, []);

  return {
    urlGameState,
    isLoading,
    error,
    generateURL,
    updateURL,
  };
}
