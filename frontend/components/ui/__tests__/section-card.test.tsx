import { render, screen } from '@testing-library/react';
import { SectionCard } from '../section-card';
import { Button } from '../button';

describe('SectionCard', () => {
  it('deve renderizar children', () => {
    render(
      <SectionCard>
        <p>Conteúdo do card</p>
      </SectionCard>
    );
    expect(screen.getByText('Conteúdo do card')).toBeInTheDocument();
  });

  it('deve renderizar título quando fornecido', () => {
    render(
      <SectionCard title="Informações Gerais">
        <p>Conteúdo</p>
      </SectionCard>
    );
    expect(screen.getByText('Informações Gerais')).toBeInTheDocument();
  });

  it('deve renderizar descrição quando fornecida', () => {
    render(
      <SectionCard title="Título" description="Descrição do card">
        <p>Conteúdo</p>
      </SectionCard>
    );
    expect(screen.getByText('Descrição do card')).toBeInTheDocument();
  });

  it('deve renderizar ações quando fornecidas', () => {
    render(
      <SectionCard
        title="Título"
        actions={<Button>Ação</Button>}
      >
        <p>Conteúdo</p>
      </SectionCard>
    );
    expect(screen.getByRole('button', { name: 'Ação' })).toBeInTheDocument();
  });

  it('não deve renderizar header quando não tem título, descrição ou ações', () => {
    const { container } = render(
      <SectionCard>
        <p>Conteúdo</p>
      </SectionCard>
    );
    
    // CardHeader não deve existir
    expect(container.querySelector('[class*="CardHeader"]')).not.toBeInTheDocument();
  });

  it('deve renderizar header quando tem apenas ações', () => {
    render(
      <SectionCard actions={<Button>Ação</Button>}>
        <p>Conteúdo</p>
      </SectionCard>
    );
    expect(screen.getByRole('button', { name: 'Ação' })).toBeInTheDocument();
  });

  it('deve aplicar className ao card', () => {
    const { container } = render(
      <SectionCard className="custom-card-class">
        <p>Conteúdo</p>
      </SectionCard>
    );
    expect(container.querySelector('.custom-card-class')).toBeInTheDocument();
  });

  it('deve aplicar headerClassName ao header', () => {
    const { container } = render(
      <SectionCard title="Título" headerClassName="custom-header">
        <p>Conteúdo</p>
      </SectionCard>
    );
    expect(container.querySelector('.custom-header')).toBeInTheDocument();
  });

  it('deve aplicar contentClassName ao content', () => {
    const { container } = render(
      <SectionCard contentClassName="custom-content">
        <p>Conteúdo</p>
      </SectionCard>
    );
    expect(container.querySelector('.custom-content')).toBeInTheDocument();
  });

  it('deve renderizar múltiplas ações', () => {
    render(
      <SectionCard
        title="Título"
        actions={
          <>
            <Button>Ação 1</Button>
            <Button>Ação 2</Button>
          </>
        }
      >
        <p>Conteúdo</p>
      </SectionCard>
    );
    expect(screen.getByRole('button', { name: 'Ação 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ação 2' })).toBeInTheDocument();
  });
});
