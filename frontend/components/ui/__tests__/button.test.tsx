import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../button';

describe('Button', () => {
  it('deve renderizar children corretamente', () => {
    render(<Button>Clique aqui</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Clique aqui');
  });

  it('deve aplicar variante default por padrão', () => {
    render(<Button>Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary');
  });

  it('deve aplicar variante destructive', () => {
    render(<Button variant="destructive">Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-destructive');
  });

  it('deve aplicar variante outline', () => {
    render(<Button variant="outline">Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('border');
  });

  it('deve aplicar variante secondary', () => {
    render(<Button variant="secondary">Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-secondary');
  });

  it('deve aplicar variante ghost', () => {
    render(<Button variant="ghost">Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('hover:bg-accent');
  });

  it('deve aplicar variante link', () => {
    render(<Button variant="link">Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('underline-offset-4');
  });

  it('deve aplicar tamanho default por padrão', () => {
    render(<Button>Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-10');
  });

  it('deve aplicar tamanho sm', () => {
    render(<Button size="sm">Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-9');
  });

  it('deve aplicar tamanho lg', () => {
    render(<Button size="lg">Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-11');
  });

  it('deve aplicar tamanho icon', () => {
    render(<Button size="icon">X</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('w-10');
  });

  it('deve aplicar className adicional', () => {
    render(<Button className="custom-class">Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('deve chamar onClick quando clicado', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Test</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('deve estar desabilitado quando disabled', () => {
    render(<Button disabled>Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50');
  });

  it('deve não chamar onClick quando desabilitado', () => {
    const handleClick = jest.fn();
    render(<Button disabled onClick={handleClick}>Test</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('deve aceitar type attribute', () => {
    render(<Button type="submit">Submit</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
  });
});
