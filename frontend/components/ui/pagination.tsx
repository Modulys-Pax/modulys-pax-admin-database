import * as React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';

const Pagination = ({ className, ...props }: React.ComponentProps<'nav'>) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn('mx-auto flex w-full justify-center', className)}
    {...props}
  />
);
Pagination.displayName = 'Pagination';

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<'ul'>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn('flex flex-row items-center gap-1', className)}
    {...props}
  />
));
PaginationContent.displayName = 'PaginationContent';

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<'li'>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn('', className)} {...props} />
));
PaginationItem.displayName = 'PaginationItem';

type PaginationLinkProps = {
  isActive?: boolean;
} & (React.ComponentProps<'button'> | React.ComponentProps<'a'>);

const PaginationLink = ({
  className,
  isActive,
  onClick,
  ...props
}: PaginationLinkProps) => {
  const baseClassName = cn(
    buttonVariants({
      variant: isActive ? 'outline' : 'ghost',
      size: 'icon',
    }),
    isActive && 'border-primary',
    className,
  );

  if (onClick || !('href' in props)) {
    return (
      <button
        type="button"
        aria-current={isActive ? 'page' : undefined}
        className={baseClassName}
        onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
        {...(props as React.ComponentProps<'button'>)}
      />
    );
  }

  return (
    <a
      aria-current={isActive ? 'page' : undefined}
      className={baseClassName}
      {...(props as React.ComponentProps<'a'>)}
    />
  );
};
PaginationLink.displayName = 'PaginationLink';

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof Button>) => (
  <Button
    aria-label="Go to previous page"
    variant="outline"
    size="icon"
    className={cn('h-9 w-9', className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
  </Button>
);
PaginationPrevious.displayName = 'PaginationPrevious';

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof Button>) => (
  <Button
    aria-label="Go to next page"
    variant="outline"
    size="icon"
    className={cn('h-9 w-9', className)}
    {...props}
  >
    <ChevronRight className="h-4 w-4" />
  </Button>
);
PaginationNext.displayName = 'PaginationNext';

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<'span'>) => (
  <span
    aria-hidden
    className={cn('flex h-9 w-9 items-center justify-center', className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
);
PaginationEllipsis.displayName = 'PaginationEllipsis';

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
