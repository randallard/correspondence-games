/**
 * @fileoverview Main application component for Prisoner's Dilemma game
 * @module App
 */

import { ReactElement, useEffect } from 'react';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import { LoadingSpinner } from './shared/components/LoadingSpinner';
import { Button } from './shared/components/Button';
import { GameBoard } from './features/game/components/GameBoard';
import { GameResults } from './features/game/components/GameResults';
import { URLSharer } from './features/game/components/URLSharer';
import { PayoffMatrix } from './features/game/components/PayoffMatrix';
import { RoundHistory } from './features/game/components/RoundHistory';
import { useGameState } from './features/game/hooks/useGameState';
import { useURLState } from './features/game/hooks/useURLState';
import { GameState } from './features/game/schemas/gameSchema';
import { updateURLWithState } from './features/game/utils/urlGeneration';

/**
 * Main application component
 *
 * Handles game flow:
 * 1. Check URL for existing game state
 * 2. If found, load and continue game
 * 3. If not found, show new game setup
 * 4. Progress through rounds and show results
 *
 * @component
 * @example
 * ```tsx
 * <App />
 * ```
 */
function App(): ReactElement {
  const { urlGameState, isLoading, error: urlError, generateURL } = useURLState();
  const { gameState, initializeGame, makeChoice, resetGame, loadGame } = useGameState();

  // Load game from URL on mount
  useEffect(() => {
    if (urlGameState && !gameState) {
      loadGame(urlGameState);
    }
  }, [urlGameState, gameState, loadGame]);

  // Update URL whenever game state changes
  useEffect(() => {
    if (gameState && gameState.gamePhase !== 'setup') {
      updateURLWithState(gameState);
    }
  }, [gameState]);

  // Show loading state while parsing URL
  if (isLoading) {
    return (
      <ErrorBoundary>
        <div style={styles.container}>
          <LoadingSpinner message="Loading game..." />
        </div>
      </ErrorBoundary>
    );
  }

  // Show error if URL parsing failed
  if (urlError) {
    return (
      <ErrorBoundary>
        <div style={styles.container}>
          <div style={styles.errorBox}>
            <h2 style={styles.errorTitle}>Invalid Game Link</h2>
            <p style={styles.errorMessage}>
              The game link appears to be corrupted or invalid.
            </p>
            <Button variant="primary" onClick={() => initializeGame()}>
              Start New Game
            </Button>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Show new game setup if no game state
  if (!gameState) {
    return (
      <ErrorBoundary>
        <div style={styles.container}>
          <div style={styles.welcomeBox}>
            <h1 style={styles.title}>The Prisoner's Dilemma</h1>
            <p style={styles.subtitle}>A Game of Trust and Betrayal</p>

            <div style={styles.storyBox}>
              <h2 style={styles.storyTitle}>The Setup</h2>
              <p style={styles.storyText}>
                Two prisoners are caught by the guards. Each is separated and offered a deal:
                give information about your partner in exchange for gold. But there's a catch -
                the reward depends on what your partner chooses too.
              </p>
              <p style={styles.storyQuestion}>
                <strong>Will your partner stay silent through all 5 rounds?</strong>
              </p>
            </div>

            <PayoffMatrix />

            <div style={styles.buttonGroup}>
              <Button
                variant="primary"
                onClick={() => initializeGame()}
                ariaLabel="Start new Prisoner's Dilemma game"
              >
                Start Game
              </Button>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Show game results if game is finished
  if (gameState.gamePhase === 'finished') {
    return (
      <ErrorBoundary>
        <div style={styles.container}>
          <GameResults
            gameState={gameState}
            onRematch={() => {
              // Create new game and generate URL
              initializeGame();
            }}
            onNewGame={() => resetGame()}
          />
        </div>
      </ErrorBoundary>
    );
  }

  // Main game play - show current round
  const currentRound = gameState.rounds[gameState.currentRound];
  const needsChoice = !currentRound?.isComplete;

  // Determine which player needs to make a choice
  const waitingForP1 = !currentRound?.choices.p1;
  const waitingForP2 = !currentRound?.choices.p2;

  return (
    <ErrorBoundary>
      <div style={styles.container}>
        <div style={styles.gameBox}>
          <h1 style={styles.title}>Prisoner's Dilemma</h1>
          <p style={styles.roundIndicator}>
            Round {gameState.currentRound + 1} of 5
          </p>

          {/* Show totals */}
          <div style={styles.totalsBox}>
            <div style={styles.totalItem}>
              <span style={styles.totalLabel}>Player 1 Gold:</span>
              <span style={styles.totalValue}>{gameState.totals.p1Gold} 💰</span>
            </div>
            <div style={styles.totalItem}>
              <span style={styles.totalLabel}>Player 2 Gold:</span>
              <span style={styles.totalValue}>{gameState.totals.p2Gold} 💰</span>
            </div>
          </div>

          {/* Show completed rounds history */}
          {gameState.currentRound > 0 && (
            <RoundHistory
              rounds={gameState.rounds.filter((r) => r.isComplete)}
              currentPlayer="p1"
            />
          )}

          {/* Show payoff matrix for reference */}
          <PayoffMatrix />

          {/* Show choice interface or waiting message */}
          {needsChoice ? (
            <>
              {waitingForP1 && (
                <>
                  <h2 style={styles.choiceTitle}>Your Choice (Player 1)</h2>
                  <GameBoard
                    onChoice={(choice) => makeChoice('p1', choice)}
                    disabled={false}
                    currentRound={gameState.currentRound + 1}
                  />
                </>
              )}
              {!waitingForP1 && waitingForP2 && (
                <div style={styles.waitingBox}>
                  <p style={styles.waitingMessage}>
                    Player 1 has made their choice. Share this URL with Player 2:
                  </p>
                  <URLSharer gameState={gameState} playerName="Player 2" />
                </div>
              )}
            </>
          ) : (
            <div style={styles.waitingBox}>
              <p style={styles.waitingMessage}>
                Both players have chosen. Share this URL to continue to the next round:
              </p>
              <URLSharer gameState={gameState} playerName="Your Opponent" />
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

/**
 * Inline styles for the application
 * Using inline styles to avoid CSS imports as per requirements
 */
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#1a1a2e',
    color: '#eee',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  welcomeBox: {
    maxWidth: '800px',
    margin: '0 auto',
    textAlign: 'center' as const,
  },
  gameBox: {
    maxWidth: '900px',
    margin: '0 auto',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#f39c12',
  },
  subtitle: {
    fontSize: '1.2rem',
    color: '#bbb',
    marginBottom: '30px',
  },
  roundIndicator: {
    fontSize: '1.1rem',
    color: '#3498db',
    marginBottom: '20px',
  },
  storyBox: {
    backgroundColor: '#16213e',
    border: '2px solid #0f3460',
    borderRadius: '10px',
    padding: '30px',
    marginBottom: '30px',
    textAlign: 'left' as const,
  },
  storyTitle: {
    fontSize: '1.8rem',
    color: '#e94560',
    marginBottom: '15px',
  },
  storyText: {
    fontSize: '1.1rem',
    lineHeight: '1.6',
    marginBottom: '15px',
  },
  storyQuestion: {
    fontSize: '1.2rem',
    color: '#f39c12',
    marginTop: '20px',
  },
  buttonGroup: {
    marginTop: '30px',
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
  },
  totalsBox: {
    display: 'flex',
    justifyContent: 'space-around',
    backgroundColor: '#16213e',
    border: '2px solid #0f3460',
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '30px',
  },
  totalItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '10px',
  },
  totalLabel: {
    fontSize: '1rem',
    color: '#bbb',
  },
  totalValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#f39c12',
  },
  choiceTitle: {
    fontSize: '1.8rem',
    color: '#e94560',
    marginTop: '30px',
    marginBottom: '20px',
    textAlign: 'center' as const,
  },
  waitingBox: {
    backgroundColor: '#16213e',
    border: '2px solid #3498db',
    borderRadius: '10px',
    padding: '30px',
    marginTop: '30px',
    textAlign: 'center' as const,
  },
  waitingMessage: {
    fontSize: '1.2rem',
    marginBottom: '20px',
  },
  errorBox: {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: '#16213e',
    border: '2px solid #e94560',
    borderRadius: '10px',
    padding: '40px',
    textAlign: 'center' as const,
  },
  errorTitle: {
    fontSize: '2rem',
    color: '#e94560',
    marginBottom: '20px',
  },
  errorMessage: {
    fontSize: '1.1rem',
    marginBottom: '30px',
  },
} as const;

export default App;
