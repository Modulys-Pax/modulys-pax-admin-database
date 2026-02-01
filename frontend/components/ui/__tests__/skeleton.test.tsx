import { render } from '@testing-library/react';
import { Skeleton } from '../skeleton';

describe('Skeleton', () => {
  it('deve renderizar div', () => {
    const { container } = render(<Skeleton />);
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('deve ter classe animate-pulse', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveClass('animate-pulse');
  });

  it('deve ter classe rounded-md', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveClass('rounded-md');
  });

  it('deve ter classe bg-muted', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveClass('bg-muted');
  });

  it('deve aplicar className adicional', () => {
    const { container } = render(<Skeleton className="h-10 w-full" />);
    expect(container.firstChild).toHaveClass('h-10');
    expect(container.firstChild).toHaveClass('w-full');
  });

  it('deve aceitar outros props HTML', () => {
    const { container } = render(
      <Skeleton data-testid="skeleton" aria-label="Loading" />
    );
    expect(container.firstChild).toHaveAttribute('data-testid', 'skeleton');
    expect(container.firstChild).toHaveAttribute('aria-label', 'Loading');
  });

  it('pode ser usado para criar diferentes formatos', () => {
    const { container: line } = render(<Skeleton className="h-4 w-3/4" />);
    const { container: circle } = render(<Skeleton className="h-12 w-12 rounded-full" />);
    const { container: card } = render(<Skeleton className="h-40 w-full" />);

    expect(line.firstChild).toHaveClass('h-4', 'w-3/4');
    expect(circle.firstChild).toHaveClass('h-12', 'w-12', 'rounded-full');
    expect(card.firstChild).toHaveClass('h-40', 'w-full');
  });
});
