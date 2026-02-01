import React from 'react';
import { render } from '@testing-library/react';
import { Toaster } from '../toaster';

// Mock sonner
jest.mock('sonner', () => ({
  Toaster: jest.fn(({ className, toastOptions, ...props }: any) => (
    <div data-testid="sonner-toaster" className={className} {...props} />
  )),
}));

describe('Toaster', () => {
  it('deve renderizar Sonner com classes corretas', () => {
    const { getByTestId } = render(<Toaster />);
    
    const toaster = getByTestId('sonner-toaster');
    expect(toaster).toHaveClass('toaster');
    expect(toaster).toHaveClass('group');
  });

  it('deve passar props adicionais', () => {
    const { getByTestId } = render(<Toaster position="top-right" />);
    
    const toaster = getByTestId('sonner-toaster');
    expect(toaster).toHaveAttribute('position', 'top-right');
  });

  it('deve renderizar sem erros', () => {
    expect(() => render(<Toaster />)).not.toThrow();
  });
});
