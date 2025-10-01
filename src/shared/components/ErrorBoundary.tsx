/**
 * @fileoverview Error boundary component for catching and displaying React errors
 * @module shared/components/ErrorBoundary
 */

import React, { ReactElement, ReactNode, ErrorInfo } from 'react';

/**
 * Props for the ErrorBoundary component.
 */
interface ErrorBoundaryProps {
  /** Child components to render when no error occurs */
  children: ReactNode;

  /** Optional custom fallback component to display when error occurs */
  fallback?: ReactElement;

  /** Optional callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * State for the ErrorBoundary component.
 */
interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;

  /** The error that was caught, if any */
  error: Error | null;

  /** Additional error information from React */
  errorInfo: ErrorInfo | null;
}

/**
 * Error boundary component for catching and handling React errors.
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing
 * the entire application. Essential for production applications.
 *
 * @component
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   fallback={<CustomErrorDisplay />}
 *   onError={(error, errorInfo) => logErrorToService(error, errorInfo)}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  /**
   * Initializes the ErrorBoundary with default state.
   *
   * @param props - Component props
   */
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Static method called when an error is thrown in a child component.
   *
   * Updates state to trigger fallback UI rendering.
   *
   * @param error - The error that was thrown
   * @returns Updated state object
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Lifecycle method called after an error is caught.
   *
   * Logs error details and calls optional onError callback.
   *
   * @param error - The error that was thrown
   * @param errorInfo - Additional information about the error
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error component stack:', errorInfo.componentStack);

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Resets the error boundary state to allow retry.
   */
  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Renders either the children or the error fallback UI.
   *
   * @returns The component tree or fallback UI
   */
  render(): ReactNode {
    if (this.state.hasError) {
      // If custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI with user-friendly message
      return (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            padding: '20px',
            margin: '20px',
            backgroundColor: '#fee2e2',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            fontFamily: 'sans-serif',
          }}
        >
          <h2
            style={{
              color: '#991b1b',
              fontSize: '20px',
              fontWeight: 700,
              marginTop: 0,
              marginBottom: '12px',
            }}
          >
            Something went wrong
          </h2>
          <p
            style={{
              color: '#7f1d1d',
              fontSize: '14px',
              marginBottom: '16px',
            }}
          >
            We encountered an unexpected error. Please try refreshing the page
            or contact support if the problem persists.
          </p>
          {this.state.error && (
            <details
              style={{
                marginTop: '12px',
                padding: '12px',
                backgroundColor: '#ffffff',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#374151',
              }}
            >
              <summary
                style={{
                  cursor: 'pointer',
                  fontWeight: 600,
                  marginBottom: '8px',
                }}
              >
                Error details
              </summary>
              <pre
                style={{
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                }}
              >
                {this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          <button
            onClick={this.handleReset}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            aria-label="Try again"
          >
            Try Again
          </button>
        </div>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}
