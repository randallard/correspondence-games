/**
 * @fileoverview React hook for choice locking
 * @module framework/hooks/useChoiceLock
 */

import { useState, useEffect, useCallback } from 'react';
import {
  lockChoice,
  getChoiceLock,
  validateChoice,
  clearGameLocks,
  type ChoiceLock,
} from '../storage/choiceLockManager';

/**
 * Hook return value
 */
interface UseChoiceLockResult {
  /** Whether the choice is locked for this round */
  isLocked: boolean;

  /** The locked choice (if any) */
  lockedChoice: ChoiceLock | null;

  /** Lock a choice for this round */
  lockPlayerChoice: (choiceId: string) => void;

  /** Validate and lock a choice (throws if mismatch) */
  validateAndLock: (choiceId: string) => void;

  /** Clear all locks for this game */
  clearLocks: () => void;
}

/**
 * React hook for managing choice locks
 *
 * @param gameId - Unique game identifier
 * @param round - Current round number
 * @param player - Player number (1 or 2)
 *
 * @example
 * ```tsx
 * function GameComponent() {
 *   const { isLocked, validateAndLock, lockedChoice } = useChoiceLock(gameId, 1, 1);
 *
 *   const handleChoice = (choice: string) => {
 *     try {
 *       validateAndLock(choice);
 *       // Choice is valid and now locked
 *     } catch (error) {
 *       alert(error.message); // "You already chose cooperate"
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       {isLocked && <p>Choice locked: {lockedChoice.choiceId}</p>}
 *       <button onClick={() => handleChoice('cooperate')}>Cooperate</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useChoiceLock(
  gameId: string,
  round: number,
  player: 1 | 2
): UseChoiceLockResult {
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [lockedChoice, setLockedChoice] = useState<ChoiceLock | null>(null);

  // Check if choice is locked on mount and when dependencies change
  useEffect(() => {
    const lock = getChoiceLock(gameId, round, player);
    setIsLocked(lock !== null);
    setLockedChoice(lock);
  }, [gameId, round, player]);

  // Listen for storage events (cross-tab synchronization)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      const key = `choice-lock-${gameId}-r${round}-p${player}`;
      if (e.key === key) {
        // Lock changed in another tab - reload
        const lock = getChoiceLock(gameId, round, player);
        setIsLocked(lock !== null);
        setLockedChoice(lock);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [gameId, round, player]);

  const lockPlayerChoice = useCallback(
    (choiceId: string) => {
      lockChoice(gameId, round, player, choiceId);
      setIsLocked(true);
      setLockedChoice(getChoiceLock(gameId, round, player));
    },
    [gameId, round, player]
  );

  const validateAndLock = useCallback(
    (choiceId: string) => {
      // Throws if choice doesn't match existing lock
      validateChoice(gameId, round, player, choiceId);

      // If validation passed, lock it (idempotent if already locked)
      lockPlayerChoice(choiceId);
    },
    [gameId, round, player, lockPlayerChoice]
  );

  const clearLocks = useCallback(() => {
    clearGameLocks(gameId);
    setIsLocked(false);
    setLockedChoice(null);
  }, [gameId]);

  return {
    isLocked,
    lockedChoice,
    lockPlayerChoice,
    validateAndLock,
    clearLocks,
  };
}
