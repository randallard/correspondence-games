/**
 * @fileoverview Payoff matrix display for Prisoner's Dilemma game showing all possible outcomes
 * @module features/game/components/PayoffMatrix
 */

import { ReactElement } from 'react';
import { PAYOFF_MATRIX } from '../../../shared/utils/constants';

/**
 * PayoffMatrix component displaying the classic Prisoner's Dilemma payoff structure.
 *
 * Displays a visual matrix showing the gold earned by each player based on their
 * combined choices. Uses the standard game theory payoff values where mutual
 * cooperation yields 3/3, mutual defection yields 1/1, and mixed choices yield 0/5 or 5/0.
 *
 * @component
 * @example
 * ```tsx
 * <PayoffMatrix />
 * ```
 *
 * @example
 * ```tsx
 * // In a game explanation section
 * <div>
 *   <h2>How the Game Works</h2>
 *   <PayoffMatrix />
 * </div>
 * ```
 */
export const PayoffMatrix = (): ReactElement => {
  /**
   * Container styles for the payoff matrix component.
   */
  const containerStyles: React.CSSProperties = {
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    fontFamily: 'inherit',
  };

  /**
   * Heading styles for the matrix title.
   */
  const headingStyles: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '16px',
    color: '#1f2937',
    textAlign: 'center',
  };

  /**
   * Table styles for the payoff matrix.
   */
  const tableStyles: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  };

  /**
   * Header cell styles for player labels.
   */
  const headerCellStyles: React.CSSProperties = {
    padding: '12px',
    textAlign: 'center',
    fontWeight: 600,
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    border: '1px solid #e5e7eb',
  };

  /**
   * Label cell styles for choice options.
   */
  const labelCellStyles: React.CSSProperties = {
    padding: '12px',
    textAlign: 'center',
    fontWeight: 600,
    backgroundColor: '#f3f4f6',
    color: '#1f2937',
    border: '1px solid #e5e7eb',
  };

  /**
   * Data cell styles for payoff values.
   */
  const dataCellStyles: React.CSSProperties = {
    padding: '16px',
    textAlign: 'center',
    border: '1px solid #e5e7eb',
    fontSize: '16px',
    color: '#374151',
  };

  /**
   * Player label styles for payoff display.
   */
  const playerLabelStyles: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: '#6b7280',
    marginBottom: '4px',
  };

  /**
   * Gold value styles for payoff amounts.
   */
  const goldValueStyles: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 700,
    color: '#4f46e5',
  };

  return (
    <div style={containerStyles} role="region" aria-label="Payoff matrix">
      <h3 style={headingStyles}>Payoff Matrix</h3>
      <table style={tableStyles} role="table" aria-label="Prisoner's Dilemma payoff outcomes">
        <thead>
          <tr>
            <th style={headerCellStyles} scope="col" aria-label="Choice combinations">
              Your Choice / Their Choice
            </th>
            <th style={headerCellStyles} scope="col" aria-label="Opponent stays silent">
              They Stay Silent
            </th>
            <th style={headerCellStyles} scope="col" aria-label="Opponent talks">
              They Talk
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th style={labelCellStyles} scope="row" aria-label="You stay silent">
              You Stay Silent
            </th>
            <td style={dataCellStyles} aria-label="Both silent: 3 gold for you, 3 for opponent">
              <div style={playerLabelStyles}>You: </div>
              <div style={goldValueStyles}>{PAYOFF_MATRIX.BOTH_SILENT.p1Gold} gold</div>
              <div style={playerLabelStyles}>Them: </div>
              <div style={goldValueStyles}>{PAYOFF_MATRIX.BOTH_SILENT.p2Gold} gold</div>
            </td>
            <td style={dataCellStyles} aria-label="You silent, they talk: 0 gold for you, 5 for opponent">
              <div style={playerLabelStyles}>You: </div>
              <div style={goldValueStyles}>{PAYOFF_MATRIX.P1_SILENT_P2_TALK.p1Gold} gold</div>
              <div style={playerLabelStyles}>Them: </div>
              <div style={goldValueStyles}>{PAYOFF_MATRIX.P1_SILENT_P2_TALK.p2Gold} gold</div>
            </td>
          </tr>
          <tr>
            <th style={labelCellStyles} scope="row" aria-label="You talk">
              You Talk
            </th>
            <td style={dataCellStyles} aria-label="You talk, they silent: 5 gold for you, 0 for opponent">
              <div style={playerLabelStyles}>You: </div>
              <div style={goldValueStyles}>{PAYOFF_MATRIX.P1_TALK_P2_SILENT.p1Gold} gold</div>
              <div style={playerLabelStyles}>Them: </div>
              <div style={goldValueStyles}>{PAYOFF_MATRIX.P1_TALK_P2_SILENT.p2Gold} gold</div>
            </td>
            <td style={dataCellStyles} aria-label="Both talk: 1 gold for you, 1 for opponent">
              <div style={playerLabelStyles}>You: </div>
              <div style={goldValueStyles}>{PAYOFF_MATRIX.BOTH_TALK.p1Gold} gold</div>
              <div style={playerLabelStyles}>Them: </div>
              <div style={goldValueStyles}>{PAYOFF_MATRIX.BOTH_TALK.p2Gold} gold</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
