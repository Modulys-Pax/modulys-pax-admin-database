import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ProtectedRoute } from '../protected-route';

// Mock do useRouter
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock do useAuth
jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: jest.fn(),
}));

import { useAuth } from '@/lib/auth/auth-context';

const mockUseAuth = useAuth as jest.Mock;

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve mostrar loading enquanto verifica autenticação', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    render(
      <ProtectedRoute>
        <div>Conteúdo protegido</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    expect(screen.queryByText('Conteúdo protegido')).not.toBeInTheDocument();
  });

  it('deve mostrar spinner de loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    const { container } = render(
      <ProtectedRoute>
        <div>Conteúdo protegido</div>
      </ProtectedRoute>
    );

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('deve redirecionar para login quando não autenticado', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <ProtectedRoute>
        <div>Conteúdo protegido</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('deve renderizar children quando autenticado', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <ProtectedRoute>
        <div>Conteúdo protegido</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Conteúdo protegido')).toBeInTheDocument();
  });

  it('não deve redirecionar quando autenticado', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <ProtectedRoute>
        <div>Conteúdo protegido</div>
      </ProtectedRoute>
    );

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('deve retornar null enquanto não autenticado e não carregando', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    const { container } = render(
      <ProtectedRoute>
        <div>Conteúdo protegido</div>
      </ProtectedRoute>
    );

    // Após redirect, retorna null
    expect(container.firstChild).toBeNull();
  });

  it('deve renderizar múltiplos children', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <ProtectedRoute>
        <div>Primeiro</div>
        <div>Segundo</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Primeiro')).toBeInTheDocument();
    expect(screen.getByText('Segundo')).toBeInTheDocument();
  });
});
