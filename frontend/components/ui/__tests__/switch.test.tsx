import { render, screen, fireEvent } from '@testing-library/react';
import { Switch } from '../switch';

describe('Switch', () => {
  it('deve renderizar switch', () => {
    render(<Switch aria-label="Ativar notificações" />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('deve estar desligado por padrão', () => {
    render(<Switch aria-label="Teste" />);
    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  it('deve estar ligado quando checked', () => {
    render(<Switch checked aria-label="Teste" />);
    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('deve chamar onCheckedChange ao clicar', () => {
    const handleChange = jest.fn();
    render(<Switch onCheckedChange={handleChange} aria-label="Teste" />);
    
    fireEvent.click(screen.getByRole('switch'));
    expect(handleChange).toHaveBeenCalled();
  });

  it('deve estar desabilitado quando disabled', () => {
    render(<Switch disabled aria-label="Teste" />);
    expect(screen.getByRole('switch')).toBeDisabled();
  });

  it('deve aplicar className adicional', () => {
    render(<Switch className="custom-class" aria-label="Teste" />);
    expect(screen.getByRole('switch')).toHaveClass('custom-class');
  });

  it('deve ter tamanho correto', () => {
    render(<Switch aria-label="Teste" />);
    const switchEl = screen.getByRole('switch');
    expect(switchEl).toHaveClass('h-5');
    expect(switchEl).toHaveClass('w-9');
  });

  it('deve ter estilo de cursor pointer', () => {
    render(<Switch aria-label="Teste" />);
    expect(screen.getByRole('switch')).toHaveClass('cursor-pointer');
  });

  it('deve ter arredondamento completo', () => {
    render(<Switch aria-label="Teste" />);
    expect(screen.getByRole('switch')).toHaveClass('rounded-full');
  });
});
