/**
 * @fileoverview Game results display component showing final outcomes
 * @module features/game/components/GameResults
 */

import { ReactElement, MouseEvent } from 'react';
import type { GameState } from '../schemas/gameSchema';
import { Button } from '../../../shared/components/Button';
import { RoundHistory } from './RoundHistory';

/**
 * Props for the GameResults component.
 */
interface GameResultsProps {
  /** Complete game state with all rounds and results */
  gameState: GameState;

  /** Callback function when rematch is requested */
  onRematch: () => void;

  /** Callback function when new game is requested */
  onNewGame: () => void;

  /** Optional: Hide action buttons (rematch/new game) */
  hideActions?: boolean;
}

/**
 * GameResults component displaying final game outcomes.
 *
 * Shows the winner, final gold totals for both players, and complete round
 * history. Provides options for rematch (same opponent) or starting a new
 * game (new opponent).
 *
 * @component
 * @example
 * ```tsx
 * <GameResults
 *   gameState={finalGameState}
 *   onRematch={handleRematch}
 *   onNewGame={handleNewGame}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // After game completion
 * {gameState.gamePhase === 'finished' && (
 *   <GameResults
 *     gameState={gameState}
 *     onRematch={() => createRematch(gameState)}
 *     onNewGame={() => navigateToSetup()}
 *   />
 * )}
 * ```
 */
export const GameResults = ({
  gameState,
  onRematch,
  onNewGame,
  hideActions = false,
}: GameResultsProps): ReactElement => {
  /**
   * Handles the rematch button click.
   *
   * @param event - The mouse click event
   */
  const handleRematch = (event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    onRematch();
  };

  /**
   * Handles the new game button click.
   *
   * @param event - The mouse click event
   */
  const handleNewGame = (event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    onNewGame();
  };

  /**
   * Determines the game winner based on final totals.
   *
   * @returns Winner description string
   */
  const determineWinner = (): string => {
    const p1Gold = gameState.totals.p1Gold;
    const p2Gold = gameState.totals.p2Gold;

    if (p1Gold > p2Gold) {
      return `${gameState.players.p1.name || 'Player 1'} wins!`;
    } else if (p2Gold > p1Gold) {
      return `${gameState.players.p2.name || 'Player 2'} wins!`;
    } else {
      return "It's a tie!";
    }
  };

  /**
   * Container styles for the results component.
   */
  const containerStyles: React.CSSProperties = {
    padding: '32px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '2px solid #e5e7eb',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    fontFamily: 'inherit',
    maxWidth: '800px',
    margin: '0 auto',
  };

  /**
   * Main heading styles for game over message.
   */
  const mainHeadingStyles: React.CSSProperties = {
    fontSize: '32px',
    fontWeight: 700,
    marginBottom: '16px',
    color: '#1f2937',
    textAlign: 'center',
  };

  /**
   * Winner announcement styles.
   */
  const winnerStyles: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 600,
    marginBottom: '32px',
    color: '#4f46e5',
    textAlign: 'center',
  };

  /**
   * Totals section styles.
   */
  const totalsSectionStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: '32px',
    padding: '24px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  };

  /**
   * Player total card styles.
   */
  const playerTotalStyles: React.CSSProperties = {
    textAlign: 'center',
  };

  /**
   * Player name label styles.
   */
  const playerNameStyles: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: '8px',
  };

  /**
   * Gold total value styles.
   */
  const goldTotalStyles: React.CSSProperties = {
    fontSize: '36px',
    fontWeight: 700,
    color: '#4f46e5',
  };

  /**
   * Gold label styles.
   */
  const goldLabelStyles: React.CSSProperties = {
    fontSize: '14px',
    color: '#6b7280',
  };

  /**
   * History section styles.
   */
  const historySectionStyles: React.CSSProperties = {
    marginBottom: '32px',
  };

  /**
   * Button container styles.
   */
  const buttonContainerStyles: React.CSSProperties = {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  };

  return (
    <div style={containerStyles} role="region" aria-label="Game results">
      <h1 style={mainHeadingStyles}>Game Over!</h1>
      <div style={winnerStyles} role="status" aria-live="polite" aria-atomic="true">
        {determineWinner()}
      </div>

      <div
        style={totalsSectionStyles}
        role="region"
        aria-label="Final gold totals"
        aria-live="polite"
      >
        <div style={playerTotalStyles}>
          <div style={playerNameStyles} aria-label="Player 1 name">
            {gameState.players.p1.name || 'Player 1'}
          </div>
          <div style={goldTotalStyles} aria-label={`Player 1 earned ${gameState.totals.p1Gold} gold`}>
            {gameState.totals.p1Gold}
          </div>
          <div style={goldLabelStyles}>gold</div>
        </div>

        <div style={playerTotalStyles}>
          <div style={playerNameStyles} aria-label="Player 2 name">
            {gameState.players.p2.name || 'Player 2'}
          </div>
          <div style={goldTotalStyles} aria-label={`Player 2 earned ${gameState.totals.p2Gold} gold`}>
            {gameState.totals.p2Gold}
          </div>
          <div style={goldLabelStyles}>gold</div>
        </div>
      </div>

      <div style={historySectionStyles}>
        <RoundHistory rounds={gameState.rounds} currentPlayer="p1" />
      </div>

      {!hideActions && (
        <div style={buttonContainerStyles} role="group" aria-label="Game actions">
          <Button
            variant="primary"
            onClick={handleRematch}
            ariaLabel="Request a rematch with the same opponent"
          >
            Rematch
          </Button>
          <Button
            variant="secondary"
            onClick={handleNewGame}
            ariaLabel="Start a new game with a different opponent"
          >
            New Game
          </Button>
        </div>
      )}
    </div>
  );
};
