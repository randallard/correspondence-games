/**
 * @fileoverview Encryption and decryption utilities for game state
 * @module features/game/utils/encryption
 *
 * This module handles the encryption pipeline:
 * GameState -> JSON -> Compress -> Encrypt + HMAC -> Base64 -> URL parameter
 *
 * CRITICAL SECURITY ARCHITECTURE:
 * - Encryption (AES-256) provides CONFIDENTIALITY (unreadable URLs)
 * - HMAC (SHA-256) provides INTEGRITY (tamper detection)
 * - Both are required - encryption alone does NOT prevent tampering
 *
 * CRITICAL: All external data MUST be validated after decryption
 *
 * TODO: Add HMAC signature generation and verification
 * Current implementation only has encryption (confidentiality)
 * Need to add HMAC for integrity verification (see PRD section on DeltaURLGenerator)
 */

import CryptoJS from 'crypto-js';
import LZString from 'lz-string';
import { GameState, validateGameState } from '../schemas/gameSchema';
import { GAME_SECRET } from '../../../shared/utils/constants';

/**
 * Error thrown when encryption operations fail
 */
export class EncryptionError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'EncryptionError';
  }
}

/**
 * Error thrown when decryption operations fail
 */
export class DecryptionError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'DecryptionError';
  }
}

/**
 * Encrypts game state for URL sharing
 *
 * Pipeline: GameState -> JSON -> Compress (LZ-String) -> Encrypt (AES) -> Base64
 *
 * CRITICAL: Uses compressToEncodedURIComponent for URL-safe output
 * CRITICAL: Proper UTF8 encoding is essential for Crypto-JS
 *
 * @param gameState - The game state to encrypt
 * @returns Base64-encoded encrypted string suitable for URLs
 * @throws {EncryptionError} If encryption fails at any step
 *
 * @example
 * ```typescript
 * const gameState: GameState = { ... };
 * const encrypted = encryptGameState(gameState);
 * const url = `https://example.com/game?s=${encrypted}`;
 * ```
 */
export function encryptGameState(gameState: GameState): string {
  try {
    // Step 1: Convert game state to JSON string
    const json = JSON.stringify(gameState);

    // Step 2: Compress using LZ-String for URL optimization
    // CRITICAL: Use compressToEncodedURIComponent for URL-safe output
    const compressed = LZString.compressToEncodedURIComponent(json);

    // Step 3: Encrypt using AES-256
    // CRITICAL: CryptoJS requires proper string conversion
    const encrypted = CryptoJS.AES.encrypt(compressed, GAME_SECRET).toString();

    // Step 4: Base64 encode for final URL parameter
    // Using btoa for browser compatibility
    const encoded = btoa(encrypted);

    return encoded;
  } catch (error) {
    throw new EncryptionError('Failed to encrypt game state', error);
  }
}

/**
 * Decrypts game state from URL parameter
 *
 * Pipeline: Base64 -> Decrypt (AES) -> Decompress (LZ-String) -> JSON -> Validate
 *
 * CRITICAL: Always validates with Zod schema after decryption
 * CRITICAL: UTF8 encoding must be specified for Crypto-JS decrypt
 *
 * @param encoded - Base64-encoded encrypted string from URL
 * @returns Validated game state
 * @throws {DecryptionError} If decryption fails
 * @throws {z.ZodError} If validation fails (invalid game state)
 *
 * @example
 * ```typescript
 * try {
 *   const urlParams = new URLSearchParams(window.location.search);
 *   const encoded = urlParams.get('s');
 *   if (encoded) {
 *     const gameState = decryptGameState(encoded);
 *     // gameState is now validated and type-safe
 *   }
 * } catch (error) {
 *   if (error instanceof DecryptionError) {
 *     console.error('Decryption failed:', error);
 *     // Handle corrupted URL
 *   }
 * }
 * ```
 */
export function decryptGameState(encoded: string): GameState {
  try {
    // Step 1: Base64 decode
    const encrypted = atob(encoded);

    // Step 2: Decrypt using AES-256
    // CRITICAL: Must use CryptoJS.enc.Utf8 for proper string decoding
    const decrypted = CryptoJS.AES.decrypt(encrypted, GAME_SECRET).toString(CryptoJS.enc.Utf8);

    if (!decrypted) {
      throw new DecryptionError('Decryption produced empty result');
    }

    // Step 3: Decompress using LZ-String
    // CRITICAL: Use decompressFromEncodedURIComponent to match compression
    const json = LZString.decompressFromEncodedURIComponent(decrypted);

    if (!json) {
      throw new DecryptionError('Decompression produced empty result');
    }

    // Step 4: Parse JSON
    const parsed = JSON.parse(json);

    // Step 5: Validate with Zod schema
    // CRITICAL: NEVER trust external data without validation
    const validatedState = validateGameState(parsed);

    return validatedState;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new DecryptionError('Invalid JSON in encrypted data', error);
    }
    if (error.name === 'ZodError') {
      // Re-throw Zod errors for specific handling
      throw error;
    }
    throw new DecryptionError('Failed to decrypt game state', error);
  }
}

/**
 * Estimates the URL length for a given game state
 *
 * Useful for monitoring URL length during development and testing
 *
 * @param gameState - The game state to measure
 * @returns Estimated URL length in characters
 *
 * @example
 * ```typescript
 * const state: GameState = { ... };
 * const length = estimateURLLength(state);
 * if (length > MAX_URL_LENGTH) {
 *   console.warn('URL might be too long:', length);
 * }
 * ```
 */
export function estimateURLLength(gameState: GameState): number {
  const encrypted = encryptGameState(gameState);
  // Add base URL length estimate (typical: 50-100 characters)
  const baseURLLength = 100;
  return baseURLLength + encrypted.length;
}

/**
 * Validates that an encrypted string can be successfully decrypted
 *
 * Useful for testing and validation without needing the full state
 *
 * @param encoded - The encrypted string to test
 * @returns True if decryption succeeds, false otherwise
 *
 * @example
 * ```typescript
 * if (isValidEncryptedState(urlParam)) {
 *   const state = decryptGameState(urlParam);
 * } else {
 *   // Redirect to new game
 * }
 * ```
 */
export function isValidEncryptedState(encoded: string): boolean {
  try {
    decryptGameState(encoded);
    return true;
  } catch {
    return false;
  }
}
