/**
 * @fileoverview Toast notification component for system messages
 * @module features/game/components/ToastNotification
 */

import { ReactElement, useEffect } from 'react';
import type { ToastNotification as ToastType } from '../types/history';

/**
 * Props for the ToastNotification component.
 */
interface ToastNotificationProps {
  /** Toast notification data */
  toast: ToastType;

  /** Callback when toast is dismissed */
  onDismiss: (id: string) => void;

  /** Auto-dismiss timeout in milliseconds (default: 5000, 0 to disable) */
  autoHideDuration?: number;
}

/**
 * ToastNotification component for displaying system messages.
 *
 * Shows a dismissible notification with icon, message, and close button.
 * Auto-dismisses after specified duration unless disabled.
 *
 * @component
 * @example
 * ```tsx
 * <ToastNotification
 *   toast={{
 *     id: '1',
 *     type: 'success',
 *     message: 'Game saved successfully!',
 *     timestamp: new Date().toISOString()
 *   }}
 *   onDismiss={(id) => removeToast(id)}
 *   autoHideDuration={5000}
 * />
 * ```
 */
export const ToastNotification = ({
  toast,
  onDismiss,
  autoHideDuration = 5000,
}: ToastNotificationProps): ReactElement => {
  // Auto-dismiss after duration
  useEffect(() => {
    if (autoHideDuration > 0) {
      const timer = setTimeout(() => {
        onDismiss(toast.id);
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [toast.id, autoHideDuration, onDismiss]);

  /**
   * Gets background color based on toast type.
   */
  const getBackgroundColor = (): string => {
    switch (toast.type) {
      case 'success':
        return '#d1fae5';
      case 'warning':
        return '#fef3c7';
      case 'info':
        return '#dbeafe';
      default:
        return '#f3f4f6';
    }
  };

  /**
   * Gets border color based on toast type.
   */
  const getBorderColor = (): string => {
    switch (toast.type) {
      case 'success':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'info':
        return '#3b82f6';
      default:
        return '#9ca3af';
    }
  };

  /**
   * Gets icon based on toast type.
   */
  const getIcon = (): string => {
    switch (toast.type) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '•';
    }
  };

  /**
   * Container styles.
   */
  const containerStyles: React.CSSProperties = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    maxWidth: '400px',
    padding: '16px 20px',
    backgroundColor: getBackgroundColor(),
    border: `2px solid ${getBorderColor()}`,
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    zIndex: 1000,
    animation: 'slideIn 0.3s ease-out',
    fontFamily: 'inherit',
  };

  /**
   * Icon styles.
   */
  const iconStyles: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 700,
    color: getBorderColor(),
    flexShrink: 0,
  };

  /**
   * Message styles.
   */
  const messageStyles: React.CSSProperties = {
    flex: 1,
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#1f2937',
  };

  /**
   * Close button styles.
   */
  const closeButtonStyles: React.CSSProperties = {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    color: '#6b7280',
    cursor: 'pointer',
    padding: '0',
    marginLeft: '8px',
    flexShrink: 0,
    lineHeight: '1',
  };

  return (
    <div
      style={containerStyles}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div style={iconStyles} aria-hidden="true">
        {getIcon()}
      </div>
      <div style={messageStyles}>{toast.message}</div>
      <button
        style={closeButtonStyles}
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        type="button"
      >
        ×
      </button>

      {/* Inline keyframes for slide-in animation */}
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};

/**
 * Container component for managing multiple toasts.
 */
interface ToastContainerProps {
  /** Array of toasts to display */
  toasts: ToastType[];

  /** Callback when a toast is dismissed */
  onDismiss: (id: string) => void;

  /** Auto-dismiss duration (default: 5000ms) */
  autoHideDuration?: number;
}

/**
 * ToastContainer component for displaying multiple toasts stacked.
 *
 * @component
 * @example
 * ```tsx
 * <ToastContainer
 *   toasts={toastList}
 *   onDismiss={handleDismiss}
 * />
 * ```
 */
export const ToastContainer = ({
  toasts,
  onDismiss,
  autoHideDuration,
}: ToastContainerProps): ReactElement | null => {
  if (toasts.length === 0) {
    return null;
  }

  /**
   * Container styles for stacking toasts.
   */
  const containerStyles: React.CSSProperties = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    zIndex: 1000,
  };

  return (
    <div style={containerStyles}>
      {toasts.map((toast) => (
        <ToastNotification
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          autoHideDuration={autoHideDuration}
        />
      ))}
    </div>
  );
};
