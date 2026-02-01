import React from 'react';
import { render, screen } from '@testing-library/react';
import { ScrollArea } from '../scroll-area';

describe('ScrollArea', () => {
  it('deve renderizar children', () => {
    render(
      <ScrollArea>
        <div>Content</div>
      </ScrollArea>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('deve aplicar className customizado', () => {
    const { container } = render(
      <ScrollArea className="custom-class">
        <div>Content</div>
      </ScrollArea>
    );

    const scrollArea = container.firstChild;
    expect(scrollArea).toHaveClass('custom-class');
  });

  it('deve ter classe overflow-hidden', () => {
    const { container } = render(
      <ScrollArea>
        <div>Content</div>
      </ScrollArea>
    );

    const scrollArea = container.firstChild;
    expect(scrollArea).toHaveClass('overflow-hidden');
  });
});
