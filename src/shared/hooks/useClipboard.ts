/**
 * @fileoverview Custom hook for clipboard operations
 * @module shared/hooks/useClipboard
 */

import { useState, useCallback } from 'react';

/**
 * Result type for useClipboard hook
 */
export interface UseClipboardResult {
  /** Function to copy text to clipboard */
  copyToClipboard: (text: string) => Promise<void>;
  /** Whether the text was recently copied */
  isCopied: boolean;
  /** Error if copy failed */
  error: Error | null;
}

/**
 * Custom hook for copying text to clipboard
 *
 * Provides clipboard functionality with success/error states
 * Auto-resets isCopied state after specified delay
 *
 * @param resetDelay - Time in ms before resetting isCopied state (default: 2000)
 * @returns Clipboard utilities
 *
 * @example
 * ```tsx
 * function ShareButton() {
 *   const { copyToClipboard, isCopied, error } = useClipboard();
 *
 *   return (
 *     <button onClick={() => copyToClipboard('https://example.com')}>
 *       {isCopied ? 'Copied!' : 'Copy URL'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useClipboard(resetDelay = 2000): UseClipboardResult {
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const copyToClipboard = useCallback(
    async (text: string): Promise<void> => {
      try {
        // Use modern Clipboard API if available
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();

          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);

          if (!successful) {
            throw new Error('Failed to copy text using fallback method');
          }
        }

        setIsCopied(true);
        setError(null);

        // Reset copied state after delay
        setTimeout(() => {
          setIsCopied(false);
        }, resetDelay);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to copy to clipboard');
        setError(error);
        setIsCopied(false);
        console.error('Clipboard copy failed:', error);
      }
    },
    [resetDelay]
  );

  return {
    copyToClipboard,
    isCopied,
    error,
  };
}
