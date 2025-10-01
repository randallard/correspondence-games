/**
 * @fileoverview Payoff calculation engine for Prisoner's Dilemma
 * @module features/game/utils/payoffCalculation
 *
 * Implements the classic Prisoner's Dilemma payoff matrix:
 * - Both Silent (cooperate): 3, 3
 * - P1 Silent, P2 Talk: 0, 5
 * - P1 Talk, P2 Silent: 5, 0
 * - Both Talk (defect): 1, 1
 */

import {
  GameState,
  Round,
  RoundResults,
  Choice,
  GamePhase,
  PlayerIdSchema,
} from '../schemas/gameSchema';
import { PAYOFF_MATRIX, MAX_ROUNDS, PHASE } from '../../../shared/utils/constants';

/**
 * Error thrown when payoff calculation fails
 */
export class PayoffCalculationError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'PayoffCalculationError';
  }
}

/**
 * Calculates payoff for a round based on both players' choices
 *
 * Implements the Prisoner's Dilemma payoff matrix:
 * - Nash Equilibrium: Both Talk (1,1) - individually rational but collectively suboptimal
 * - Pareto Optimal: Both Silent (3,3) - requires trust and cooperation
 * - Exploitation: One Silent, One Talk (0,5 or 5,0) - betrayal scenario
 *
 * @param p1Choice - Player 1's choice (silent or talk)
 * @param p2Choice - Player 2's choice (silent or talk)
 * @returns Gold earned by each player
 *
 * @example
 * ```typescript
 * const results = calculatePayoff('silent', 'silent');
 * // returns { p1Gold: 3, p2Gold: 3 } - mutual cooperation
 *
 * const results2 = calculatePayoff('silent', 'talk');
 * // returns { p1Gold: 0, p2Gold: 5 } - P1 exploited by P2
 * ```
 */
export function calculatePayoff(p1Choice: Choice, p2Choice: Choice): RoundResults {
  if (p1Choice === 'silent' && p2Choice === 'silent') {
    // Mutual cooperation - Pareto optimal outcome
    return PAYOFF_MATRIX.BOTH_SILENT;
  }

  if (p1Choice === 'silent' && p2Choice === 'talk') {
    // P1 cooperates, P2 defects - P1 gets exploited
    return PAYOFF_MATRIX.P1_SILENT_P2_TALK;
  }

  if (p1Choice === 'talk' && p2Choice === 'silent') {
    // P1 defects, P2 cooperates - P2 gets exploited
    return PAYOFF_MATRIX.P1_TALK_P2_SILENT;
  }

  // Both defect - Nash equilibrium
  return PAYOFF_MATRIX.BOTH_TALK;
}

/**
 * Checks if a round has both players' choices
 *
 * @param round - The round to check
 * @returns True if both players have chosen
 *
 * @example
 * ```typescript
 * if (canCalculateResults(round)) {
 *   const results = calculateRoundResults(round);
 * }
 * ```
 */
export function canCalculateResults(round: Round): boolean {
  return round.choices.p1 !== undefined && round.choices.p2 !== undefined;
}

/**
 * Calculates and updates round results
 *
 * CRITICAL: Only call this when both players have made their choices
 *
 * @param round - The round with both choices made
 * @returns Updated round with calculated results
 * @throws {PayoffCalculationError} If round is incomplete
 *
 * @example
 * ```typescript
 * const completedRound = calculateRoundResults(round);
 * // completedRound now has results and isComplete = true
 * ```
 */
export function calculateRoundResults(round: Round): Round {
  if (!canCalculateResults(round)) {
    throw new PayoffCalculationError(
      `Cannot calculate results for round ${round.roundNumber}: missing player choices`
    );
  }

  // TypeScript knows these are defined due to canCalculateResults check
  const p1Choice = round.choices.p1!;
  const p2Choice = round.choices.p2!;

  const results = calculatePayoff(p1Choice, p2Choice);

  return {
    ...round,
    results,
    isComplete: true,
    completedAt: new Date().toISOString(),
  };
}

/**
 * Advances game state to the next round
 *
 * @param gameState - Current game state
 * @returns Updated game state with advanced round
 * @throws {PayoffCalculationError} If game cannot advance
 *
 * @example
 * ```typescript
 * const nextState = advanceToNextRound(currentState);
 * // currentRound incremented, next round becomes active
 * ```
 */
