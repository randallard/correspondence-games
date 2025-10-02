/**
 * @fileoverview URL size validation and data stripping utilities
 * @module features/game/utils/urlSizeValidation
 */

import type { GameState } from '../schemas/gameSchema';
import { encryptGameState } from './encryption';

/** Maximum URL length for browser compatibility */
export const MAX_URL_LENGTH = 2000;

/** Maximum player name length */
export const MAX_NAME_LENGTH = 20;

/** Base message length limit */
export const BASE_MESSAGE_LENGTH = 500;

/** Minimum message length when stripping data */
export const MIN_MESSAGE_LENGTH = 50;

/** Safety buffer for URL size calculations */
const SAFETY_BUFFER = 200;

/** Estimated size of previous game results in URL */
const PREVIOUS_GAME_SIZE_ESTIMATE = 800;

/**
 * Interface for stripped data tracking
 */
export interface StrippedData {
  /** Original message text that was truncated or removed */
  originalMessage?: string;
  /** Previous game results that were removed */
  previousGameResults?: unknown;
  /** Timestamp when data was stripped */
  timestamp: string;
  /** Reason for stripping */
  reason: string;
}

/**
 * Result of strip operation
 */
export interface StripResult {
  /** Whether data was stripped */
  wasStripped: boolean;
  /** Game state after stripping */
  strippedGameState: GameState;
  /** Data that was removed */
  removedData?: StrippedData;
  /** Final URL size */
  finalSize: number;
}

/**
 * Estimates the URL size for a given game state.
 * Takes into account JSON serialization, encryption, and base URL.
 *
 * @param gameState - Game state to estimate size for
 * @param baseURL - Optional base URL (defaults to current origin)
 * @returns Estimated URL length in characters
 */
export function estimateURLSize(gameState: GameState, baseURL?: string): number {
  try {
    // Serialize game state
    const json = JSON.stringify(gameState);

    // Encrypt and encode (this adds ~33% overhead)
    const encrypted = encryptGameState(gameState);

    // Build full URL
    const base = baseURL || window.location.origin;
    const fullURL = `${base}?s=${encrypted}`;

    return fullURL.length;
  } catch (error) {
    console.error('Failed to estimate URL size:', error);
    // Return conservative estimate
    return MAX_URL_LENGTH + 1;
  }
}

/**
 * Validates a player name.
 * Rules: 1-20 characters, alphanumeric and spaces only, not all whitespace
 *
 * @param name - Player name to validate
 * @returns True if valid, false otherwise
 */
export function validatePlayerName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }

  const trimmed = name.trim();

  // Check length
  if (trimmed.length === 0 || trimmed.length > MAX_NAME_LENGTH) {
    return false;
  }

  // Check characters (alphanumeric and spaces only)
  const validPattern = /^[a-zA-Z0-9 ]+$/;
  return validPattern.test(name);
}

/**
 * Calculates the maximum message length based on current game state and URL constraints.
 * Dynamically adjusts based on whether previous game results are included.
 *
 * @param currentGameState - Current game state
 * @param hasPreviousGame - Whether previous game results will be included
 * @param baseURL - Optional base URL for size calculation
 * @returns Maximum allowed message length
 */
export function getMaxMessageLength(
  currentGameState: GameState,
  hasPreviousGame: boolean,
  baseURL?: string
): number {
  // Estimate current game state size without message
  const stateWithoutMessage: GameState = {
    ...currentGameState,
    socialFeatures: undefined,
  };

  const baseSize = estimateURLSize(stateWithoutMessage, baseURL);
  const previousGameSize = hasPreviousGame ? PREVIOUS_GAME_SIZE_ESTIMATE : 0;

  // Calculate available space
  const available = MAX_URL_LENGTH - baseSize - previousGameSize - SAFETY_BUFFER;

  // Constrain to min/max bounds
  const maxMessage = Math.min(
    BASE_MESSAGE_LENGTH,
    Math.max(MIN_MESSAGE_LENGTH, available)
  );

  return maxMessage;
}

/**
 * Strips data from game state to fit within URL size limit.
 * Strips in order: truncate message -> remove message -> remove previous game results
 *
 * @param gameState - Game state to strip
 * @param targetSize - Target URL size (defaults to MAX_URL_LENGTH)
 * @param baseURL - Optional base URL
 * @returns Strip result with modified game state and removed data
 */
export function stripDataToFitURL(
  gameState: GameState,
  targetSize: number = MAX_URL_LENGTH,
  baseURL?: string
): StripResult {
  const originalSize = estimateURLSize(gameState, baseURL);

  // If already under limit, no stripping needed
  if (originalSize <= targetSize) {
    return {
      wasStripped: false,
      strippedGameState: gameState,
      finalSize: originalSize,
    };
  }

  const removedData: StrippedData = {
    timestamp: new Date().toISOString(),
    reason: 'URL size limit exceeded',
  };

  let strippedState = { ...gameState };

  // Step 1: Try truncating message to MIN_MESSAGE_LENGTH
  if (strippedState.socialFeatures?.finalMessage) {
    const originalMessage = strippedState.socialFeatures.finalMessage.text;
    removedData.originalMessage = originalMessage;

    strippedState = {
      ...strippedState,
      socialFeatures: {
        ...strippedState.socialFeatures,
        finalMessage: {
          ...strippedState.socialFeatures.finalMessage,
          text: originalMessage.substring(0, MIN_MESSAGE_LENGTH),
        },
      },
    };

    const newSize = estimateURLSize(strippedState, baseURL);
    if (newSize <= targetSize) {
      return {
        wasStripped: true,
        strippedGameState: strippedState,
        removedData,
        finalSize: newSize,
      };
    }
  }

  // Step 2: Remove message entirely
  if (strippedState.socialFeatures?.finalMessage) {
    if (!removedData.originalMessage) {
      removedData.originalMessage = strippedState.socialFeatures.finalMessage.text;
    }

    strippedState = {
      ...strippedState,
      socialFeatures: {
        ...strippedState.socialFeatures,
        finalMessage: undefined,
      },
    };

    const newSize = estimateURLSize(strippedState, baseURL);
    if (newSize <= targetSize) {
      return {
        wasStripped: true,
        strippedGameState: strippedState,
        removedData,
        finalSize: newSize,
      };
    }
  }

  // Step 3: Remove previous game results (if present)
  // Note: This would be added when we implement the rematch feature
  // For now, just return the stripped state

  const finalSize = estimateURLSize(strippedState, baseURL);

  return {
    wasStripped: true,
    strippedGameState: strippedState,
    removedData,
    finalSize,
  };
}
