import { cn } from '../../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export function Card({ children, className, title, description }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm',
        className,
      )}
    >
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-on-surface">{title}</h3>
          {description && (
            <p className="text-sm text-on-surface-variant">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
