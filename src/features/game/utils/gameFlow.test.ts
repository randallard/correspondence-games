/**
 * @fileoverview Tests for game flow transitions and turn alternation
 * @module features/game/utils/gameFlow.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNewGame,
  calculateRoundResults,
  updateTotals,
  advanceToNextRound,
} from './payoffCalculation';
import type { GameState } from '../schemas/gameSchema';

describe('Game Flow - Turn Alternation', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = createNewGame('Player 1', 'Player 2');
  });

  describe('Round 1 Flow', () => {
    it('should start with Player 1 making the first choice', () => {
      expect(gameState.currentRound).toBe(0);
      expect(gameState.rounds[0].choices.p1).toBeUndefined();
      expect(gameState.rounds[0].choices.p2).toBeUndefined();
      expect(gameState.gamePhase).toBe('setup');
    });

    it('should allow Player 1 to make a choice', () => {
      gameState.rounds[0].choices.p1 = 'silent';

      expect(gameState.rounds[0].choices.p1).toBe('silent');
      expect(gameState.rounds[0].choices.p2).toBeUndefined();
      expect(gameState.rounds[0].isComplete).toBe(false);
    });

    it('should complete Round 1 when Player 2 makes a choice', () => {
      // P1 chooses
      gameState.rounds[0].choices.p1 = 'silent';

      // P2 chooses
      gameState.rounds[0].choices.p2 = 'silent';

      // Calculate results
      const completedRound = calculateRoundResults(gameState.rounds[0]);
      gameState.rounds[0] = completedRound;

      expect(completedRound.isComplete).toBe(true);
      expect(completedRound.results?.p1Gold).toBe(3);
      expect(completedRound.results?.p2Gold).toBe(3);
    });

    it('should update totals after Round 1 completion', () => {
      // Complete Round 1
      gameState.rounds[0].choices.p1 = 'silent';
      gameState.rounds[0].choices.p2 = 'silent';
      gameState.rounds[0] = calculateRoundResults(gameState.rounds[0]);

      // Update totals
      gameState = updateTotals(gameState, 0);

      expect(gameState.totals.p1Gold).toBe(3);
      expect(gameState.totals.p2Gold).toBe(3);
    });

    it('should advance to Round 2 after Round 1 completion', () => {
      // Complete Round 1
      gameState.rounds[0].choices.p1 = 'silent';
      gameState.rounds[0].choices.p2 = 'talk';
      gameState.rounds[0] = calculateRoundResults(gameState.rounds[0]);
      gameState = updateTotals(gameState, 0);

      // Advance to next round
      gameState = advanceToNextRound(gameState);

      expect(gameState.currentRound).toBe(1);
      expect(gameState.gamePhase).toBe('playing');
      expect(gameState.rounds[1].choices.p1).toBeUndefined();
      expect(gameState.rounds[1].choices.p2).toBeUndefined();
    });
  });

  describe('Round 2 Flow - Player 2 Goes First', () => {
    beforeEach(() => {
      // Complete Round 1
      gameState.rounds[0].choices.p1 = 'silent';
      gameState.rounds[0].choices.p2 = 'talk';
      gameState.rounds[0] = calculateRoundResults(gameState.rounds[0]);
      gameState = updateTotals(gameState, 0);
      gameState = advanceToNextRound(gameState);
    });

    it('should be on Round 2 with Player 2 going first', () => {
      expect(gameState.currentRound).toBe(1);

      // P2 should go first (Round 2 is index 1, odd rounds P2 goes first)
      const isP2FirstRound = gameState.currentRound % 2 === 1;
      expect(isP2FirstRound).toBe(true);
    });

    it('should allow Player 2 to make the first choice in Round 2', () => {
      gameState.rounds[1].choices.p2 = 'silent';

      expect(gameState.rounds[1].choices.p2).toBe('silent');
      expect(gameState.rounds[1].choices.p1).toBeUndefined();
      expect(gameState.rounds[1].isComplete).toBe(false);
    });

    it('should complete Round 2 when Player 1 makes a choice', () => {
      // P2 chooses first
      gameState.rounds[1].choices.p2 = 'silent';

      // P1 chooses second
      gameState.rounds[1].choices.p1 = 'talk';

      // Calculate results
      const completedRound = calculateRoundResults(gameState.rounds[1]);

      expect(completedRound.isComplete).toBe(true);
      expect(completedRound.results?.p1Gold).toBe(5);
      expect(completedRound.results?.p2Gold).toBe(0);
    });

    it('should accumulate totals correctly after Round 2', () => {
      // Round 1 totals: P1=0, P2=5
      expect(gameState.totals.p1Gold).toBe(0);
      expect(gameState.totals.p2Gold).toBe(5);

      // Complete Round 2: P1=talk, P2=silent -> P1 gets 5, P2 gets 0
      gameState.rounds[1].choices.p2 = 'silent';
      gameState.rounds[1].choices.p1 = 'talk';
      gameState.rounds[1] = calculateRoundResults(gameState.rounds[1]);
      gameState = updateTotals(gameState, 1);

      // Cumulative totals: P1=5, P2=5
      expect(gameState.totals.p1Gold).toBe(5);
      expect(gameState.totals.p2Gold).toBe(5);
    });
  });

  describe('Round 3 Flow - Player 1 Goes First', () => {
    beforeEach(() => {
      // Complete Rounds 1 and 2
      gameState.rounds[0].choices.p1 = 'silent';
      gameState.rounds[0].choices.p2 = 'talk';
      gameState.rounds[0] = calculateRoundResults(gameState.rounds[0]);
      gameState = updateTotals(gameState, 0);
      gameState = advanceToNextRound(gameState);

      gameState.rounds[1].choices.p2 = 'silent';
      gameState.rounds[1].choices.p1 = 'talk';
      gameState.rounds[1] = calculateRoundResults(gameState.rounds[1]);
      gameState = updateTotals(gameState, 1);
      gameState = advanceToNextRound(gameState);
    });

    it('should be on Round 3 with Player 1 going first', () => {
      expect(gameState.currentRound).toBe(2);

      // P1 should go first (Round 3 is index 2, even rounds P1 goes first)
      const isP1FirstRound = gameState.currentRound % 2 === 0;
      expect(isP1FirstRound).toBe(true);
    });

    it('should allow Player 1 to make the first choice in Round 3', () => {
      gameState.rounds[2].choices.p1 = 'talk';

      expect(gameState.rounds[2].choices.p1).toBe('talk');
      expect(gameState.rounds[2].choices.p2).toBeUndefined();
    });
  });

  describe('Round 4 Flow - Player 2 Goes First', () => {
    beforeEach(() => {
      // Complete Rounds 1, 2, and 3
      for (let i = 0; i < 3; i++) {
        gameState.rounds[i].choices.p1 = 'silent';
        gameState.rounds[i].choices.p2 = 'silent';
        gameState.rounds[i] = calculateRoundResults(gameState.rounds[i]);
        gameState = updateTotals(gameState, i);
        gameState = advanceToNextRound(gameState);
      }
    });

    it('should be on Round 4 with Player 2 going first', () => {
      expect(gameState.currentRound).toBe(3);

      // P2 should go first (Round 4 is index 3, odd rounds P2 goes first)
      const isP2FirstRound = gameState.currentRound % 2 === 1;
      expect(isP2FirstRound).toBe(true);
    });
  });

  describe('Round 5 Flow - Player 1 Goes First', () => {
    beforeEach(() => {
      // Complete Rounds 1-4
      for (let i = 0; i < 4; i++) {
        gameState.rounds[i].choices.p1 = 'silent';
        gameState.rounds[i].choices.p2 = 'silent';
        gameState.rounds[i] = calculateRoundResults(gameState.rounds[i]);
        gameState = updateTotals(gameState, i);
        gameState = advanceToNextRound(gameState);
      }
    });

    it('should be on Round 5 with Player 1 going first', () => {
      expect(gameState.currentRound).toBe(4);

      // P1 should go first (Round 5 is index 4, even rounds P1 goes first)
      const isP1FirstRound = gameState.currentRound % 2 === 0;
      expect(isP1FirstRound).toBe(true);
    });

    it('should finish game after Round 5 completion', () => {
      // Complete Round 5
      gameState.rounds[4].choices.p1 = 'talk';
      gameState.rounds[4].choices.p2 = 'talk';
      gameState.rounds[4] = calculateRoundResults(gameState.rounds[4]);
      gameState = updateTotals(gameState, 4);
      gameState = advanceToNextRound(gameState);

      expect(gameState.gamePhase).toBe('finished');
      expect(gameState.currentRound).toBe(4); // Still on round 4, game is done
    });
  });

  describe('Payoff Matrix Scenarios', () => {
    it('should calculate correct payoffs for mutual cooperation', () => {
      gameState.rounds[0].choices.p1 = 'silent';
      gameState.rounds[0].choices.p2 = 'silent';
      const round = calculateRoundResults(gameState.rounds[0]);

      expect(round.results?.p1Gold).toBe(3);
      expect(round.results?.p2Gold).toBe(3);
    });

    it('should calculate correct payoffs for mutual defection', () => {
      gameState.rounds[0].choices.p1 = 'talk';
      gameState.rounds[0].choices.p2 = 'talk';
      const round = calculateRoundResults(gameState.rounds[0]);

      expect(round.results?.p1Gold).toBe(1);
      expect(round.results?.p2Gold).toBe(1);
    });

    it('should calculate correct payoffs when P1 defects, P2 cooperates', () => {
      gameState.rounds[0].choices.p1 = 'talk';
      gameState.rounds[0].choices.p2 = 'silent';
      const round = calculateRoundResults(gameState.rounds[0]);

      expect(round.results?.p1Gold).toBe(5);
      expect(round.results?.p2Gold).toBe(0);
    });

    it('should calculate correct payoffs when P1 cooperates, P2 defects', () => {
      gameState.rounds[0].choices.p1 = 'silent';
      gameState.rounds[0].choices.p2 = 'talk';
      const round = calculateRoundResults(gameState.rounds[0]);

      expect(round.results?.p1Gold).toBe(0);
      expect(round.results?.p2Gold).toBe(5);
    });
  });

  describe('Cumulative Totals', () => {
    it('should correctly accumulate totals over all 5 rounds', () => {
      // Round 1: both silent (3, 3)
      gameState.rounds[0].choices.p1 = 'silent';
      gameState.rounds[0].choices.p2 = 'silent';
      gameState.rounds[0] = calculateRoundResults(gameState.rounds[0]);
      gameState = updateTotals(gameState, 0);
      gameState = advanceToNextRound(gameState);

      expect(gameState.totals.p1Gold).toBe(3);
      expect(gameState.totals.p2Gold).toBe(3);

      // Round 2: P1 talks, P2 silent (5, 0)
      gameState.rounds[1].choices.p1 = 'talk';
      gameState.rounds[1].choices.p2 = 'silent';
      gameState.rounds[1] = calculateRoundResults(gameState.rounds[1]);
      gameState = updateTotals(gameState, 1);
      gameState = advanceToNextRound(gameState);

      expect(gameState.totals.p1Gold).toBe(8);
      expect(gameState.totals.p2Gold).toBe(3);

      // Round 3: P1 silent, P2 talks (0, 5)
      gameState.rounds[2].choices.p1 = 'silent';
      gameState.rounds[2].choices.p2 = 'talk';
      gameState.rounds[2] = calculateRoundResults(gameState.rounds[2]);
      gameState = updateTotals(gameState, 2);
      gameState = advanceToNextRound(gameState);

      expect(gameState.totals.p1Gold).toBe(8);
      expect(gameState.totals.p2Gold).toBe(8);

      // Round 4: both talk (1, 1)
      gameState.rounds[3].choices.p1 = 'talk';
      gameState.rounds[3].choices.p2 = 'talk';
      gameState.rounds[3] = calculateRoundResults(gameState.rounds[3]);
      gameState = updateTotals(gameState, 3);
      gameState = advanceToNextRound(gameState);

      expect(gameState.totals.p1Gold).toBe(9);
      expect(gameState.totals.p2Gold).toBe(9);

      // Round 5: both silent (3, 3)
      gameState.rounds[4].choices.p1 = 'silent';
      gameState.rounds[4].choices.p2 = 'silent';
      gameState.rounds[4] = calculateRoundResults(gameState.rounds[4]);
      gameState = updateTotals(gameState, 4);
      gameState = advanceToNextRound(gameState);

      expect(gameState.totals.p1Gold).toBe(12);
      expect(gameState.totals.p2Gold).toBe(12);
      expect(gameState.gamePhase).toBe('finished');
    });
  });
});
