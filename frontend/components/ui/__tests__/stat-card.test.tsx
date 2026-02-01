import { render, screen } from '@testing-library/react';
import { TrendingUp, Package } from 'lucide-react';
import { StatCard } from '../stat-card';

describe('StatCard', () => {
  it('deve renderizar título e valor', () => {
    render(<StatCard title="Total de Veículos" value={42} />);
    
    expect(screen.getByText('Total de Veículos')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('deve renderizar valor string', () => {
    render(<StatCard title="Receita" value="R$ 1.234,56" />);
    expect(screen.getByText('R$ 1.234,56')).toBeInTheDocument();
  });

  it('deve renderizar ícone quando fornecido', () => {
    render(<StatCard title="Produtos" value={100} icon={Package} />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('deve renderizar indicador', () => {
    render(
      <StatCard
        title="Vendas"
        value="R$ 5.000"
        indicator={{ value: '+10%' }}
      />
    );
    expect(screen.getByText('+10%')).toBeInTheDocument();
  });

  it('deve aplicar cor verde para trend up', () => {
    render(
      <StatCard
        title="Vendas"
        value="100"
        indicator={{ value: '+10%', trend: 'up' }}
      />
    );
    expect(screen.getByText('+10%')).toHaveClass('text-green-600');
  });

  it('deve aplicar cor vermelha para trend down', () => {
    render(
      <StatCard
        title="Vendas"
        value="100"
        indicator={{ value: '-5%', trend: 'down' }}
      />
    );
    expect(screen.getByText('-5%')).toHaveClass('text-red-600');
  });

  it('deve aplicar cor neutra para trend neutral', () => {
    render(
      <StatCard
        title="Vendas"
        value="100"
        indicator={{ value: '0%', trend: 'neutral' }}
      />
    );
    expect(screen.getByText('0%')).toHaveClass('text-muted-foreground');
  });

  it('deve renderizar como link quando href fornecido', () => {
    render(<StatCard title="Veículos" value={10} href="/vehicles" />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/vehicles');
  });

  it('não deve renderizar como link quando href não fornecido', () => {
    render(<StatCard title="Veículos" value={10} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('deve aplicar className adicional', () => {
    const { container } = render(
      <StatCard title="Test" value={1} className="custom-class" />
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('não deve renderizar indicador quando não fornecido', () => {
    render(<StatCard title="Test" value={1} />);
    // Apenas título e valor devem estar presentes
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    // Não deve haver elementos extras além do card structure
  });
});
