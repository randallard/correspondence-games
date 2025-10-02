/**
 * @fileoverview Zod schemas for Prisoner's Dilemma game state validation
 * @module features/game/schemas/gameSchema
 */

import { z } from 'zod';
import type { CompletedGame } from '../types/history';

/**
 * Choice type - either 'silent' (cooperate) or 'talk' (defect)
 * In the Prisoner's Dilemma: silent = cooperate, talk = defect
 */
export const ChoiceSchema = z.enum(['silent', 'talk']);
export type Choice = z.infer<typeof ChoiceSchema>;

/**
 * Game phase enum - tracks the current stage of the game
 */
export const GamePhaseSchema = z.enum(['setup', 'playing', 'finished']);
export type GamePhase = z.infer<typeof GamePhaseSchema>;

/**
 * Player identifier with branding for type safety
 * Branded types prevent accidental misuse of plain strings as player IDs
 */
export const PlayerIdSchema = z.string().min(1).brand<'PlayerId'>();
export type PlayerId = z.infer<typeof PlayerIdSchema>;

/**
 * Game identifier - must be a valid UUID
 * Branded for type safety to prevent mixing with other string IDs
 */
export const GameIdSchema = z.string().uuid().brand<'GameId'>();
export type GameId = z.infer<typeof GameIdSchema>;

/**
 * Player information schema
 * Contains metadata about each player in the game
 */
export const PlayerInfoSchema = z.object({
  /** Unique identifier for the player */
  id: PlayerIdSchema,
  /** Optional display name for the player */
  name: z.string().optional(),
  /** Whether this player is currently active (their turn) */
  isActive: z.boolean(),
});
export type PlayerInfo = z.infer<typeof PlayerInfoSchema>;

/**
 * Round results schema
 * Contains gold earned by each player in a specific round
 */
export const RoundResultsSchema = z.object({
  /** Gold earned by player 1 in this round */
  p1Gold: z.number().int().min(0).max(5),
  /** Gold earned by player 2 in this round */
  p2Gold: z.number().int().min(0).max(5),
});
export type RoundResults = z.infer<typeof RoundResultsSchema>;

/**
 * Choices for a round schema
 * Both choices are optional until players make their decisions
 */
export const RoundChoicesSchema = z.object({
  /** Player 1's choice - undefined if not yet made */
  p1: ChoiceSchema.optional(),
  /** Player 2's choice - undefined if not yet made */
  p2: ChoiceSchema.optional(),
});
export type RoundChoices = z.infer<typeof RoundChoicesSchema>;

/**
 * Round schema
 * Represents a single round in the 5-round game
 */
export const RoundSchema = z.object({
  /** Round number from 1 to 5 */
  roundNumber: z.number().int().min(1).max(5),
  /** Choices made by both players */
  choices: RoundChoicesSchema,
  /** Results after both players have chosen (optional until round complete) */
  results: RoundResultsSchema.optional(),
  /** Whether both players have made their choices */
  isComplete: z.boolean(),
  /** ISO timestamp when round was completed */
  completedAt: z.string().datetime().optional(),
});
export type Round = z.infer<typeof RoundSchema>;

/**
 * Game metadata schema
 * Tracks timing and turn information
 */
export const GameMetadataSchema = z.object({
  /** ISO timestamp when game was created */
  createdAt: z.string().datetime(),
  /** ISO timestamp of the last move */
  lastMoveAt: z.string().datetime(),
  /** Total number of turns taken in the game */
  turnCount: z.number().int().min(0),
});
export type GameMetadata = z.infer<typeof GameMetadataSchema>;

/**
 * Player message schema
 * Used for end-game messaging between players
 */
export const PlayerMessageSchema = z.object({
  /** Which player sent the message */
  from: z.enum(['p1', 'p2']),
  /** Message text (max 500 characters for URL length management) */
  text: z.string().max(500),
  /** ISO timestamp when message was sent */
  timestamp: z.string().datetime(),
});
export type PlayerMessage = z.infer<typeof PlayerMessageSchema>;

