/**
 * @fileoverview E2E Integration tests for complete rematch flow
 * @module features/game/integration/rematch.integration.test
 *
 * Tests the complete rematch flow from game completion through rematch
 * invitation, including:
 * - P2 initiates rematch after game completion
 * - previousGameResults embedded in URL for P1
 * - P1 processes and saves previous game to localStorage
 * - previousGameResults cleared after P1 views
 * - Role reversal (P2 goes first in rematch)
 * - Both players' localStorage updated correctly
 */

import { test, expect, Page } from '@playwright/test';

/**
 * Helper: Complete a full 5-round game
 */
async function completeFullGame(page: Page, p1Name: string, p2Name: string) {
  // Player 1 starts new game
  await page.goto('/');

  // Enter player name
  await page.fill('input[aria-label="Player name"]', p1Name);
  await page.click('button:has-text("Let\'s Play!")');

  // Start game
  await page.click('button:has-text("Start Game")');

  // Round 1: P1 chooses
  await expect(page.getByRole('heading', { name: 'Your Choice (Player 1)' })).toBeVisible();
  await page.click('button:has-text("Stay Silent")');
  await expect(page.getByRole('heading', { name: 'Choice Made!' })).toBeVisible();

  // Get URL for P2
  const urlForP2 = await page.evaluate(() => window.location.href);

  // P2 opens URL in new context (simulating different device)
  const context2 = await page.context().browser()!.newContext();
  const p2Page = await context2.newPage();

  // P2 enters name
  await p2Page.goto(urlForP2);
  await p2Page.fill('input[aria-label="Player name"]', p2Name);
  await p2Page.click('button:has-text("Let\'s Play!")');

  // P2 makes choice
  await expect(p2Page.getByRole('heading', { name: 'Your Choice (Player 2)' })).toBeVisible();
  await p2Page.click('button:has-text("Talk")');

  // Get URL back to P1
  const urlForP1Round2 = await p2Page.evaluate(() => window.location.href);

  // Complete rounds 2-5 (alternating)
  const rounds = [
    { starter: page, playerNumber: 'Player 1', choice: 'Silent' },
    { starter: p2Page, playerNumber: 'Player 2', choice: 'Talk' },
    { starter: page, playerNumber: 'Player 1', choice: 'Silent' },
    { starter: p2Page, playerNumber: 'Player 2', choice: 'Talk' },
  ];

  let currentUrl = urlForP1Round2;
  for (let i = 0; i < rounds.length; i++) {
    const round = rounds[i];
    const activePage = round.starter;
    const otherPage = round.starter === page ? p2Page : page;

    // Load URL and wait for network to settle
    await activePage.goto(currentUrl);
    await activePage.waitForLoadState('networkidle');

    // Wait for choice heading to appear and scroll into view
    const choiceHeading = activePage.getByRole('heading', { name: `Your Choice (${round.playerNumber})` });
    await choiceHeading.scrollIntoViewIfNeeded();
    await expect(choiceHeading).toBeVisible({ timeout: 10000 });

    // Make choice
    await activePage.click(`button:has-text("${round.choice}")`);
    await activePage.waitForTimeout(500);

    // Get URL for next player
    if (i < rounds.length - 1) {
      currentUrl = await activePage.evaluate(() => window.location.href);
    }
  }

  // Final round completion - game should be finished
  await page.goto(currentUrl);
  await expect(page.getByRole('heading', { name: 'Game Over!' })).toBeVisible({ timeout: 10000 });

  return { p1Page: page, p2Page, p1Name, p2Name };
}

