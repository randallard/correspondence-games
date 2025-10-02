/**
 * @fileoverview Game history panel component for displaying previous games
 * @module features/game/components/GameHistoryPanel
 */

import { ReactElement, useState } from 'react';
import type { CompletedGame } from '../types/history';
import { RoundHistory } from './RoundHistory';

/**
 * Props for the GameHistoryPanel component.
 */
interface GameHistoryPanelProps {
  /** Array of completed games to display */
  games: CompletedGame[];

  /** Current player name for determining won/lost */
  currentPlayerName: string;
}

/**
 * GameHistoryPanel component for displaying previous completed games.
 *
 * Shows a collapsible list of games with expandable details.
 * Each game shows score and winner, with round-by-round details on expand.
 *
 * @component
 * @example
 * ```tsx
 * <GameHistoryPanel
 *   games={completedGames}
 *   currentPlayerName="Alice"
 * />
 * ```
 */
export const GameHistoryPanel = ({
  games,
  currentPlayerName,
}: GameHistoryPanelProps): ReactElement | null => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
  const [expandedGameIds, setExpandedGameIds] = useState<Set<string>>(new Set());

  // Don't render if no games
  if (games.length === 0) {
    return null;
  }

  /**
   * Toggles the expanded state of a specific game.
   */
  const toggleGameExpanded = (gameId: string): void => {
    setExpandedGameIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(gameId)) {
        newSet.delete(gameId);
      } else {
        newSet.add(gameId);
      }
      return newSet;
    });
  };

  /**
   * Gets the label for a completed game.
   * Format: "15-12 - Alice won" or "15-15 - Tie"
   */
  const getGameLabel = (game: CompletedGame): string => {
    const score = `${game.totals.p1Gold}-${game.totals.p2Gold}`;

    if (game.winner === 'tie') {
      return `${score} - Tie`;
    }

    const winnerName = game.winner === 'p1' ? game.playerNames.p1 : game.playerNames.p2;
    const didCurrentPlayerWin = winnerName === currentPlayerName;

    return `${score} - ${winnerName} ${didCurrentPlayerWin ? 'won' : 'won'}`;
  };

  /**
   * Container styles.
   */
  const containerStyles: React.CSSProperties = {
    marginBottom: '24px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
  };

  /**
   * Header styles (clickable to toggle collapse).
   */
  const headerStyles: React.CSSProperties = {
    padding: '16px',
    backgroundColor: '#f3f4f6',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: isCollapsed ? 'none' : '1px solid #e5e7eb',
  };

  /**
   * Header text styles.
   */
  const headerTextStyles: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#374151',
  };

  /**
   * Icon styles.
   */
  const iconStyles: React.CSSProperties = {
    fontSize: '14px',
    color: '#6b7280',
  };

  /**
   * Game list styles.
   */
  const gameListStyles: React.CSSProperties = {
    padding: '8px',
  };

  /**
   * Game item container styles.
   */
  const gameItemStyles: React.CSSProperties = {
    marginBottom: '8px',
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
  };

  /**
   * Game item header styles.
   */
  const gameItemHeaderStyles: React.CSSProperties = {
    padding: '12px 16px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  /**
   * Game label styles.
   */
  const gameLabelStyles: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
    color: '#1f2937',
  };

  /**
   * Game details styles (expanded).
   */
  const gameDetailsStyles: React.CSSProperties = {
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderTop: '1px solid #e5e7eb',
  };

  /**
   * Player names styles.
   */
  const playerNamesStyles: React.CSSProperties = {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '12px',
  };

  /**
   * Date styles.
   */
  const dateStyles: React.CSSProperties = {
    fontSize: '12px',
    color: '#9ca3af',
    marginBottom: '12px',
  };

  /**
   * Message styles.
   */
  const messageStyles: React.CSSProperties = {
    fontSize: '14px',
    color: '#1f2937',
    padding: '12px',
    backgroundColor: '#eff6ff',
    border: '1px solid #3b82f6',
    borderRadius: '6px',
    marginBottom: '12px',
  };

  /**
   * Formats a date string for display.
   */
  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={containerStyles} role="region" aria-label="Game history">
      <div
        style={headerStyles}
        onClick={() => setIsCollapsed(!isCollapsed)}
        role="button"
        tabIndex={0}
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? 'Expand game history' : 'Collapse game history'}
      >
        <div style={headerTextStyles}>Game History ({games.length})</div>
        <div style={iconStyles}>{isCollapsed ? '▼' : '▲'}</div>
      </div>

      {!isCollapsed && (
        <div style={gameListStyles}>
          {games.map((game) => {
            const isExpanded = expandedGameIds.has(game.gameId);

            return (
              <div key={game.gameId} style={gameItemStyles}>
                <div
                  style={gameItemHeaderStyles}
                  onClick={() => toggleGameExpanded(game.gameId)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  aria-label={`Game: ${getGameLabel(game)}`}
                >
                  <div style={gameLabelStyles}>{getGameLabel(game)}</div>
                  <div style={iconStyles}>{isExpanded ? '−' : '+'}</div>
                </div>

                {isExpanded && (
                  <div style={gameDetailsStyles}>
                    <div style={playerNamesStyles}>
                      {game.playerNames.p1} vs {game.playerNames.p2}
                    </div>

                    <div style={dateStyles}>
                      {formatDate(game.startTime)} - {formatDate(game.endTime)}
                    </div>

                    {game.finalMessage && (
                      <div style={messageStyles}>
                        <strong>
                          {game.finalMessage.from === 'p1'
                            ? game.playerNames.p1
                            : game.playerNames.p2}:
                        </strong>{' '}
                        {game.finalMessage.text}
                      </div>
                    )}

                    <RoundHistory
                      rounds={game.rounds}
                      currentPlayer="p1"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