/**
 * Toast notification schema
 * Used for system messages and notifications
 */
export const ToastNotificationSchema = z.object({
  /** Unique notification ID */
  id: z.string(),
  /** Notification type */
  type: z.enum(['info', 'warning', 'success']),
  /** Notification message */
  message: z.string(),
  /** ISO timestamp when notification was created */
  timestamp: z.string().datetime(),
});
export type ToastNotification = z.infer<typeof ToastNotificationSchema>;

/**
 * Social features schema
 * Contains optional social interactions like messaging and rematches
 */
export const SocialFeaturesSchema = z.object({
  /** Optional final message from winner/loser */
  finalMessage: PlayerMessageSchema.optional(),
  /** Whether a rematch has been offered */
  rematchOffered: z.boolean().optional(),
  /** Game ID of the rematch game if one was created */
  rematchGameId: GameIdSchema.optional(),
});
export type SocialFeatures = z.infer<typeof SocialFeaturesSchema>;

/**
 * Complete game state schema
 * This is the root schema that validates the entire game state
 *
 * CRITICAL: All properties use short names to minimize URL length
 * CRITICAL: This schema MUST validate ALL external data (URL parameters)
 *
 * @example
 * ```typescript
 * const state = GameStateSchema.parse(unknownData);
 * // Now state is fully validated and type-safe
 * ```
 */
export const GameStateSchema = z.object({
  /** Schema version for backward compatibility */
  version: z.literal('1.0.0'),
  /** Unique game identifier */
  gameId: GameIdSchema,
  /** Player information */
  players: z.object({
    p1: PlayerInfoSchema,
    p2: PlayerInfoSchema,
  }),
  /** Array of exactly 5 rounds */
  rounds: z.array(RoundSchema).length(5),
  /** Current round index (0-4) */
  currentRound: z.number().int().min(0).max(4),
  /** Current phase of the game */
  gamePhase: GamePhaseSchema,
  /** Cumulative gold totals for both players */
  totals: z.object({
    p1Gold: z.number().int().min(0),
    p2Gold: z.number().int().min(0),
  }),
  /** Game metadata for tracking */
  metadata: GameMetadataSchema,
  /** Optional social features */
  socialFeatures: SocialFeaturesSchema.optional(),
  /** Links to previous game in history (for rematch chain) */
  previousGameId: z.string().optional(),
  /** System toast notifications */
  toastNotifications: z.array(ToastNotificationSchema).optional(),
  /** TEMPORARY: Previous game results embedded for P1's first view of rematch */
  previousGameResults: z.any().optional(), // Using z.any() to avoid circular dependency with CompletedGame
});

/**
 * Complete game state type derived from schema
 * Use this type for all game state throughout the application
 */
export type GameState = z.infer<typeof GameStateSchema>;

/**
 * Validates unknown data as a valid game state
 *
 * @param data - Unknown data to validate (typically from URL parameter)
 * @returns Validated and type-safe game state
 * @throws {z.ZodError} If validation fails
 *
 * @example
 * ```typescript
 * try {
 *   const gameState = validateGameState(urlData);
 *   // Safe to use gameState
 * } catch (error) {
 *   if (error instanceof z.ZodError) {
 *     console.error('Invalid game state:', error.issues);
 *   }
 * }
 * ```
 */
export function validateGameState(data: unknown): GameState {
  return GameStateSchema.parse(data);
}

/**
 * Safely validates game state without throwing
 *
 * @param data - Unknown data to validate
 * @returns Result object with success status and data or error
 *
 * @example
 * ```typescript
 * const result = safeValidateGameState(urlData);
 * if (result.success) {
 *   // result.data is the validated game state
 *   handleValidState(result.data);
 * } else {
 *   // result.error contains validation errors
 *   handleInvalidState(result.error);
 * }
 * ```
 */
export function safeValidateGameState(data: unknown): z.SafeParseReturnType<unknown, GameState> {
  return GameStateSchema.safeParse(data);
}
