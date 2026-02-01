import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  headerClassName,
  contentClassName,
}: SectionCardProps) {
  return (
    <Card className={cn('rounded-xl shadow-sm', className)}>
      {(title || description || actions) && (
        <CardHeader className={cn('pb-4', headerClassName)}>
          <div className="flex items-start justify-between gap-4">
            <div>
              {title && <CardTitle className="text-lg font-medium">{title}</CardTitle>}
              {description && (
                <CardDescription className="text-sm">{description}</CardDescription>
              )}
            </div>
            {actions && <div className="flex-shrink-0">{actions}</div>}
          </div>
        </CardHeader>
      )}
      <CardContent className={cn('gap-4', contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
