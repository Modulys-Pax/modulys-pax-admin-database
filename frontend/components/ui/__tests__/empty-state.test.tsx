import { render, screen, fireEvent } from '@testing-library/react';
import { Package } from 'lucide-react';
import {
  EmptyState,
  EmptyVehicles,
  EmptyMaintenance,
  EmptyProducts,
  EmptyStock,
  EmptyMovements,
  EmptyLabels,
} from '../empty-state';

// Mock Next.js Link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

describe('EmptyState', () => {
  it('deve renderizar título', () => {
    render(<EmptyState title="Nenhum item encontrado" />);
    expect(screen.getByText('Nenhum item encontrado')).toBeInTheDocument();
  });

  it('deve renderizar descrição quando fornecida', () => {
    render(
      <EmptyState
        title="Título"
        description="Descrição do estado vazio"
      />
    );
    expect(screen.getByText('Descrição do estado vazio')).toBeInTheDocument();
  });

  it('não deve renderizar descrição quando não fornecida', () => {
    render(<EmptyState title="Título" />);
    expect(screen.queryByText('Descrição')).not.toBeInTheDocument();
  });

  it('deve renderizar ícone personalizado', () => {
    render(<EmptyState title="Título" icon={Package} />);
    // Ícone é renderizado no DOM
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('deve renderizar botão de ação com href', () => {
    render(
      <EmptyState
        title="Título"
        action={{ label: 'Criar novo', href: '/new' }}
      />
    );
    expect(screen.getByRole('button', { name: 'Criar novo' })).toBeInTheDocument();
  });

  it('deve renderizar botão de ação com onClick', () => {
    const handleClick = jest.fn();
    render(
      <EmptyState
        title="Título"
        action={{ label: 'Clique aqui', onClick: handleClick }}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: 'Clique aqui' }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar children', () => {
    render(
      <EmptyState title="Título">
        <p>Conteúdo adicional</p>
      </EmptyState>
    );
    expect(screen.getByText('Conteúdo adicional')).toBeInTheDocument();
  });

  it('deve aplicar className adicional', () => {
    const { container } = render(
      <EmptyState title="Título" className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('Variantes de EmptyState', () => {
  describe('EmptyVehicles', () => {
    it('deve renderizar com título correto', () => {
      render(<EmptyVehicles />);
      expect(screen.getByText('Nenhum veículo encontrado')).toBeInTheDocument();
    });

    it('deve ter ação padrão', () => {
      render(<EmptyVehicles />);
      expect(screen.getByRole('button', { name: 'Cadastrar Veículo' })).toBeInTheDocument();
    });
  });

  describe('EmptyMaintenance', () => {
    it('deve renderizar com título correto', () => {
      render(<EmptyMaintenance />);
      expect(screen.getByText('Nenhuma ordem de manutenção')).toBeInTheDocument();
    });
  });

  describe('EmptyProducts', () => {
    it('deve renderizar com título correto', () => {
      render(<EmptyProducts />);
      expect(screen.getByText('Nenhum produto cadastrado')).toBeInTheDocument();
    });
  });

  describe('EmptyStock', () => {
    it('deve renderizar com título correto', () => {
      render(<EmptyStock />);
      expect(screen.getByText('Nenhum estoque encontrado')).toBeInTheDocument();
    });
  });

  describe('EmptyMovements', () => {
    it('deve renderizar com título correto', () => {
      render(<EmptyMovements />);
      expect(screen.getByText('Nenhuma movimentação encontrada')).toBeInTheDocument();
    });
  });

  describe('EmptyLabels', () => {
    it('deve renderizar com título correto', () => {
      render(<EmptyLabels />);
      expect(screen.getByText('Nenhuma etiqueta encontrada')).toBeInTheDocument();
    });
  });

  it('deve aceitar ação personalizada nas variantes', () => {
    const handleClick = jest.fn();
    render(
      <EmptyVehicles action={{ label: 'Ação Custom', onClick: handleClick }} />
    );
    
    fireEvent.click(screen.getByRole('button', { name: 'Ação Custom' }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
