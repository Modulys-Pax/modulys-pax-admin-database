import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../input';
import { createRef } from 'react';

describe('Input', () => {
  it('deve renderizar input', () => {
    render(<Input placeholder="Digite aqui" />);
    expect(screen.getByPlaceholderText('Digite aqui')).toBeInTheDocument();
  });

  it('deve renderizar como input de texto por padrão', () => {
    render(<Input data-testid="input" />);
    // Input sem type definido funciona como text por padrão no HTML
    const input = screen.getByTestId('input');
    expect(input.tagName).toBe('INPUT');
  });

  it('deve aplicar type personalizado', () => {
    render(<Input type="email" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'email');
  });

  it('deve aceitar value e onChange', () => {
    const handleChange = jest.fn();
    render(<Input value="teste" onChange={handleChange} />);
    
    const input = screen.getByDisplayValue('teste');
    fireEvent.change(input, { target: { value: 'novo valor' } });
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('deve aplicar className adicional', () => {
    render(<Input className="custom-class" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveClass('custom-class');
  });

  it('deve estar desabilitado quando disabled', () => {
    render(<Input disabled data-testid="input" />);
    expect(screen.getByTestId('input')).toBeDisabled();
  });

  it('deve ter classes de estilo base', () => {
    render(<Input data-testid="input" />);
    const input = screen.getByTestId('input');
    expect(input).toHaveClass('rounded-md');
    expect(input).toHaveClass('border');
    expect(input).toHaveClass('h-10');
  });

  it('deve encaminhar ref', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('deve aceitar outros atributos HTML', () => {
    render(
      <Input
        data-testid="input"
        maxLength={10}
        required
        autoComplete="off"
      />
    );
    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('maxLength', '10');
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('autoComplete', 'off');
  });

  it('deve aplicar classes de disabled', () => {
    render(<Input disabled data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveClass('disabled:opacity-50');
  });
});
