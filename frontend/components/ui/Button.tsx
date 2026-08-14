'use client';

import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/helpers';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      fullWidth = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'text-sm px-4 py-2',
      md: 'text-sm px-5 py-2.5',
      lg: 'text-base px-7 py-3.5',
    };

    const variantClass =
      variant === 'primary'
        ? 'btn-primary'
        : variant === 'secondary'
        ? 'btn-secondary'
        : variant === 'danger'
        ? 'bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20 rounded-xl font-semibold transition-all'
        : 'bg-transparent hover:bg-[var(--bg-card-alt)] text-[var(--text-primary)] rounded-xl font-medium transition-all';

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          variantClass,
          sizeClasses[size],
          fullWidth && 'w-full',
          'inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
