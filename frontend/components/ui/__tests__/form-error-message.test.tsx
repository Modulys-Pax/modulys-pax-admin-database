import { render, screen } from '@testing-library/react';
import { FormErrorMessage } from '../form-error-message';

describe('FormErrorMessage', () => {
  it('deve renderizar mensagem de erro como string', () => {
    render(<FormErrorMessage error="Campo obrigatório" />);
    expect(screen.getByText('Campo obrigatório')).toBeInTheDocument();
  });

  it('deve renderizar mensagem de erro como objeto', () => {
    render(<FormErrorMessage error={{ message: 'Email inválido' }} />);
    expect(screen.getByText('Email inválido')).toBeInTheDocument();
  });

  it('não deve renderizar nada quando error é undefined', () => {
    const { container } = render(<FormErrorMessage error={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('não deve renderizar nada quando error.message é undefined', () => {
    const { container } = render(<FormErrorMessage error={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it('não deve renderizar nada quando message está vazia', () => {
    const { container } = render(<FormErrorMessage error={{ message: '' }} />);
    expect(container.firstChild).toBeNull();
  });

  it('deve aplicar classe text-destructive', () => {
    render(<FormErrorMessage error="Erro" />);
    expect(screen.getByText('Erro')).toHaveClass('text-destructive');
  });

  it('deve aplicar classe text-sm', () => {
    render(<FormErrorMessage error="Erro" />);
    expect(screen.getByText('Erro')).toHaveClass('text-sm');
  });

  it('deve aplicar className adicional', () => {
    render(<FormErrorMessage error="Erro" className="custom-class" />);
    expect(screen.getByText('Erro')).toHaveClass('custom-class');
  });

  it('deve renderizar como elemento p', () => {
    render(<FormErrorMessage error="Erro" />);
    expect(screen.getByText('Erro').tagName).toBe('P');
  });
});
