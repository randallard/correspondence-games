/**
 * @fileoverview Button component with multiple variants and accessibility support
 * @module shared/components/Button
 */

import { ReactElement, MouseEvent } from 'react';

/**
 * Props for the Button component.
 */
interface ButtonProps {
  /** Visual style variant of the button */
  variant: 'primary' | 'secondary';

  /** Click handler for the button */
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;

  /** Content to be rendered inside the button */
  children: React.ReactNode;

  /** Whether the button is disabled @default false */
  disabled?: boolean;

  /** Button type attribute @default 'button' */
  type?: 'button' | 'submit' | 'reset';

  /** ARIA label for accessibility (optional, falls back to children text) */
  ariaLabel?: string;
}

/**
 * Button component with multiple variants and sizes.
 *
 * Provides a reusable button with consistent styling and behavior
 * across the application. Supports keyboard navigation and screen readers.
 *
 * @component
 * @example
 * ```tsx
 * <Button
 *   variant="primary"
 *   onClick={handleSubmit}
 * >
 *   Submit Form
 * </Button>
 * ```
 *
 * @example
 * ```tsx
 * <Button
 *   variant="secondary"
 *   onClick={handleCancel}
 *   disabled={isProcessing}
 * >
 *   Cancel
 * </Button>
 * ```
 */
export const Button = ({
  variant,
  onClick,
  children,
  disabled = false,
  type = 'button',
  ariaLabel,
}: ButtonProps): ReactElement => {
  /**
   * Base styles applied to all button variants.
   */
  const baseStyles: React.CSSProperties = {
    padding: '10px 20px',
    fontSize: '16px',
    fontWeight: 600,
    border: 'none',
    borderRadius: '6px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease-in-out',
    opacity: disabled ? 0.6 : 1,
    fontFamily: 'inherit',
  };

  /**
   * Variant-specific styles.
   */
  const variantStyles: Record<'primary' | 'secondary', React.CSSProperties> = {
    primary: {
      backgroundColor: disabled ? '#6366f1' : '#4f46e5',
      color: '#ffffff',
    },
    secondary: {
      backgroundColor: disabled ? '#e5e7eb' : '#f3f4f6',
      color: '#1f2937',
      border: '1px solid #d1d5db',
    },
  };

  /**
   * Hover styles (applied via inline hover handling).
   */
  const hoverStyles: Record<'primary' | 'secondary', React.CSSProperties> = {
    primary: {
      backgroundColor: '#4338ca',
    },
    secondary: {
      backgroundColor: '#e5e7eb',
    },
  };

  /**
   * Combined styles for the button.
   */
  const buttonStyles: React.CSSProperties = {
    ...baseStyles,
    ...variantStyles[variant],
  };

  /**
   * Handles mouse enter event for hover effects.
   *
   * @param event - The mouse event
   */
  const handleMouseEnter = (event: MouseEvent<HTMLButtonElement>): void => {
    if (!disabled) {
      Object.assign(event.currentTarget.style, hoverStyles[variant]);
    }
  };

  /**
   * Handles mouse leave event for hover effects.
   *
   * @param event - The mouse event
   */
  const handleMouseLeave = (event: MouseEvent<HTMLButtonElement>): void => {
    if (!disabled) {
      Object.assign(event.currentTarget.style, variantStyles[variant]);
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={buttonStyles}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={ariaLabel}
      aria-disabled={disabled}
    >
      {children}
    </button>
  );
};
