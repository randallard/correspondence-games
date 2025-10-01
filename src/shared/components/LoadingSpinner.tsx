/**
 * @fileoverview Loading spinner component with accessibility support
 * @module shared/components/LoadingSpinner
 */

import { ReactElement } from 'react';

/**
 * Props for the LoadingSpinner component.
 */
interface LoadingSpinnerProps {
  /** Optional loading message to display @default 'Loading...' */
  message?: string;

  /** Size of the spinner in pixels @default 40 */
  size?: number;

  /** Color of the spinner @default '#4f46e5' */
  color?: string;
}

/**
 * Loading spinner component with accessibility support.
 *
 * Displays an animated spinner to indicate loading state.
 * Includes proper ARIA attributes for screen readers and
 * an optional customizable loading message.
 *
 * @component
 * @example
 * ```tsx
 * <LoadingSpinner />
 * ```
 *
 * @example
 * ```tsx
 * <LoadingSpinner
 *   message="Loading your data..."
 *   size={60}
 *   color="#10b981"
 * />
 * ```
 */
export const LoadingSpinner = ({
  message = 'Loading...',
  size = 40,
  color = '#4f46e5',
}: LoadingSpinnerProps): ReactElement => {
  /**
   * Container styles for centering the spinner.
   */
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: 'sans-serif',
  };

  /**
   * Spinner animation styles.
   */
  const spinnerStyles: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    border: `4px solid rgba(79, 70, 229, 0.1)`,
    borderTop: `4px solid ${color}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  };

  /**
   * Message text styles.
   */
  const messageStyles: React.CSSProperties = {
    marginTop: '16px',
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: 500,
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      style={containerStyles}
    >
      <style>
        {`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
      <div style={spinnerStyles} aria-hidden="true" />
      <span style={messageStyles} aria-label={message}>
        {message}
      </span>
    </div>
  );
};
