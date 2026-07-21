import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../../lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary',
      secondary:
        'bg-secondary text-secondary-foreground hover:bg-surface-container focus:ring-primary border border-outline-variant',
      danger: 'bg-error text-on-error hover:bg-error/90 focus:ring-error',
      ghost: 'bg-transparent text-on-surface-variant hover:bg-surface-container-low',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';
