import React from 'react';
import { render, screen } from '@testing-library/react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../tooltip';

describe('Tooltip', () => {
  it('deve renderizar trigger', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('TooltipProvider deve renderizar children', () => {
    render(
      <TooltipProvider>
        <div>Child content</div>
      </TooltipProvider>
    );

    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('TooltipTrigger deve renderizar children', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <span>Trigger text</span>
          </TooltipTrigger>
          <TooltipContent>Tooltip content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    expect(screen.getByText('Trigger text')).toBeInTheDocument();
  });

  it('TooltipTrigger deve renderizar children com asChild', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button>Click me</button>
          </TooltipTrigger>
          <TooltipContent>Tooltip content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
