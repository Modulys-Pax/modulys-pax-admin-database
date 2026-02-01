import { render, screen } from '@testing-library/react';
import { Badge } from '../badge';

describe('Badge', () => {
  it('deve renderizar children corretamente', () => {
    render(<Badge>Ativo</Badge>);
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('deve aplicar variante default por padrão', () => {
    render(<Badge>Test</Badge>);
    const badge = screen.getByText('Test');
    expect(badge).toHaveClass('bg-primary');
  });

  it('deve aplicar variante secondary', () => {
    render(<Badge variant="secondary">Test</Badge>);
    const badge = screen.getByText('Test');
    expect(badge).toHaveClass('bg-secondary');
  });

  it('deve aplicar variante destructive', () => {
    render(<Badge variant="destructive">Test</Badge>);
    const badge = screen.getByText('Test');
    expect(badge).toHaveClass('bg-destructive');
  });

  it('deve aplicar variante outline', () => {
    render(<Badge variant="outline">Test</Badge>);
    const badge = screen.getByText('Test');
    expect(badge).toHaveClass('border');
  });

  it('deve aplicar className adicional', () => {
    render(<Badge className="custom-class">Test</Badge>);
    const badge = screen.getByText('Test');
    expect(badge).toHaveClass('custom-class');
  });

  it('deve ter classes base de badge', () => {
    render(<Badge>Test</Badge>);
    const badge = screen.getByText('Test');
    expect(badge).toHaveClass('inline-flex');
    expect(badge).toHaveClass('rounded-full');
    expect(badge).toHaveClass('text-xs');
  });

  it('deve renderizar como span', () => {
    render(<Badge>Test</Badge>);
    const badge = screen.getByText('Test');
    expect(badge.tagName).toBe('SPAN');
  });
});
