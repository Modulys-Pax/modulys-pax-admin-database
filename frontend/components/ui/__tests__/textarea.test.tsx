import { render, screen, fireEvent } from '@testing-library/react';
import { Textarea } from '../textarea';
import { createRef } from 'react';

describe('Textarea', () => {
  it('deve renderizar textarea', () => {
    render(<Textarea placeholder="Digite sua mensagem" />);
    expect(screen.getByPlaceholderText('Digite sua mensagem')).toBeInTheDocument();
  });

  it('deve aceitar value e onChange', () => {
    const handleChange = jest.fn();
    render(<Textarea value="texto inicial" onChange={handleChange} />);
    
    const textarea = screen.getByDisplayValue('texto inicial');
    fireEvent.change(textarea, { target: { value: 'novo texto' } });
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('deve aplicar className adicional', () => {
    render(<Textarea className="custom-class" data-testid="textarea" />);
    expect(screen.getByTestId('textarea')).toHaveClass('custom-class');
  });

  it('deve estar desabilitado quando disabled', () => {
    render(<Textarea disabled data-testid="textarea" />);
    expect(screen.getByTestId('textarea')).toBeDisabled();
  });

  it('deve ter altura mínima', () => {
    render(<Textarea data-testid="textarea" />);
    expect(screen.getByTestId('textarea')).toHaveClass('min-h-[80px]');
  });

  it('deve ter classes de estilo base', () => {
    render(<Textarea data-testid="textarea" />);
    const textarea = screen.getByTestId('textarea');
    expect(textarea).toHaveClass('rounded-md');
    expect(textarea).toHaveClass('border');
    expect(textarea).toHaveClass('w-full');
  });

  it('deve encaminhar ref', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('deve aceitar rows', () => {
    render(<Textarea rows={5} data-testid="textarea" />);
    expect(screen.getByTestId('textarea')).toHaveAttribute('rows', '5');
  });

  it('deve aplicar classes de disabled', () => {
    render(<Textarea disabled data-testid="textarea" />);
    expect(screen.getByTestId('textarea')).toHaveClass('disabled:opacity-50');
  });
});
