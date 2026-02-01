import { render, screen, fireEvent } from '@testing-library/react';
import { Checkbox } from '../checkbox';

describe('Checkbox', () => {
  it('deve renderizar checkbox', () => {
    render(<Checkbox aria-label="Aceitar termos" />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('deve estar desmarcado por padrão', () => {
    render(<Checkbox aria-label="Teste" />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('deve estar marcado quando checked', () => {
    render(<Checkbox checked aria-label="Teste" />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('deve chamar onCheckedChange ao clicar', () => {
    const handleChange = jest.fn();
    render(<Checkbox onCheckedChange={handleChange} aria-label="Teste" />);
    
    fireEvent.click(screen.getByRole('checkbox'));
    expect(handleChange).toHaveBeenCalled();
  });

  it('deve estar desabilitado quando disabled', () => {
    render(<Checkbox disabled aria-label="Teste" />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('deve aplicar className adicional', () => {
    render(<Checkbox className="custom-class" aria-label="Teste" />);
    expect(screen.getByRole('checkbox')).toHaveClass('custom-class');
  });

  it('deve ter tamanho correto', () => {
    render(<Checkbox aria-label="Teste" />);
    expect(screen.getByRole('checkbox')).toHaveClass('h-4');
    expect(screen.getByRole('checkbox')).toHaveClass('w-4');
  });

  it('deve ter borda e arredondamento', () => {
    render(<Checkbox aria-label="Teste" />);
    expect(screen.getByRole('checkbox')).toHaveClass('border');
    expect(screen.getByRole('checkbox')).toHaveClass('rounded-sm');
  });
});