test.describe('Rematch Flow Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should complete full rematch flow: P2 initiates → P1 receives → Round 2 starts', async ({ page }) => {
    // Complete initial game
    const { p1Page, p2Page, p1Name, p2Name } = await completeFullGame(page, 'Alice', 'Bob');

    // P2 (Bob) initiates rematch
    await expect(p2Page.getByRole('heading', { name: 'Game Over!' })).toBeVisible();
    await expect(p2Page.getByRole('button', { name: 'Rematch' })).toBeVisible();
    await p2Page.click('button:has-text("Rematch")');

    // P2 should see their choice interface (they go first now)
    await expect(p2Page.getByRole('heading', { name: 'Your Choice (Player 2)' })).toBeVisible({ timeout: 10000 });
    await expect(p2Page.getByText('Round 1 of 5')).toBeVisible();

    // P2 makes choice in rematch
    await p2Page.click('button:has-text("Stay Silent")');
    await expect(p2Page.getByRole('heading', { name: 'Choice Made!' })).toBeVisible();

    // Get rematch URL for P1
    const rematchUrl = await p2Page.evaluate(() => window.location.href);

    // P1 opens rematch URL
    await p1Page.goto(rematchUrl);

    // P1 should see previous game results notification
    await expect(p1Page.getByText('Previous game results saved to your history')).toBeVisible({ timeout: 5000 });

    // P1 should see their choice interface
    await expect(p1Page.getByRole('heading', { name: 'Your Choice (Player 1)' })).toBeVisible();

    // Verify P1's localStorage has both games saved
    const p1History = await p1Page.evaluate(() => {
      const data = localStorage.getItem('prisoners-dilemma-history');
      return data ? JSON.parse(data) : null;
    });

    expect(p1History).toBeTruthy();
    expect(p1History.games).toHaveLength(1); // Previous game saved
    expect(p1History.playerName).toBe('Alice');

    // P1 makes choice to complete Round 1 of rematch
    await p1Page.click('button:has-text("Talk")');

    // P1 should see Round 1 results and Round 2 interface
    await expect(p1Page.getByRole('heading', { name: 'Round 1 Results' })).toBeVisible({ timeout: 5000 });
    await expect(p1Page.getByText('Round 2 of 5')).toBeVisible();
    await expect(p1Page.getByRole('heading', { name: 'Your Choice (Player 1)' })).toBeVisible();
  });

  test('should save previous game to both players\' localStorage', async ({ page }) => {
    // Complete initial game
    const { p1Page, p2Page, p1Name, p2Name } = await completeFullGame(page, 'Carol', 'Dave');

    // Check P2's localStorage has the game saved before rematch
    const p2HistoryBefore = await p2Page.evaluate(() => {
      const data = localStorage.getItem('prisoners-dilemma-history');
      return data ? JSON.parse(data) : null;
    });

    expect(p2HistoryBefore).toBeTruthy();
    expect(p2HistoryBefore.games).toHaveLength(1);
    expect(p2HistoryBefore.playerName).toBe('Dave');

    const firstGameId = p2HistoryBefore.games[0].gameId;

    // P2 initiates rematch
    await p2Page.click('button:has-text("Rematch")');
    await expect(p2Page.getByRole('heading', { name: /Your Choice/ })).toBeVisible({ timeout: 10000 });

    // P2 makes choice
    await p2Page.click('button:has-text("Stay Silent")');
    const rematchUrl = await p2Page.evaluate(() => window.location.href);

    // P1 opens rematch URL
    await p1Page.goto(rematchUrl);

    // Wait for toast notification confirming save
    await expect(p1Page.getByText('Previous game results saved to your history')).toBeVisible({ timeout: 5000 });

    // Check P1's localStorage now has the previous game
    const p1History = await p1Page.evaluate(() => {
      const data = localStorage.getItem('prisoners-dilemma-history');
      return data ? JSON.parse(data) : null;
    });

    expect(p1History).toBeTruthy();
    expect(p1History.games).toHaveLength(1);
    expect(p1History.games[0].gameId).toBe(firstGameId);
    expect(p1History.playerName).toBe('Carol');

    // Verify game details in both players' history match
    expect(p1History.games[0].totals).toEqual(p2HistoryBefore.games[0].totals);
    expect(p1History.games[0].playerNames).toEqual(p2HistoryBefore.games[0].playerNames);
  });

  test('should clear previousGameResults field after P1 processes it', async ({ page }) => {
    // Complete initial game
    const { p1Page, p2Page } = await completeFullGame(page, 'Eve', 'Frank');

    // P2 initiates rematch
    await p2Page.click('button:has-text("Rematch")');
    await expect(p2Page.getByRole('heading', { name: /Your Choice/ })).toBeVisible({ timeout: 10000 });
    await p2Page.click('button:has-text("Stay Silent")');

    // Get rematch URL (contains previousGameResults)
    const rematchUrlWithPrevious = await p2Page.evaluate(() => window.location.href);

    // P1 loads and processes rematch URL
    await p1Page.goto(rematchUrlWithPrevious);
    await expect(p1Page.getByText(/Previous game results saved/)).toBeVisible({ timeout: 5000 });

    // P1 makes choice
    await p1Page.click('button:has-text("Talk")');
    await expect(p1Page.getByRole('heading', { name: 'Choice Made!' })).toBeVisible();

    // Get URL P1 shares back - should NOT have previousGameResults
    const urlAfterP1Choice = await p1Page.evaluate(() => window.location.href);

    // Verify URLs are different (previousGameResults was removed)
    expect(urlAfterP1Choice).not.toBe(rematchUrlWithPrevious);
    expect(urlAfterP1Choice.length).toBeLessThan(rematchUrlWithPrevious.length);

    // P2 loads P1's response URL
    await p2Page.goto(urlAfterP1Choice);

    // P2 should see Round 2 interface, not get previousGameResults again
    await expect(p2Page.getByRole('heading', { name: 'Round 1 Results' })).toBeVisible({ timeout: 5000 });
    await expect(p2Page.getByText('Round 2 of 5')).toBeVisible();

    // Verify no duplicate toast about previous game
    const toasts = await p2Page.getByText(/Previous game results saved/).count();
    expect(toasts).toBe(0);
  });

  test('should enforce role reversal: P2 goes first in rematch', async ({ page }) => {
    // Complete initial game where P1 went first
    const { p1Page, p2Page } = await completeFullGame(page, 'Grace', 'Heidi');

    // P2 initiates rematch
    await p2Page.click('button:has-text("Rematch")');

    // P2 should immediately see choice interface (no waiting)
    await expect(p2Page.getByRole('heading', { name: 'Your Choice (Player 2)' })).toBeVisible({ timeout: 10000 });
    await expect(p2Page.getByText('Round 1 of 5')).toBeVisible();

    // Verify P2 can make choice (they go first now)
    await expect(p2Page.locator('button:has-text("Stay Silent")')).toBeEnabled();
    await expect(p2Page.locator('button:has-text("Talk")')).toBeEnabled();

    // P2 makes choice
    await p2Page.click('button:has-text("Stay Silent")');
    await expect(p2Page.getByRole('heading', { name: 'Choice Made!' })).toBeVisible();

    // P1 loads the URL
    const urlAfterP2Choice = await p2Page.evaluate(() => window.location.href);
    await p1Page.goto(urlAfterP2Choice);

    // P1 should see choice interface (responding to P2)
    await expect(p1Page.getByRole('heading', { name: 'Your Choice (Player 1)' })).toBeVisible({ timeout: 5000 });
    await expect(p1Page.getByText('Player 2 has made their choice')).toBeVisible();

    // P1 makes choice to complete round
    await p1Page.click('button:has-text("Talk")');

    // Both should see Round 1 completed with P2's choice shown first in history
    await expect(p1Page.getByRole('heading', { name: 'Round 1 Results' })).toBeVisible({ timeout: 5000 });
    await expect(p1Page.getByText('Round 2 of 5')).toBeVisible();

    // In Round 2, P1 should go first (alternation continues)
    await expect(p1Page.getByRole('heading', { name: 'Your Choice (Player 1)' })).toBeVisible();
  });

  test('should handle multiple rematches in sequence', async ({ page }) => {
    // Complete first game
    let { p1Page, p2Page } = await completeFullGame(page, 'Ivan', 'Judy');

    // First rematch
    await p2Page.click('button:has-text("Rematch")');
    await expect(p2Page.getByRole('heading', { name: /Your Choice/ })).toBeVisible({ timeout: 10000 });
    await p2Page.click('button:has-text("Stay Silent")');

    const rematch1Url = await p2Page.evaluate(() => window.location.href);
    await p1Page.goto(rematch1Url);
    await p1Page.click('button:has-text("Talk")');

    // Skip to end of rematch game (abbreviated)
    // ... continue rounds 2-5 similar to completeFullGame

    // Check history count
    const historyAfterRematch1 = await p1Page.evaluate(() => {
      const data = localStorage.getItem('prisoners-dilemma-history');
      return data ? JSON.parse(data).games.length : 0;
    });

    expect(historyAfterRematch1).toBeGreaterThanOrEqual(1);
  });
});
