import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar, MobileSidebar } from '../sidebar';

// Mock do next
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

// Mock do auth context
const mockLogout = jest.fn();
jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({
    user: {
      id: 'user-123',
      name: 'João Silva',
      email: 'joao@test.com',
      role: { name: 'Administrador' },
      branchId: 'branch-123',
    },
    logout: mockLogout,
  }),
}));

// Mock do branch context
const mockSetSelectedBranchId = jest.fn();
jest.mock('@/lib/contexts/branch-context', () => ({
  useBranch: () => ({
    selectedBranchId: null,
    setSelectedBranchId: mockSetSelectedBranchId,
    isAdmin: true,
  }),
}));

// Mock do permission context
jest.mock('@/lib/contexts/permission-context', () => ({
  usePermissions: () => ({
    hasPermission: () => true,
    isAdmin: true,
  }),
}));

// Mock do react-query
jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: {
      data: [
        { id: 'branch-1', name: 'Filial SP' },
        { id: 'branch-2', name: 'Filial RJ' },
      ],
    },
    isLoading: false,
  }),
}));

// Mock da branch API
jest.mock('@/lib/api/branch', () => ({
  branchApi: {
    getAll: jest.fn(),
  },
}));

describe('Sidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar o título', () => {
    render(<Sidebar />);

    expect(screen.getByText('ERP Transporte')).toBeInTheDocument();
  });

  it('deve renderizar informações do usuário', () => {
    render(<Sidebar />);

    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Administrador')).toBeInTheDocument();
  });

  it('deve mostrar seletor de filial para admin', () => {
    render(<Sidebar />);

    expect(screen.getByText('Filial')).toBeInTheDocument();
    expect(screen.getByText('Todas as filiais')).toBeInTheDocument();
    expect(screen.getByText('Filial SP')).toBeInTheDocument();
    expect(screen.getByText('Filial RJ')).toBeInTheDocument();
  });

  it('deve chamar setSelectedBranchId ao mudar filial', () => {
    render(<Sidebar />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'branch-1' } });

    expect(mockSetSelectedBranchId).toHaveBeenCalledWith('branch-1');
  });

  it('deve mostrar link para Dashboard', () => {
    render(<Sidebar />);

    expect(screen.getByText('Início')).toBeInTheDocument();
  });

  it('deve mostrar grupos de navegação', () => {
    render(<Sidebar />);

    expect(screen.getByText('Financeiro')).toBeInTheDocument();
    expect(screen.getByText('Pessoas')).toBeInTheDocument();
    expect(screen.getByText('Frota & Estoque')).toBeInTheDocument();
    expect(screen.getByText('Configuração')).toBeInTheDocument();
  });

  it('deve expandir/colapsar grupo ao clicar', () => {
    render(<Sidebar />);

    // Grupo Financeiro já está aberto por padrão
    expect(screen.getByText('Carteira')).toBeInTheDocument();

    // Clicar para fechar
    const grupoFinanceiro = screen.getByText('Financeiro');
    fireEvent.click(grupoFinanceiro);

    // Carteira não deve estar visível
    expect(screen.queryByText('Carteira')).not.toBeInTheDocument();

    // Clicar novamente para abrir
    fireEvent.click(grupoFinanceiro);
    expect(screen.getByText('Carteira')).toBeInTheDocument();
  });

  it('deve mostrar botão de logout', () => {
    render(<Sidebar />);

    const logoutButton = screen.getByText('Sair');
    expect(logoutButton).toBeInTheDocument();
  });

  it('deve renderizar estrutura completa', () => {
    const { container } = render(<Sidebar />);

    // Deve ter uma nav de navegação
    expect(container.querySelector('nav')).toBeInTheDocument();
    // Deve ter o título
    expect(screen.getByText('ERP Transporte')).toBeInTheDocument();
  });
});

describe('MobileSidebar', () => {
  it('deve renderizar overlay quando aberto', () => {
    const { container } = render(
      <MobileSidebar isOpen={true} onClose={() => {}} />
    );

    expect(container.querySelector('.bg-black\\/50')).toBeInTheDocument();
  });

  it('não deve renderizar overlay quando fechado', () => {
    const { container } = render(
      <MobileSidebar isOpen={false} onClose={() => {}} />
    );

    expect(container.querySelector('.bg-black\\/50')).not.toBeInTheDocument();
  });

  it('deve chamar onClose ao clicar no overlay', () => {
    const handleClose = jest.fn();
    const { container } = render(
      <MobileSidebar isOpen={true} onClose={handleClose} />
    );

    const overlay = container.querySelector('.bg-black\\/50');
    if (overlay) {
      fireEvent.click(overlay);
      expect(handleClose).toHaveBeenCalled();
    }
  });

  it('deve ter classe de transição correta quando aberto', () => {
    const { container } = render(
      <MobileSidebar isOpen={true} onClose={() => {}} />
    );

    const aside = container.querySelector('aside');
    expect(aside).toHaveClass('translate-x-0');
  });

  it('deve ter classe de transição correta quando fechado', () => {
    const { container } = render(
      <MobileSidebar isOpen={false} onClose={() => {}} />
    );

    const aside = container.querySelector('aside');
    expect(aside).toHaveClass('-translate-x-full');
  });
});
