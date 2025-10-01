/**
 * @fileoverview Main application component for Prisoner's Dilemma game
 * @module App
 */

import { ReactElement, useEffect, useState } from 'react';
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
  const [playerMessage, setPlayerMessage] = useState<string>('');

  // DEBUG: Log state changes
  useEffect(() => {
    console.log('=== STATE DEBUG ===');
    console.log('urlGameState:', urlGameState ? {
      gameId: urlGameState.gameId,
      currentRound: urlGameState.currentRound,
      phase: urlGameState.gamePhase,
      round: urlGameState.rounds[urlGameState.currentRound],
    } : null);
    console.log('gameState:', gameState ? {
      gameId: gameState.gameId,
      currentRound: gameState.currentRound,
      phase: gameState.gamePhase,
      round: gameState.rounds[gameState.currentRound],
    } : null);
    console.log('==================');
  }, [urlGameState, gameState]);

  // Load game from URL on mount
  useEffect(() => {
    if (urlGameState && !gameState) {
      console.log('🔄 Loading game from URL');
      loadGame(urlGameState);
    }
  }, [urlGameState, gameState, loadGame]);

  // Update URL whenever game state changes (but not on initial load)
  useEffect(() => {
    // Only update URL if we have a game state and it wasn't just loaded from URL
    if (gameState && gameState.gamePhase !== 'setup' && !urlGameState) {
      console.log('🔗 Updating browser URL with new state');
      updateURLWithState(gameState);
    }
  }, [gameState, urlGameState]);

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
    // Detect if player just completed the game locally (vs viewing from URL)
    const justFinishedGame = urlGameState === null || (
      urlGameState && gameState &&
      urlGameState.gamePhase !== 'finished' && gameState.gamePhase === 'finished'
    );

    return (
      <ErrorBoundary>
        <div style={styles.container}>
          {/* Show URL sharing interface if player just finished the game */}
          {justFinishedGame ? (
            <>
              <GameResults
                gameState={gameState}
                onRematch={() => {
                  // Create new game and generate URL
                  initializeGame();
                }}
                onNewGame={() => resetGame()}
                hideActions={true}
              />
              <div style={styles.gameBox}>
                <div style={styles.waitingBox}>
                  <h2 style={styles.choiceTitle}>Game Complete!</h2>
                  <p style={styles.waitingMessage}>
                    Send this URL to Player 1 to show them the results:
                  </p>
                  <URLSharer
                    gameState={gameState}
                    playerName=""
                    message={playerMessage}
                    messageFrom="p2"
                  />

                  {/* Optional message input */}
                  <div style={styles.messageInputContainer}>
                    <label htmlFor="player-message" style={styles.messageLabel}>
                      Add an optional message for Player 1:
                    </label>
                    <textarea
                      id="player-message"
                      placeholder="Add an optional message for Player 1 (e.g., 'Good game!', 'Want a rematch?')"
                      style={styles.messageInput}
                      rows={3}
                      value={playerMessage}
                      onChange={(e) => setPlayerMessage(e.target.value)}
                    />
                    {playerMessage && playerMessage.trim() && (
                      <p style={styles.messageHint}>
                        💡 URL updated with your message. Copy again to include it!
                      </p>
                    )}
                  </div>

                  {/* Rematch option */}
                  <div style={styles.rematchSection}>
                    <p style={styles.rematchText}>Want to play again?</p>
                    <Button
                      variant="primary"
                      onClick={() => initializeGame()}
                      ariaLabel="Start a rematch with role reversal"
                    >
                      Rematch
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <GameResults
              gameState={gameState}
              onRematch={() => {
                // Create new game and generate URL
                initializeGame();
              }}
              onNewGame={() => resetGame()}
            />
          )}
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

  // Determine who goes first in this round (alternates)
  // Round 0,2,4 (Rounds 1,3,5): P1 goes first
  // Round 1,3 (Rounds 2,4): P2 goes first
  const isP1FirstRound = gameState.currentRound % 2 === 0;
  const isP2FirstRound = !isP1FirstRound;

  // Detect if player just made a local choice (vs viewing from URL)
  // True if: no URL state OR gameState has choices that urlGameState doesn't have
  const isLocalChoice = urlGameState === null || (
    urlGameState && gameState &&
    JSON.stringify(gameState.rounds[gameState.currentRound]?.choices) !==
    JSON.stringify(urlGameState.rounds[urlGameState.currentRound]?.choices)
  );

  console.log('🎮 Game view logic:', {
    currentRound: gameState.currentRound,
    needsChoice,
    waitingForP1,
    waitingForP2,
    isP1FirstRound,
    isP2FirstRound,
    urlGameState: urlGameState ? 'loaded from URL' : 'null',
    totals: gameState.totals,
  });

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

          {/* Show payoff matrix for reference (unless P2 is seeing the story for the first time) */}
          {!(urlGameState !== null && waitingForP2 && gameState.currentRound === 0) && (
            <PayoffMatrix />
          )}

          {/* Show choice interface or waiting message */}
          {needsChoice ? (
            <>
              {/* ROUND START - Both players need to choose */}
              {waitingForP1 && waitingForP2 && (
                <>
                  {/* P1 goes first - show P1's choice interface */}
                  {isP1FirstRound && (
                    <>
                      <h2 style={styles.choiceTitle}>Your Choice (Player 1)</h2>
                      <GameBoard
                        onChoice={(choice) => makeChoice('p1', choice)}
                        disabled={false}
                        currentRound={gameState.currentRound + 1}
                        scenarioText={gameState.currentRound === 0 ? "You and another player have been arrested. You're being interrogated separately. Will you stay silent or talk?" : undefined}
                      />
                    </>
                  )}

                  {/* P2 goes first - show P2's choice interface */}
                  {isP2FirstRound && (
                    <>
                      <h2 style={styles.choiceTitle}>Your Choice (Player 2)</h2>
                      <GameBoard
                        onChoice={(choice) => makeChoice('p2', choice)}
                        disabled={false}
                        currentRound={gameState.currentRound + 1}
                      />
                    </>
                  )}
                </>
              )}

              {/* P1 HAS CHOSEN, waiting for P2 */}
              {!waitingForP1 && waitingForP2 && (
                <>
                  {/* P1 just made choice, show waiting message */}
                  {isLocalChoice && (
                    <div style={styles.waitingBox}>
                      <h2 style={styles.choiceTitle}>Choice Made!</h2>
                      <p style={styles.waitingMessage}>
                        Send this URL to Player 2 so they can make their choice:
                      </p>
                      <URLSharer gameState={gameState} playerName="" />
                    </div>
                  )}

                  {/* P2 viewing after P1 chose - Round 1 with story */}
                  {!isLocalChoice && gameState.currentRound === 0 && (
                    <>
                      <div style={styles.storyBox}>
                        <h2 style={styles.storyTitle}>The Setup</h2>
                        <p style={styles.storyText}>
                          Two prisoners are caught by the guards. Each is separated and offered a deal:
                          give information about your partner in exchange for gold. But there's a catch -
                          the reward depends on what your partner chooses too.
                        </p>
                        <p style={styles.storyQuestion}>
                          <strong>Player 1 has made their choice. What will you do?</strong>
                        </p>
                      </div>

                      <PayoffMatrix />

                      <h2 style={styles.choiceTitle}>Your Choice (Player 2)</h2>
                      <GameBoard
                        onChoice={(choice) => makeChoice('p2', choice)}
                        disabled={false}
                        currentRound={gameState.currentRound + 1}
                      />
                    </>
                  )}

                  {/* P2 viewing after P1 chose (non-Round 1) - show P2's choice interface */}
                  {!isLocalChoice && gameState.currentRound !== 0 && (
                    <>
                      <h2 style={styles.choiceTitle}>Your Choice (Player 2)</h2>
                      <GameBoard
                        onChoice={(choice) => makeChoice('p2', choice)}
                        disabled={false}
                        currentRound={gameState.currentRound + 1}
                      />
                    </>
                  )}
                </>
              )}

              {/* P2 HAS CHOSEN, waiting for P1 */}
              {waitingForP1 && !waitingForP2 && (
                <>
                  {/* P2 just made choice, show waiting message */}
                  {isLocalChoice && (
                    <div style={styles.waitingBox}>
                      <h2 style={styles.choiceTitle}>Choice Made!</h2>
                      <p style={styles.waitingMessage}>
                        Send this URL to Player 1 so they can make their choice:
                      </p>
                      <URLSharer gameState={gameState} playerName="" />
                    </div>
                  )}

                  {/* P1 viewing after P2 chose - show P1's choice interface */}
                  {!isLocalChoice && (
                    <>
                      <h2 style={styles.choiceTitle}>Your Choice (Player 1)</h2>
                      <GameBoard
                        onChoice={(choice) => makeChoice('p1', choice)}
                        disabled={false}
                        currentRound={gameState.currentRound + 1}
                      />
                    </>
                  )}
                </>
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
  messageInputContainer: {
    marginTop: '30px',
    textAlign: 'left' as const,
  },
  messageLabel: {
    display: 'block',
    fontSize: '1rem',
    color: '#eee',
    marginBottom: '10px',
    fontWeight: 'bold',
  },
  messageInput: {
    width: '100%',
    padding: '12px',
    fontSize: '1rem',
    borderRadius: '8px',
    border: '2px solid #3498db',
    backgroundColor: '#16213e',
    color: '#eee',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
  },
  rematchSection: {
    marginTop: '30px',
    textAlign: 'center' as const,
    paddingTop: '20px',
    borderTop: '1px solid #3498db',
  },
  rematchText: {
    fontSize: '1.1rem',
    marginBottom: '15px',
    color: '#eee',
  },
  messageHint: {
    marginTop: '10px',
    fontSize: '0.9rem',
    color: '#f39c12',
    fontStyle: 'italic',
  },
} as const;

export default App;
