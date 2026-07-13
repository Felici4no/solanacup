import type { ButtonHTMLAttributes, ReactNode } from 'react'

/* ============================================================
   Button — one reusable control for the whole app.
   Variants: primary · secondary · ghost · text · destructive
   Sizes: sm · md · lg   States: loading · disabled · pressed · focus
   Every visible action routes through this so padding, targets and
   states are consistent and never a "did it work?" moment.
   ============================================================ */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'text' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  iconStart?: ReactNode
  iconEnd?: ReactNode
  block?: boolean
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  iconStart,
  iconEnd,
  block = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...rest
}: Props) {
  const isDisabled = disabled || loading
  return (
    <button
      type={type}
      className={`btn btn-${variant} btn-${size}${block ? ' btn-block' : ''} ${className}`.trim()}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <span className="btn-spinner" aria-hidden />
      ) : (
        iconStart && <span className="btn-ic">{iconStart}</span>
      )}
      <span className="btn-label">{children}</span>
      {iconEnd && !loading && <span className="btn-ic">{iconEnd}</span>}
    </button>
  )
}
