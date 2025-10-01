/**
 * @fileoverview Round history display showing past choices and results
 * @module features/game/components/RoundHistory
 */

import { ReactElement } from 'react';
import type { Round } from '../schemas/gameSchema';

/**
 * Props for the RoundHistory component.
 */
interface RoundHistoryProps {
  /** Array of completed rounds from game state */
  rounds: Round[];

  /** Current player identifier ('p1' or 'p2') */
  currentPlayer: 'p1' | 'p2';
}

/**
 * RoundHistory component displaying the history of completed rounds.
 *
 * Shows each round's choices and results in a table format. Highlights the
 * most recent round and displays gold earned by both players. Only shows
 * completed rounds with both player choices.
 *
 * @component
 * @example
 * ```tsx
 * <RoundHistory
 *   rounds={gameState.rounds}
 *   currentPlayer="p1"
 * />
 * ```
 *
 * @example
 * ```tsx
 * // In a game results page
 * <div>
 *   <h2>Game History</h2>
 *   <RoundHistory
 *     rounds={gameState.rounds}
 *     currentPlayer={playerId}
 *   />
 * </div>
 * ```
 */
export const RoundHistory = ({ rounds, currentPlayer }: RoundHistoryProps): ReactElement => {
  /**
   * Filters rounds to only show completed rounds with both choices made.
   */
  const completedRounds = rounds.filter(
    (round): round is Round & { results: NonNullable<Round['results']> } =>
      round.isComplete && round.results !== undefined
  );

  /**
   * Container styles for the history component.
   */
  const containerStyles: React.CSSProperties = {
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    fontFamily: 'inherit',
  };

  /**
   * Heading styles for the history title.
   */
  const headingStyles: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '16px',
    color: '#1f2937',
  };

  /**
   * Table styles for the round history.
   */
  const tableStyles: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  /**
   * Header cell styles for table headers.
   */
  const headerCellStyles: React.CSSProperties = {
    padding: '12px',
    textAlign: 'left',
    fontWeight: 600,
    backgroundColor: '#f3f4f6',
    color: '#1f2937',
    border: '1px solid #e5e7eb',
  };

  /**
   * Data cell styles for table data.
   */
  const dataCellStyles: React.CSSProperties = {
    padding: '12px',
    border: '1px solid #e5e7eb',
    color: '#374151',
  };

  /**
   * Styles for highlighting the latest round.
   *
   * @param isLatest - Whether this is the most recent round
   * @returns Cell styles with optional highlight
   */
  const getRowStyles = (isLatest: boolean): React.CSSProperties => ({
    backgroundColor: isLatest ? '#fef3c7' : '#ffffff',
  });

  /**
   * Formats choice text for display.
   *
   * @param choice - The choice value ('silent' or 'talk')
   * @returns Formatted choice text
   */
  const formatChoice = (choice: 'silent' | 'talk'): string => {
    return choice === 'silent' ? 'Silent' : 'Talk';
  };

  /**
   * Gets the gold earned by the current player.
   *
   * @param results - Round results object
   * @returns Gold earned by current player
   */
  const getPlayerGold = (results: NonNullable<Round['results']>): number => {
    return currentPlayer === 'p1' ? results.p1Gold : results.p2Gold;
  };

  /**
   * Gets the gold earned by the opponent.
   *
   * @param results - Round results object
   * @returns Gold earned by opponent
   */
  const getOpponentGold = (results: NonNullable<Round['results']>): number => {
    return currentPlayer === 'p1' ? results.p2Gold : results.p1Gold;
  };

  /**
   * Empty state message when no rounds are completed.
   */
  const emptyStateStyles: React.CSSProperties = {
    padding: '24px',
    textAlign: 'center',
    color: '#6b7280',
    fontStyle: 'italic',
  };

  if (completedRounds.length === 0) {
    return (
      <div style={containerStyles} role="region" aria-label="Round history">
        <h3 style={headingStyles}>Round History</h3>
        <div style={emptyStateStyles} aria-live="polite">
          No completed rounds yet
        </div>
      </div>
    );
  }

  const latestRoundIndex = completedRounds.length - 1;

  return (
    <div style={containerStyles} role="region" aria-label="Round history">
      <h3 style={headingStyles}>Round History</h3>
      <table style={tableStyles} role="table" aria-label="Completed rounds">
        <thead>
          <tr>
            <th style={headerCellStyles} scope="col" aria-label="Round number">
              Round
            </th>
            <th style={headerCellStyles} scope="col" aria-label="Your choice">
              Your Choice
            </th>
            <th style={headerCellStyles} scope="col" aria-label="Opponent choice">
              Their Choice
            </th>
            <th style={headerCellStyles} scope="col" aria-label="Your gold earned">
              Your Gold
            </th>
            <th style={headerCellStyles} scope="col" aria-label="Opponent gold earned">
              Their Gold
            </th>
          </tr>
        </thead>
        <tbody>
          {completedRounds.map((round, index) => {
            const isLatest = index === latestRoundIndex;
            const playerChoice = currentPlayer === 'p1' ? round.choices.p1 : round.choices.p2;
            const opponentChoice = currentPlayer === 'p1' ? round.choices.p2 : round.choices.p1;

            return (
              <tr
                key={round.roundNumber}
                style={getRowStyles(isLatest)}
                aria-label={`Round ${round.roundNumber}${isLatest ? ' (latest)' : ''}`}
              >
                <td style={dataCellStyles} aria-label={`Round ${round.roundNumber}`}>
                  Round {round.roundNumber}
                  {isLatest && ' (Latest)'}
                </td>
                <td style={dataCellStyles} aria-label={`You chose ${formatChoice(playerChoice!)}`}>
                  {formatChoice(playerChoice!)}
                </td>
                <td
                  style={dataCellStyles}
                  aria-label={`Opponent chose ${formatChoice(opponentChoice!)}`}
                >
                  {formatChoice(opponentChoice!)}
                </td>
                <td
                  style={dataCellStyles}
                  aria-label={`You earned ${getPlayerGold(round.results)} gold`}
                >
                  {getPlayerGold(round.results)} gold
                </td>
                <td
                  style={dataCellStyles}
                  aria-label={`Opponent earned ${getOpponentGold(round.results)} gold`}
                >
                  {getOpponentGold(round.results)} gold
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
