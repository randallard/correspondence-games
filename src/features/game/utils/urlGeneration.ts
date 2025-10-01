/**
 * @fileoverview URL generation utilities for game state sharing
 * @module features/game/utils/urlGeneration
 */

import { GameState } from '../schemas/gameSchema';
import { encryptGameState, decryptGameState, DecryptionError } from './encryption';
import { MAX_URL_LENGTH } from '../../../shared/utils/constants';

/**
 * Error thrown when URL generation fails
 */
export class URLGenerationError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'URLGenerationError';
  }
}

/**
 * Generates a shareable URL from game state
 *
 * CRITICAL: URL length is monitored and warned if exceeding MAX_URL_LENGTH
 *
 * @param gameState - The game state to encode in the URL
 * @param baseURL - Optional base URL (defaults to current window location)
 * @returns Complete shareable URL with encrypted state parameter
 * @throws {URLGenerationError} If URL generation fails
 *
 * @example
 * ```typescript
 * const gameState: GameState = { ... };
 * const url = generateShareableURL(gameState);
 * // url: https://example.com/game?s=<encrypted_state>
 * ```
 */
export function generateShareableURL(
  gameState: GameState,
  baseURL?: string
): string {
  try {
    const encrypted = encryptGameState(gameState);

    // Use provided base URL or construct from window location
    const base = baseURL || `${window.location.origin}${window.location.pathname}`;

    // Construct URL with state parameter
    const url = `${base}?s=${encrypted}`;

    // Warn if URL is getting close to browser limits
    if (url.length > MAX_URL_LENGTH) {
      console.warn(
        `Generated URL length (${url.length}) exceeds recommended maximum (${MAX_URL_LENGTH})`
      );
    }

    return url;
  } catch (error) {
    throw new URLGenerationError('Failed to generate shareable URL', error);
  }
}

/**
 * Generates a shareable URL from game state with an optional message
 *
 * Adds a message to the socialFeatures.finalMessage field before encoding
 *
 * @param gameState - The game state to encode in the URL
 * @param message - The message text to include (max 500 characters)
 * @param from - Which player is sending the message ('p1' or 'p2')
 * @param baseURL - Optional base URL (defaults to current window location)
 * @returns Complete shareable URL with encrypted state parameter including message
 * @throws {URLGenerationError} If URL generation fails
 *
 * @example
 * ```typescript
 * const gameState: GameState = { ... };
 * const url = generateShareableURLWithMessage(gameState, 'Good game!', 'p2');
 * // url: https://example.com/game?s=<encrypted_state_with_message>
 * ```
 */
export function generateShareableURLWithMessage(
  gameState: GameState,
  message: string,
  from: 'p1' | 'p2',
  baseURL?: string
): string {
  try {
    // Clone game state to avoid mutating original
    const stateWithMessage: GameState = {
      ...gameState,
      socialFeatures: {
        ...gameState.socialFeatures,
        finalMessage: message.trim() ? {
          from,
          text: message.trim().substring(0, 500), // Enforce 500 char limit
          timestamp: new Date().toISOString(),
        } : undefined,
      },
    };

    return generateShareableURL(stateWithMessage, baseURL);
  } catch (error) {
    throw new URLGenerationError('Failed to generate shareable URL with message', error);
  }
}

/**
 * Extracts encrypted game state from URL parameters
 *
 * @param url - Optional URL string (defaults to window.location.href)
 * @returns Encrypted state string or null if not found
 *
 * @example
 * ```typescript
 * const encoded = getEncodedStateFromURL();
 * if (encoded) {
 *   const gameState = decryptGameState(encoded);
 * }
 * ```
 */
export function getEncodedStateFromURL(url?: string): string | null {
  try {
    const urlObj = url ? new URL(url) : new URL(window.location.href);
    return urlObj.searchParams.get('s');
  } catch (error) {
    console.error('Failed to parse URL:', error);
    return null;
  }
}

/**
 * Checks if a URL contains valid game state
 *
 * Useful for conditional rendering and error handling
 *
 * @param url - Optional URL string (defaults to window.location.href)
 * @returns True if URL contains a state parameter, false otherwise
 *
 * @example
 * ```typescript
 * if (hasGameStateInURL()) {
 *   // Load existing game
 * } else {
 *   // Show new game setup
 * }
 * ```
 */
export function hasGameStateInURL(url?: string): boolean {
  const encoded = getEncodedStateFromURL(url);
  return encoded !== null && encoded.length > 0;
}

/**
 * Generates a URL for a new game (without state parameter)
 *
 * Useful for "New Game" buttons and navigation
 *
 * @param baseURL - Optional base URL (defaults to current window location)
 * @returns Clean URL without query parameters
 *
 * @example
 * ```typescript
 * const newGameURL = generateNewGameURL();
 * window.location.href = newGameURL;
 * ```
 */
export function generateNewGameURL(baseURL?: string): string {
  const base = baseURL || `${window.location.origin}${window.location.pathname}`;
  return base;
}

/**
 * Updates browser URL with new game state without page reload
 *
 * Uses History API to update URL in place
 *
 * @param gameState - The game state to encode in the URL
 * @throws {URLGenerationError} If URL update fails
 *
 * @example
 * ```typescript
 * // After player makes a move
 * const newState = { ...gameState, currentRound: 2 };
 * updateURLWithState(newState);
 * // URL is updated, but page doesn't reload
 * ```
 */
export function updateURLWithState(gameState: GameState): void {
  try {
    const url = generateShareableURL(gameState);
    window.history.replaceState(null, '', url);
  } catch (error) {
    throw new URLGenerationError('Failed to update URL with game state', error);
  }
}

/**
 * Parses and validates game state from current URL
 *
 * Combines extraction, decryption, and validation in one function
 * Returns null for invalid or missing state
 *
 * @returns Validated game state or null
 *
 * @example
 * ```typescript
 * const gameState = parseGameStateFromURL();
 * if (gameState) {
 *   // Load game with validated state
 * } else {
 *   // Show new game setup
 * }
 * ```
 */
export function parseGameStateFromURL(): GameState | null {
  try {
    const encoded = getEncodedStateFromURL();
    if (!encoded) {
      return null;
    }

    // decryptGameState already validates with Zod
    return decryptGameState(encoded);
  } catch (error) {
    if (error instanceof DecryptionError) {
      console.error('Failed to decrypt game state from URL:', error);
    }
    return null;
  }
}
