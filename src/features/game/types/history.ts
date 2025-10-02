/**
 * @fileoverview Type definitions for game history and localStorage
 * @module features/game/types/history
 */

import type { Round } from '../schemas/gameSchema';

/**
 * Message from a player at the end of the game.
 */
export interface PlayerMessage {
  /** Player who sent the message */
  from: 'p1' | 'p2';
  /** Message text content (max 500 characters) */
  text: string;
  /** ISO timestamp when message was sent */
  timestamp: string;
}

/**
 * Toast notification for system messages.
 */
export interface ToastNotification {
  /** Unique notification ID */
  id: string;
  /** Notification type */
  type: 'info' | 'warning' | 'success';
  /** Notification message */
  message: string;
  /** ISO timestamp when notification was created */
  timestamp: string;
}

/**
 * Completed game stored in history.
 */
export interface CompletedGame {
  /** Unique game identifier */
  gameId: string;
  /** ISO timestamp when game started */
  startTime: string;
  /** ISO timestamp when game finished */
  endTime: string;
  /** Player names for this game */
  playerNames: {
    p1: string;
    p2: string;
  };
  /** Final gold totals */
  totals: {
    p1Gold: number;
    p2Gold: number;
  };
  /** All 5 rounds */
  rounds: Round[];
  /** Optional final message from a player */
  finalMessage?: PlayerMessage;
  /** Winner of the game */
  winner: 'p1' | 'p2' | 'tie';
}

/**
 * Complete game history stored in localStorage.
 */
export interface GameHistory {
  /** Current player's name */
  playerName: string;
  /** Session ID for fingerprinting (detect name changes vs new player) */
  sessionId: string;
  /** Array of completed games */
  games: CompletedGame[];
}
