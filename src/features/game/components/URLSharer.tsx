/**
 * @fileoverview URL sharing component with clipboard functionality
 * @module features/game/components/URLSharer
 */

import { ReactElement, MouseEvent } from 'react';
import type { GameState } from '../schemas/gameSchema';
import { useClipboard } from '../../../shared/hooks/useClipboard';
import { generateShareableURL } from '../utils/urlGeneration';

/**
 * Props for the URLSharer component.
 */
interface URLSharerProps {
  /** Current game state to encode in the URL */
  gameState: GameState;

  /** Name of the player sharing the game */
  playerName: string;
}

/**
 * URLSharer component for sharing game URLs with clipboard copy functionality.
 *
 * Generates a shareable URL containing the encrypted game state and provides
 * a one-click copy to clipboard feature. Shows visual feedback when the URL
 * is successfully copied or if an error occurs.
 *
 * @component
 * @example
 * ```tsx
 * <URLSharer
 *   gameState={currentGameState}
 *   playerName="Alice"
 * />
 * ```
 *
 * @example
 * ```tsx
 * // In a game setup screen
 * <div>
 *   <h2>Share this game with your opponent</h2>
 *   <URLSharer
 *     gameState={gameState}
 *     playerName={currentUser.name}
 *   />
 * </div>
 * ```
 */
export const URLSharer = ({ gameState, playerName }: URLSharerProps): ReactElement => {
  const { copyToClipboard, isCopied, error } = useClipboard(2000);

  /**
   * Generates the shareable URL for the current game state.
   */
  const shareableURL = generateShareableURL(gameState);

  /**
   * Handles the copy button click event.
   *
   * @param event - The mouse click event
   */
  const handleCopy = async (event: MouseEvent<HTMLButtonElement>): Promise<void> => {
    event.preventDefault();
    await copyToClipboard(shareableURL);
  };

  /**
   * Container styles for the sharer component.
   */
  const containerStyles: React.CSSProperties = {
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    fontFamily: 'inherit',
  };

  /**
   * Heading styles for the sharer title.
   */
  const headingStyles: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '12px',
    color: '#1f2937',
  };

  /**
   * Description text styles.
   */
  const descriptionStyles: React.CSSProperties = {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '16px',
  };

  /**
   * URL display box styles.
   */
  const urlBoxStyles: React.CSSProperties = {
    padding: '12px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    marginBottom: '12px',
    fontSize: '14px',
    color: '#374151',
    wordBreak: 'break-all',
    fontFamily: 'monospace',
  };

  /**
   * Button styles for the copy button.
   */
  const buttonStyles: React.CSSProperties = {
    padding: '10px 20px',
    fontSize: '16px',
    fontWeight: 600,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    fontFamily: 'inherit',
    backgroundColor: isCopied ? '#10b981' : '#4f46e5',
    color: '#ffffff',
  };

  /**
   * Hover styles for the copy button.
   */
  const hoverStyles: React.CSSProperties = {
    backgroundColor: isCopied ? '#059669' : '#4338ca',
  };

  /**
   * Error message styles.
   */
  const errorStyles: React.CSSProperties = {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '4px',
    color: '#dc2626',
    fontSize: '14px',
  };

  /**
   * Success message styles.
   */
  const successStyles: React.CSSProperties = {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '4px',
    color: '#16a34a',
    fontSize: '14px',
  };

  /**
   * Handles mouse enter event for hover effects.
   *
   * @param event - The mouse event
   */
  const handleMouseEnter = (event: MouseEvent<HTMLButtonElement>): void => {
    if (!isCopied) {
      Object.assign(event.currentTarget.style, hoverStyles);
    }
  };

  /**
   * Handles mouse leave event for hover effects.
   *
   * @param event - The mouse event
   */
  const handleMouseLeave = (event: MouseEvent<HTMLButtonElement>): void => {
    if (!isCopied) {
      Object.assign(event.currentTarget.style, buttonStyles);
    }
  };

  return (
    <div style={containerStyles} role="region" aria-label="Share game URL">
      <h3 style={headingStyles}>Share Game</h3>
      <p style={descriptionStyles}>
        {playerName}, share this URL with your opponent to continue the game:
      </p>
      <div style={urlBoxStyles} aria-label="Game URL" role="textbox" aria-readonly="true">
        {shareableURL}
      </div>
      <button
        onClick={handleCopy}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={buttonStyles}
        aria-label={isCopied ? 'URL copied to clipboard' : 'Copy game URL to clipboard'}
        aria-live="polite"
      >
        {isCopied ? 'Copied!' : 'Copy URL'}
      </button>
      {isCopied && (
        <div style={successStyles} role="status" aria-live="polite">
          URL copied to clipboard! Share it with your opponent.
        </div>
      )}
      {error && (
        <div style={errorStyles} role="alert" aria-live="assertive">
          Failed to copy URL: {error.message}
        </div>
      )}
    </div>
  );
};
