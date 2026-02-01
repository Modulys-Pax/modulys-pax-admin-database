import { render, screen } from '@testing-library/react';
import { PageHeader } from '../page-header';
import { Button } from '@/components/ui/button';

describe('PageHeader', () => {
  it('deve renderizar título', () => {
    render(<PageHeader title="Veículos" />);
    expect(screen.getByRole('heading', { name: 'Veículos' })).toBeInTheDocument();
  });

  it('deve renderizar título como h1', () => {
    render(<PageHeader title="Funcionários" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Funcionários');
  });

  it('deve renderizar subtitle quando fornecido', () => {
    render(
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral do sistema"
      />
    );
    expect(screen.getByText('Visão geral do sistema')).toBeInTheDocument();
  });

  it('não deve renderizar subtitle quando não fornecido', () => {
    render(<PageHeader title="Título" />);
    expect(screen.queryByText('Visão geral')).not.toBeInTheDocument();
  });

  it('deve renderizar ações quando fornecidas', () => {
    render(
      <PageHeader
        title="Produtos"
        actions={<Button>Novo Produto</Button>}
      />
    );
    expect(screen.getByRole('button', { name: 'Novo Produto' })).toBeInTheDocument();
  });

  it('deve renderizar múltiplas ações', () => {
    render(
      <PageHeader
        title="Estoque"
        actions={
          <>
            <Button variant="outline">Exportar</Button>
            <Button>Nova Entrada</Button>
          </>
        }
      />
    );
    expect(screen.getByRole('button', { name: 'Exportar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nova Entrada' })).toBeInTheDocument();
  });

  it('não deve renderizar container de ações quando não fornecidas', () => {
    const { container } = render(<PageHeader title="Título" />);
    // Apenas o container principal e o div do título
    expect(container.firstChild?.childNodes).toHaveLength(1);
  });

  it('deve aplicar className adicional', () => {
    const { container } = render(
      <PageHeader title="Título" className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('deve ter classes de layout flex', () => {
    const { container } = render(<PageHeader title="Título" />);
    expect(container.firstChild).toHaveClass('flex');
    expect(container.firstChild).toHaveClass('items-center');
    expect(container.firstChild).toHaveClass('justify-between');
  });
});
