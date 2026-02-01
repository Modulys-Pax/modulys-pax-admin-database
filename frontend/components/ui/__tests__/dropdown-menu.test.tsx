import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  DropdownMenuShortcut,
} from '../dropdown-menu';

describe('DropdownMenu', () => {
  it('DropdownMenuShortcut deve renderizar corretamente', () => {
    render(<DropdownMenuShortcut>⌘S</DropdownMenuShortcut>);
    
    expect(screen.getByText('⌘S')).toBeInTheDocument();
  });

  it('DropdownMenuShortcut deve aplicar className', () => {
    render(<DropdownMenuShortcut className="custom">⌘S</DropdownMenuShortcut>);
    
    expect(screen.getByText('⌘S')).toHaveClass('custom');
  });

  it('DropdownMenuShortcut deve ter estilos padrão', () => {
    render(<DropdownMenuShortcut>⌘K</DropdownMenuShortcut>);
    
    expect(screen.getByText('⌘K')).toHaveClass('ml-auto');
    expect(screen.getByText('⌘K')).toHaveClass('text-xs');
  });
});
