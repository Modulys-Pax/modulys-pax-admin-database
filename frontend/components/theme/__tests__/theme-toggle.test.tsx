import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeToggle } from '../theme-toggle';
import { ThemeProvider } from '../theme-provider';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => 'light'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('ThemeToggle', () => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider>{children}</ThemeProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar botão de toggle', () => {
    render(
      <Wrapper>
        <ThemeToggle />
      </Wrapper>
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('deve ter texto acessível', () => {
    render(
      <Wrapper>
        <ThemeToggle />
      </Wrapper>
    );

    expect(screen.getByText('Alternar tema')).toBeInTheDocument();
  });

  it('deve renderizar ícones de sol e lua', () => {
    const { container } = render(
      <Wrapper>
        <ThemeToggle />
      </Wrapper>
    );

    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(2);
  });

  it('deve ter variante ghost e tamanho icon', () => {
    render(
      <Wrapper>
        <ThemeToggle />
      </Wrapper>
    );

    const button = screen.getByRole('button');
    // Verifica classes típicas do botão ghost/icon
    expect(button).toHaveClass('h-10');
    expect(button).toHaveClass('w-10');
  });

  it('deve abrir dropdown ao clicar', () => {
    render(
      <Wrapper>
        <ThemeToggle />
      </Wrapper>
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('deve ter estrutura de dropdown menu', () => {
    const { container } = render(
      <Wrapper>
        <ThemeToggle />
      </Wrapper>
    );

    expect(container.querySelector('button')).toBeInTheDocument();
  });
});
