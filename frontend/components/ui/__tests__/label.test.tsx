import { render, screen } from '@testing-library/react';
import { Label } from '../label';

describe('Label', () => {
  it('deve renderizar texto do label', () => {
    render(<Label>Nome</Label>);
    expect(screen.getByText('Nome')).toBeInTheDocument();
  });

  it('deve aplicar htmlFor', () => {
    render(<Label htmlFor="name-input">Nome</Label>);
    expect(screen.getByText('Nome')).toHaveAttribute('for', 'name-input');
  });

  it('deve aplicar className adicional', () => {
    render(<Label className="custom-class">Label</Label>);
    expect(screen.getByText('Label')).toHaveClass('custom-class');
  });

  it('deve ter classes de estilo base', () => {
    render(<Label>Label</Label>);
    const label = screen.getByText('Label');
    expect(label).toHaveClass('text-sm');
    expect(label).toHaveClass('font-medium');
  });

  it('deve renderizar children complexos', () => {
    render(
      <Label>
        <span>Campo</span> <span className="text-red-500">*</span>
      </Label>
    );
    expect(screen.getByText('Campo')).toBeInTheDocument();
    expect(screen.getByText('*')).toHaveClass('text-red-500');
  });
});
