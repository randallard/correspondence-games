/**
 * @fileoverview URL sharing component with clipboard functionality
 * @module features/game/components/URLSharer
 */

import { ReactElement, MouseEvent, useMemo } from 'react';
import type { GameState } from '../schemas/gameSchema';
import { useClipboard } from '../../../shared/hooks/useClipboard';
import { generateShareableURL, generateShareableURLWithMessage } from '../utils/urlGeneration';

/**
 * Props for the URLSharer component.
 */
interface URLSharerProps {
  /** Current game state to encode in the URL */
  gameState: GameState;

  /** Name of the player sharing the game */
  playerName: string;

  /** Optional message to include in the URL */
  message?: string;

  /** Which player is sending the message */
  messageFrom?: 'p1' | 'p2';
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
export const URLSharer = ({ gameState, playerName, message, messageFrom }: URLSharerProps): ReactElement => {
  const { copyToClipboard, isCopied, error } = useClipboard(2000);

  /**
   * Generates the shareable URL for the current game state.
   * Memoized to prevent regeneration on every render.
   * Includes message if provided.
   */
  const shareableURL = useMemo(() => {
    if (message && message.trim() && messageFrom) {
      return generateShareableURLWithMessage(gameState, message, messageFrom);
    }
    return generateShareableURL(gameState);
  }, [gameState, message, messageFrom]);

  /**
   * Checks if the URL contains localhost (for development testing).
   */
  const isLocalhost = useMemo(() => shareableURL.includes('localhost'), [shareableURL]);

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
   * Handles opening the URL in a new tab (for localhost testing).
   *
   * @param event - The mouse click event
   */
  const handleOpenInNewTab = (event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    window.open(shareableURL, '_blank', 'noopener,noreferrer');
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
   * Button container styles for arranging buttons side by side.
   */
  const buttonContainerStyles: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  };

  /**
   * Secondary button styles for the "Open in New Tab" button.
   */
  const secondaryButtonStyles: React.CSSProperties = {
    padding: '10px 20px',
    fontSize: '16px',
    fontWeight: 600,
    border: '2px solid #4f46e5',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    fontFamily: 'inherit',
    backgroundColor: '#ffffff',
    color: '#4f46e5',
  };

  /**
   * Hover styles for the secondary button.
   */
  const secondaryHoverStyles: React.CSSProperties = {
    backgroundColor: '#f5f3ff',
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

  /**
   * Handles mouse enter event for secondary button hover effects.
   *
   * @param event - The mouse event
   */
  const handleSecondaryMouseEnter = (event: MouseEvent<HTMLButtonElement>): void => {
    Object.assign(event.currentTarget.style, { ...secondaryButtonStyles, ...secondaryHoverStyles });
  };

  /**
   * Handles mouse leave event for secondary button hover effects.
   *
   * @param event - The mouse event
   */
  const handleSecondaryMouseLeave = (event: MouseEvent<HTMLButtonElement>): void => {
    Object.assign(event.currentTarget.style, secondaryButtonStyles);
  };

  return (
    <div style={containerStyles} role="region" aria-label="Share game URL">
      <h3 style={headingStyles}>Share Game URL</h3>
      {playerName && (
        <p style={descriptionStyles}>
          {playerName}, share this URL with your opponent:
        </p>
      )}
      <div style={urlBoxStyles} aria-label="Game URL" role="textbox" aria-readonly="true">
        {shareableURL}
      </div>
      <div style={buttonContainerStyles}>
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
        {isLocalhost && (
          <button
            onClick={handleOpenInNewTab}
            onMouseEnter={handleSecondaryMouseEnter}
            onMouseLeave={handleSecondaryMouseLeave}
            style={secondaryButtonStyles}
            aria-label="Open game URL in new tab for testing"
          >
            Open in New Tab
          </button>
        )}
      </div>
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
