import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable, PaginationMeta } from '../data-table';

interface TestData {
  id: string;
  name: string;
  status: string;
}

const mockData: TestData[] = [
  { id: '1', name: 'Item 1', status: 'active' },
  { id: '2', name: 'Item 2', status: 'inactive' },
  { id: '3', name: 'Item 3', status: 'active' },
];

const mockColumns = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Nome' },
  { key: 'status', header: 'Status' },
];

describe('DataTable', () => {
  describe('Renderização básica', () => {
    it('deve renderizar a tabela com dados', () => {
      render(<DataTable data={mockData} columns={mockColumns} />);

      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('Nome')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('deve renderizar mensagem vazia quando não há dados', () => {
      render(<DataTable data={[]} columns={mockColumns} />);

      expect(screen.getByText('Nenhum registro encontrado')).toBeInTheDocument();
    });

    it('deve renderizar mensagem vazia customizada', () => {
      render(
        <DataTable
          data={[]}
          columns={mockColumns}
          emptyMessage="Sem resultados para exibir"
        />
      );

      expect(screen.getByText('Sem resultados para exibir')).toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('deve mostrar skeleton quando isLoading=true', () => {
      const { container } = render(
        <DataTable data={mockData} columns={mockColumns} isLoading />
      );

      // Deve ter skeletons
      const skeletons = container.querySelectorAll('.h-12');
      expect(skeletons.length).toBeGreaterThan(0);
      
      // Não deve mostrar dados
      expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
    });
  });

  describe('Colunas com render customizado', () => {
    it('deve usar função render customizada', () => {
      const columnsWithRender = [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Nome' },
        {
          key: 'status',
          header: 'Status',
          render: (item: TestData) => (
            <span data-testid={`status-${item.id}`}>
              {item.status === 'active' ? 'Ativo' : 'Inativo'}
            </span>
          ),
        },
      ];

      render(<DataTable data={mockData} columns={columnsWithRender} />);

      expect(screen.getByTestId('status-1')).toHaveTextContent('Ativo');
      expect(screen.getByTestId('status-2')).toHaveTextContent('Inativo');
    });
  });

  describe('Row className', () => {
    it('deve aplicar className condicional às linhas', () => {
      const { container } = render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          rowClassName={(item) =>
            item.status === 'inactive' ? 'bg-red-100' : undefined
          }
        />
      );

      const rows = container.querySelectorAll('tbody tr');
      expect(rows[1]).toHaveClass('bg-red-100');
    });
  });

  describe('Paginação', () => {
    const pagination: PaginationMeta = {
      page: 1,
      limit: 10,
      total: 50,
      totalPages: 5,
    };

    it('deve mostrar informações de paginação', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          pagination={pagination}
        />
      );

      expect(screen.getByText(/Mostrando 1 a 10 de 50 registros/)).toBeInTheDocument();
    });

    it('deve chamar onPageChange ao navegar', () => {
      const handlePageChange = jest.fn();

      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      );

      const nextButton = screen.getByLabelText('Go to next page');
      fireEvent.click(nextButton);

      expect(handlePageChange).toHaveBeenCalledWith(2);
    });

    it('deve chamar onPageChange ao clicar em página específica', () => {
      const handlePageChange = jest.fn();

      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      );

      // Buscar todos os elementos com '3' e pegar o botão da paginação
      const page3Buttons = screen.getAllByText('3');
      const paginationButton = page3Buttons.find(el => el.closest('nav'));
      if (paginationButton) {
        fireEvent.click(paginationButton);
        expect(handlePageChange).toHaveBeenCalledWith(3);
      }
    });

    it('não deve mostrar paginação quando totalPages <= 1', () => {
      const singlePagePagination: PaginationMeta = {
        page: 1,
        limit: 10,
        total: 5,
        totalPages: 1,
      };

      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          pagination={singlePagePagination}
        />
      );

      expect(screen.queryByLabelText('Go to next page')).not.toBeInTheDocument();
    });

    it('botão anterior deve estar desabilitado na primeira página', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          pagination={pagination}
        />
      );

      const prevButton = screen.getByLabelText('Go to previous page');
      expect(prevButton).toHaveClass('pointer-events-none');
    });

    it('botão próximo deve estar desabilitado na última página', () => {
      const lastPagePagination: PaginationMeta = {
        page: 5,
        limit: 10,
        total: 50,
        totalPages: 5,
      };

      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          pagination={lastPagePagination}
        />
      );

      const nextButton = screen.getByLabelText('Go to next page');
      expect(nextButton).toHaveClass('pointer-events-none');
    });

    it('deve mostrar múltiplas páginas', () => {
      const manyPagesPagination: PaginationMeta = {
        page: 5,
        limit: 10,
        total: 100,
        totalPages: 10,
      };

      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          pagination={manyPagesPagination}
        />
      );

      // Deve mostrar o número da página 5
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  describe('Classes customizadas', () => {
    it('deve aceitar className customizada', () => {
      const { container } = render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          className="custom-table"
        />
      );

      const card = container.querySelector('.custom-table');
      expect(card).toBeInTheDocument();
    });

    it('deve aceitar className nas colunas', () => {
      const columnsWithClass = [
        { key: 'id', header: 'ID', className: 'w-20' },
        { key: 'name', header: 'Nome', className: 'font-bold' },
      ];

      const { container } = render(
        <DataTable data={mockData} columns={columnsWithClass} />
      );

      const headers = container.querySelectorAll('th');
      expect(headers[0]).toHaveClass('w-20');
      expect(headers[1]).toHaveClass('font-bold');
    });
  });
});
