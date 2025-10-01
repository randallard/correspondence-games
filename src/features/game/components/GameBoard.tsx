/**
 * @fileoverview Main game board component for making choices
 * @module features/game/components/GameBoard
 */

import { ReactElement, MouseEvent } from 'react';
import { Button } from '../../../shared/components/Button';

/**
 * Props for the GameBoard component.
 */
interface GameBoardProps {
  /** Callback function when a choice is made */
  onChoice: (choice: 'silent' | 'talk') => void;

  /** Whether the board is disabled (e.g., waiting for opponent) */
  disabled: boolean;

  /** Current round number (1-5) */
  currentRound: number;
}

/**
 * GameBoard component for making game decisions.
 *
 * Provides the main interface for players to make their choice between
 * staying silent (cooperate) or talking (defect). Displays the current
 * round number and disables choices when appropriate.
 *
 * @component
 * @example
 * ```tsx
 * <GameBoard
 *   onChoice={handlePlayerChoice}
 *   disabled={waitingForOpponent}
 *   currentRound={3}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // In a game play screen
 * <div>
 *   <GameBoard
 *     onChoice={(choice) => submitChoice(choice)}
 *     disabled={isProcessing}
 *     currentRound={gameState.currentRound + 1}
 *   />
 * </div>
 * ```
 */
export const GameBoard = ({ onChoice, disabled, currentRound }: GameBoardProps): ReactElement => {
  /**
   * Handles the "Stay Silent" button click.
   *
   * @param event - The mouse click event
   */
  const handleSilent = (event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    onChoice('silent');
  };

  /**
   * Handles the "Talk" button click.
   *
   * @param event - The mouse click event
   */
  const handleTalk = (event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    onChoice('talk');
  };

  /**
   * Container styles for the game board.
   */
  const containerStyles: React.CSSProperties = {
    padding: '32px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '2px solid #e5e7eb',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    fontFamily: 'inherit',
    textAlign: 'center',
  };

  /**
   * Heading styles for the round indicator.
   */
  const headingStyles: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '8px',
    color: '#1f2937',
  };

  /**
   * Instruction text styles.
   */
  const instructionStyles: React.CSSProperties = {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '32px',
  };

  /**
   * Button container styles for layout.
   */
  const buttonContainerStyles: React.CSSProperties = {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  };

  /**
   * Choice button wrapper styles.
   */
  const choiceWrapperStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  };

  /**
   * Choice description styles.
   */
  const choiceDescriptionStyles: React.CSSProperties = {
    fontSize: '14px',
    color: '#6b7280',
    fontStyle: 'italic',
  };

  /**
   * Disabled state message styles.
   */
  const disabledMessageStyles: React.CSSProperties = {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#fef3c7',
    border: '1px solid #fbbf24',
    borderRadius: '4px',
    color: '#92400e',
    fontSize: '14px',
  };

  return (
    <div
      style={containerStyles}
      role="region"
      aria-label="Game board"
      aria-live="polite"
      aria-atomic="true"
    >
      <h2 style={headingStyles}>Round {currentRound}</h2>
      <p style={instructionStyles}>Make your choice:</p>
      <div style={buttonContainerStyles} role="group" aria-label="Choice buttons">
        <div style={choiceWrapperStyles}>
          <Button
            variant="primary"
            onClick={handleSilent}
            disabled={disabled}
            ariaLabel="Choose to stay silent and cooperate"
          >
            Stay Silent
          </Button>
          <span style={choiceDescriptionStyles} aria-label="Silent means cooperate">
            (Cooperate)
          </span>
        </div>
        <div style={choiceWrapperStyles}>
          <Button
            variant="secondary"
            onClick={handleTalk}
            disabled={disabled}
            ariaLabel="Choose to talk and defect"
          >
            Talk
          </Button>
          <span style={choiceDescriptionStyles} aria-label="Talk means defect">
            (Defect)
          </span>
        </div>
      </div>
      {disabled && (
        <div style={disabledMessageStyles} role="status" aria-live="polite">
          Waiting for opponent to make their choice...
        </div>
      )}
    </div>
  );
};
