/**
 * @fileoverview LocalStorage service for game history management
 * @module features/game/hooks/useLocalStorage
 */

import type { GameHistory, CompletedGame } from '../types/history';

/** LocalStorage key for game history data */
const STORAGE_KEY = 'prisoners-dilemma-history';

/** Maximum length for player names */
const MAX_NAME_LENGTH = 20;

/**
 * Generates a unique session ID for player fingerprinting.
 *
 * @returns Unique session ID
 */
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Saves the game history to localStorage.
 *
 * @param history - Game history to save
 */
function saveGameHistory(history: GameHistory): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save game history:', error);
    throw new Error('Failed to save game history to localStorage');
  }
}

/**
 * Retrieves the complete game history from localStorage.
 * If no history exists, returns a new empty history object.
 *
 * @returns Game history object
 */
export function getGameHistory(): GameHistory {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const newHistory: GameHistory = {
        playerName: '',
        sessionId: generateSessionId(),
        games: [],
      };
      // Persist the new session ID
      saveGameHistory(newHistory);
      return newHistory;
    }

    const parsed = JSON.parse(stored) as GameHistory;

    // Ensure sessionId exists (for backward compatibility)
    if (!parsed.sessionId) {
      parsed.sessionId = generateSessionId();
      saveGameHistory(parsed);
    }

    return parsed;
  } catch (error) {
    console.error('Failed to retrieve game history:', error);
    const newHistory: GameHistory = {
      playerName: '',
      sessionId: generateSessionId(),
      games: [],
    };
    saveGameHistory(newHistory);
    return newHistory;
  }
}

/**
 * Sets the player name in localStorage.
 * Enforces max length of 20 characters.
 *
 * @param name - Player name to save
 */
export function setPlayerName(name: string): void {
  const history = getGameHistory();
  const trimmedName = name.trim().substring(0, MAX_NAME_LENGTH);

  history.playerName = trimmedName;
  saveGameHistory(history);
}

/**
 * Retrieves the player name from localStorage.
 *
 * @returns Player name or null if not set
 */
export function getPlayerName(): string | null {
  const history = getGameHistory();
  return history.playerName || null;
}

/**
 * Retrieves the session ID from localStorage.
 * Generates a new one if it doesn't exist.
 *
 * @returns Session ID
 */
export function getSessionId(): string {
  const history = getGameHistory();

  if (!history.sessionId) {
    history.sessionId = generateSessionId();
    saveGameHistory(history);
  }

  return history.sessionId;
}

/**
 * Saves a completed game to the history.
 * Appends to existing games array.
 *
 * @param game - Completed game to save
 */
export function saveCompletedGame(game: CompletedGame): void {
  const history = getGameHistory();
  history.games.push(game);
  saveGameHistory(history);
}

/**
 * Clears all game history but preserves player name and session ID.
 */
export function clearGameHistory(): void {
  const history = getGameHistory();
  history.games = [];
  saveGameHistory(history);
}

/**
 * Exports the complete game history as a JSON string.
 * Used for backup functionality.
 *
 * @returns JSON string of game history
 */
export function exportGameHistory(): string {
  const history = getGameHistory();
  return JSON.stringify(history, null, 2);
}

/**
 * Imports game history from a JSON string.
 * Used for restore functionality.
 *
 * @param jsonData - JSON string containing game history
 * @throws Error if JSON is invalid
 */
export function importGameHistory(jsonData: string): void {
  try {
    const parsed = JSON.parse(jsonData) as GameHistory;

    // Validate the structure
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid game history format');
    }

    if (!Array.isArray(parsed.games)) {
      throw new Error('Invalid game history: games must be an array');
    }

    // Ensure sessionId exists
    if (!parsed.sessionId) {
      parsed.sessionId = generateSessionId();
    }

    saveGameHistory(parsed);
  } catch (error) {
    console.error('Failed to import game history:', error);
    throw new Error('Failed to import game history: ' + (error as Error).message);
  }
}

/**
 * Completely clears all data from localStorage.
 * WARNING: This removes everything including player name and session ID.
 */
export function clearAllData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
}
