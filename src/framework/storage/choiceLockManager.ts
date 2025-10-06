/**
 * @fileoverview Choice locking system to prevent round-replay cheating
 * @module framework/storage/choiceLockManager
 *
 * Anti-cheat pattern: Once a player makes a choice for a round,
 * that choice is locked in localStorage and cannot be changed.
 *
 * SECURITY LEVEL: "Middle of the road" deterrent
 * - Prevents casual cheating (page refresh to change choice)
 * - Does NOT prevent determined attackers (localStorage is client-controlled)
 * - Relies on localStorage availability (fails gracefully if disabled)
 */

/**
 * Represents a locked choice for a specific round
 */
export interface ChoiceLock {
  gameId: string;
  round: number;
  player: 1 | 2;
  choiceId: string;
  timestamp: string;
  locked: true; // Always true - exists = locked
}

/**
 * Stores a choice lock in localStorage
 *
 * @param gameId - Unique game identifier
 * @param round - Round number (1-indexed)
 * @param player - Player number (1 or 2)
 * @param choiceId - The choice that was made
 *
 * @example
 * lockChoice('game-abc123', 1, 1, 'cooperate');
 */
export function lockChoice(
  gameId: string,
  round: number,
  player: 1 | 2,
  choiceId: string
): void {
  const lock: ChoiceLock = {
    gameId,
    round,
    player,
    choiceId,
    timestamp: new Date().toISOString(),
    locked: true,
  };

  const key = `choice-lock-${gameId}-r${round}-p${player}`;

  try {
    localStorage.setItem(key, JSON.stringify(lock));
  } catch (error) {
    console.warn('Failed to lock choice (localStorage unavailable):', error);
    // Graceful degradation - game continues without lock
  }
}

/**
 * Checks if a choice is locked for this round
 *
 * @returns ChoiceLock if locked, null if not locked
 */
export function getChoiceLock(
  gameId: string,
  round: number,
  player: 1 | 2
): ChoiceLock | null {
  const key = `choice-lock-${gameId}-r${round}-p${player}`;

  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const lock = JSON.parse(stored) as ChoiceLock;

    // Validate lock structure
    if (!lock.locked || lock.gameId !== gameId || lock.round !== round || lock.player !== player) {
      console.warn('Invalid lock structure - ignoring');
      return null;
    }

    return lock;
  } catch (error) {
    console.warn('Failed to read choice lock:', error);
    return null;
  }
}

/**
 * Checks if a choice is locked for this round
 */
export function isChoiceLocked(
  gameId: string,
  round: number,
  player: 1 | 2
): boolean {
  return getChoiceLock(gameId, round, player) !== null;
}

/**
 * Validates that a new choice matches the locked choice
 *
 * @throws {Error} If choice is locked and doesn't match
 */
export function validateChoice(
  gameId: string,
  round: number,
  player: 1 | 2,
  attemptedChoice: string
): void {
  const lock = getChoiceLock(gameId, round, player);

  if (!lock) {
    // No lock exists - this is the first choice, allow it
    return;
  }

  if (lock.choiceId !== attemptedChoice) {
    throw new Error(
      `Choice locked for round ${round}. You already chose "${lock.choiceId}". ` +
      `You cannot change to "${attemptedChoice}".`
    );
  }

  // Choice matches lock - allow (idempotent operation)
}

/**
 * Clears all choice locks for a game (called when starting new game)
 */
export function clearGameLocks(gameId: string): void {
  try {
    const keys = Object.keys(localStorage);
    const lockKeys = keys.filter(k => k.startsWith(`choice-lock-${gameId}-`));

    lockKeys.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.warn('Failed to clear game locks:', error);
  }
}

/**
 * Clears locks older than specified days (cleanup utility)
 */
export function clearOldLocks(maxAgeDays: number = 7): void {
  try {
    const now = Date.now();
    const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;

    const keys = Object.keys(localStorage);
    const lockKeys = keys.filter(k => k.startsWith('choice-lock-'));

    lockKeys.forEach(key => {
      try {
        const stored = localStorage.getItem(key);
        if (!stored) return;

        const lock = JSON.parse(stored) as ChoiceLock;
        const age = now - new Date(lock.timestamp).getTime();

        if (age > maxAge) {
          localStorage.removeItem(key);
        }
      } catch {
        // Invalid lock - remove it
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Failed to clear old locks:', error);
  }
}

/**
 * Debug utility - lists all choice locks
 */
export function debugListLocks(): ChoiceLock[] {
  const locks: ChoiceLock[] = [];

  try {
    const keys = Object.keys(localStorage);
    const lockKeys = keys.filter(k => k.startsWith('choice-lock-'));

    lockKeys.forEach(key => {
      try {
        const stored = localStorage.getItem(key);
        if (!stored) return;
        locks.push(JSON.parse(stored) as ChoiceLock);
      } catch {
        // Skip invalid locks
      }
    });
  } catch (error) {
    console.warn('Failed to list locks:', error);
  }

  return locks;
}