export function advanceToNextRound(gameState: GameState): GameState {
  const currentRound = gameState.rounds[gameState.currentRound];

  if (!currentRound) {
    throw new PayoffCalculationError('Current round not found');
  }

  if (!currentRound.isComplete) {
    throw new PayoffCalculationError(
      `Cannot advance from incomplete round ${currentRound.roundNumber}`
    );
  }

  // Check if this was the last round
  if (gameState.currentRound >= MAX_ROUNDS - 1) {
    // Game is finished
    return {
      ...gameState,
      gamePhase: PHASE.FINISHED as GamePhase,
      metadata: {
        ...gameState.metadata,
        lastMoveAt: new Date().toISOString(),
      },
    };
  }

  // Advance to next round
  return {
    ...gameState,
    currentRound: gameState.currentRound + 1,
    metadata: {
      ...gameState.metadata,
      lastMoveAt: new Date().toISOString(),
    },
  };
}

/**
 * Updates cumulative gold totals after a round completes
 *
 * @param gameState - Current game state
 * @param roundIndex - Index of the round to add (0-4)
 * @returns Updated game state with new totals
 * @throws {PayoffCalculationError} If round results are missing
 *
 * @example
 * ```typescript
 * const updatedState = updateTotals(gameState, 0);
 * // totals now include round 1 results
 * ```
 */
export function updateTotals(gameState: GameState, roundIndex: number): GameState {
  const round = gameState.rounds[roundIndex];

  if (!round) {
    throw new PayoffCalculationError(`Round ${roundIndex} not found`);
  }

  if (!round.results) {
    throw new PayoffCalculationError(`Round ${roundIndex} has no results to add to totals`);
  }

  return {
    ...gameState,
    totals: {
      p1Gold: gameState.totals.p1Gold + round.results.p1Gold,
      p2Gold: gameState.totals.p2Gold + round.results.p2Gold,
    },
  };
}

/**
 * Determines the winner of a finished game
 *
 * @param gameState - Finished game state
 * @returns 'p1', 'p2', or 'tie'
 * @throws {PayoffCalculationError} If game is not finished
 *
 * @example
 * ```typescript
 * const winner = determineWinner(gameState);
 * if (winner === 'tie') {
 *   console.log('Game ended in a tie!');
 * } else {
 *   console.log(`Player ${winner} wins!`);
 * }
 * ```
 */
export function determineWinner(gameState: GameState): 'p1' | 'p2' | 'tie' {
  if (gameState.gamePhase !== PHASE.FINISHED) {
    throw new PayoffCalculationError('Cannot determine winner of unfinished game');
  }

  const { p1Gold, p2Gold } = gameState.totals;

  if (p1Gold > p2Gold) return 'p1';
  if (p2Gold > p1Gold) return 'p2';
  return 'tie';
}

/**
 * Creates initial empty rounds for a new game
 *
 * @returns Array of 5 empty rounds
 *
 * @example
 * ```typescript
 * const rounds = createInitialRounds();
 * // rounds = [{ roundNumber: 1, ... }, { roundNumber: 2, ... }, ...]
 * ```
 */
export function createInitialRounds(): Round[] {
  return Array.from({ length: MAX_ROUNDS }, (_, index) => ({
    roundNumber: index + 1,
    choices: {},
    isComplete: false,
  }));
}

/**
 * Creates a new game state
 *
 * @param p1Name - Optional name for player 1
 * @param p2Name - Optional name for player 2
 * @returns Initialized game state ready for play
 *
 * @example
 * ```typescript
 * const newGame = createNewGame('Alice', 'Bob');
 * // Fresh game with all rounds initialized
 * ```
 */
export function createNewGame(p1Name?: string, p2Name?: string): GameState {
  const gameId = crypto.randomUUID() as ReturnType<typeof GameIdSchema.parse>;
  const p1Id = PlayerIdSchema.parse('p1');
  const p2Id = PlayerIdSchema.parse('p2');

  return {
    version: '1.0.0',
    gameId,
    players: {
      p1: {
        id: p1Id,
        name: p1Name,
        isActive: true, // P1 starts
      },
      p2: {
        id: p2Id,
        name: p2Name,
        isActive: false,
      },
    },
    rounds: createInitialRounds(),
    currentRound: 0,
    gamePhase: 'setup',
    totals: {
      p1Gold: 0,
      p2Gold: 0,
    },
    metadata: {
      createdAt: new Date().toISOString(),
      lastMoveAt: new Date().toISOString(),
      turnCount: 0,
    },
  };
}
