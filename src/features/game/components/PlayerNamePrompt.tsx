/**
 * @fileoverview Player name prompt component for first-time players
 * @module features/game/components/PlayerNamePrompt
 */

import { ReactElement, useState, ChangeEvent } from 'react';
import { Button } from '../../../shared/components/Button';
import { validatePlayerName, MAX_NAME_LENGTH } from '../utils/urlSizeValidation';

/**
 * Props for the PlayerNamePrompt component.
 */
interface PlayerNamePromptProps {
  /** Callback when player name is submitted */
  onNameSubmit: (name: string, startFresh: boolean) => void;

  /** Whether game history exists */
  hasHistory: boolean;
}

/**
 * PlayerNamePrompt component for getting player name on first visit.
 *
 * Displays a form for entering player name with validation and character counter.
 * If game history exists, offers option to start fresh or continue with history.
 *
 * @component
 * @example
 * ```tsx
 * <PlayerNamePrompt
 *   onNameSubmit={(name, startFresh) => handleNameSubmit(name, startFresh)}
 *   hasHistory={true}
 * />
 * ```
 */
export const PlayerNamePrompt = ({
  onNameSubmit,
  hasHistory,
}: PlayerNamePromptProps): ReactElement => {
  const [name, setName] = useState<string>('');
  const [error, setError] = useState<string>('');

  /**
   * Handles name input changes with validation.
   */
  const handleNameChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const newName = event.target.value;

    // Allow typing but enforce max length
    if (newName.length <= MAX_NAME_LENGTH) {
      setName(newName);
      setError('');
    }
  };

  /**
   * Validates and submits the player name.
   */
  const handleSubmit = (startFresh: boolean): void => {
    if (!validatePlayerName(name)) {
      if (!name.trim()) {
        setError('Please enter a name');
      } else if (name.length > MAX_NAME_LENGTH) {
        setError(`Name must be ${MAX_NAME_LENGTH} characters or less`);
      } else {
        setError('Name must contain only letters, numbers, and spaces');
      }
      return;
    }

    onNameSubmit(name.trim(), startFresh);
  };

  /**
   * Container styles for the prompt.
   */
  const containerStyles: React.CSSProperties = {
    padding: '40px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '2px solid #e5e7eb',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    maxWidth: '500px',
    margin: '40px auto',
    fontFamily: 'inherit',
  };

  /**
   * Heading styles.
   */
  const headingStyles: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 700,
    marginBottom: '24px',
    color: '#1f2937',
    textAlign: 'center',
  };

  /**
   * Label styles.
   */
  const labelStyles: React.CSSProperties = {
    display: 'block',
    fontSize: '16px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '8px',
  };

  /**
   * Input styles.
   */
  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    border: '2px solid #d1d5db',
    borderRadius: '8px',
    fontFamily: 'inherit',
    marginBottom: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  /**
   * Character counter styles.
   */
  const counterStyles: React.CSSProperties = {
    fontSize: '14px',
    color: name.length >= MAX_NAME_LENGTH ? '#dc2626' : '#6b7280',
    marginBottom: '16px',
    textAlign: 'right',
  };

  /**
   * Error message styles.
   */
  const errorStyles: React.CSSProperties = {
    fontSize: '14px',
    color: '#dc2626',
    marginBottom: '16px',
  };

  /**
   * Info text styles.
   */
  const infoStyles: React.CSSProperties = {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '24px',
    lineHeight: '1.5',
  };

  /**
   * Button container styles.
   */
  const buttonContainerStyles: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    flexDirection: hasHistory ? 'column' : 'row',
    justifyContent: 'center',
  };

  /**
   * History warning styles.
   */
  const historyWarningStyles: React.CSSProperties = {
    fontSize: '14px',
    color: '#92400e',
    backgroundColor: '#fef3c7',
    border: '1px solid #fbbf24',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '16px',
  };

  return (
    <div style={containerStyles} role="region" aria-label="Player name prompt">
      <h1 style={headingStyles}>Welcome!</h1>

      <label htmlFor="player-name" style={labelStyles}>
        Enter your name
      </label>

      <input
        id="player-name"
        type="text"
        value={name}
        onChange={handleNameChange}
        placeholder="Your name"
        style={inputStyles}
        maxLength={MAX_NAME_LENGTH}
        aria-label="Player name"
        aria-describedby="name-counter name-error"
        autoFocus
      />

      <div id="name-counter" style={counterStyles} aria-live="polite">
        {name.length} / {MAX_NAME_LENGTH} characters
      </div>

      {error && (
        <div id="name-error" style={errorStyles} role="alert">
          {error}
        </div>
      )}

      {!hasHistory && (
        <div style={infoStyles}>
          Your name will be saved locally so you can track your game history.
        </div>
      )}

      {hasHistory && (
        <>
          <div style={historyWarningStyles} role="alert">
            <strong>Game history detected.</strong> You can continue with your
            existing history or start fresh. Starting fresh will clear your game
            history (you can download a backup first).
          </div>

          <div style={buttonContainerStyles}>
            <Button
              variant="primary"
              onClick={() => handleSubmit(false)}
              disabled={!name.trim()}
              ariaLabel="Continue with existing game history"
            >
              Continue with History
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleSubmit(true)}
              disabled={!name.trim()}
              ariaLabel="Start fresh and clear game history"
            >
              Start Fresh
            </Button>
          </div>
        </>
      )}

      {!hasHistory && (
        <div style={buttonContainerStyles}>
          <Button
            variant="primary"
            onClick={() => handleSubmit(false)}
            disabled={!name.trim()}
            ariaLabel="Submit player name"
          >
            Let's Play!
          </Button>
        </div>
      )}
    </div>
  );
};
