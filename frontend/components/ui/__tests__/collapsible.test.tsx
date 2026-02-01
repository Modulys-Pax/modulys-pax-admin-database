import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../collapsible';

describe('Collapsible', () => {
  it('deve renderizar trigger', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    );

    expect(screen.getByText('Toggle')).toBeInTheDocument();
  });

  it('deve esconder content por padrão', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    );

    // O content pode não ser renderizado ou ter display hidden
    const content = screen.queryByText('Content');
    // Radix pode não renderizar o content inicialmente
    expect(content === null || content.getAttribute('data-state') === 'closed').toBe(true);
  });

  it('deve mostrar content quando open=true', () => {
    render(
      <Collapsible open>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    );

    expect(screen.getByText('Content')).toBeVisible();
  });

  it('deve alternar content ao clicar no trigger', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    );

    fireEvent.click(screen.getByText('Toggle'));
    
    expect(screen.getByText('Content')).toBeVisible();
  });

  it('deve chamar onOpenChange', () => {
    const onOpenChange = jest.fn();

    render(
      <Collapsible onOpenChange={onOpenChange}>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    );

    fireEvent.click(screen.getByText('Toggle'));
    
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });
});
