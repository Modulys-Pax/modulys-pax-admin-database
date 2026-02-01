import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../card';

describe('Card components', () => {
  describe('Card', () => {
    it('deve renderizar children', () => {
      render(<Card>Conteúdo do card</Card>);
      expect(screen.getByText('Conteúdo do card')).toBeInTheDocument();
    });

    it('deve aplicar className adicional', () => {
      const { container } = render(<Card className="custom-class">Test</Card>);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('deve ter classes base', () => {
      const { container } = render(<Card>Test</Card>);
      expect(container.firstChild).toHaveClass('rounded-xl');
      expect(container.firstChild).toHaveClass('border');
      expect(container.firstChild).toHaveClass('shadow-sm');
    });
  });

  describe('CardHeader', () => {
    it('deve renderizar children', () => {
      render(<CardHeader>Header content</CardHeader>);
      expect(screen.getByText('Header content')).toBeInTheDocument();
    });

    it('deve aplicar className adicional', () => {
      const { container } = render(<CardHeader className="custom">Test</CardHeader>);
      expect(container.firstChild).toHaveClass('custom');
    });

    it('deve ter padding', () => {
      const { container } = render(<CardHeader>Test</CardHeader>);
      expect(container.firstChild).toHaveClass('p-6');
    });
  });

  describe('CardTitle', () => {
    it('deve renderizar como h3', () => {
      render(<CardTitle>Título</CardTitle>);
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Título');
    });

    it('deve aplicar className adicional', () => {
      render(<CardTitle className="custom">Título</CardTitle>);
      expect(screen.getByText('Título')).toHaveClass('custom');
    });

    it('deve ter estilo de título', () => {
      render(<CardTitle>Título</CardTitle>);
      expect(screen.getByText('Título')).toHaveClass('text-2xl');
      expect(screen.getByText('Título')).toHaveClass('font-semibold');
    });
  });

  describe('CardDescription', () => {
    it('deve renderizar descrição', () => {
      render(<CardDescription>Descrição do card</CardDescription>);
      expect(screen.getByText('Descrição do card')).toBeInTheDocument();
    });

    it('deve ter estilo de descrição', () => {
      render(<CardDescription>Descrição</CardDescription>);
      expect(screen.getByText('Descrição')).toHaveClass('text-sm');
      expect(screen.getByText('Descrição')).toHaveClass('text-muted-foreground');
    });
  });

  describe('CardContent', () => {
    it('deve renderizar children', () => {
      render(<CardContent>Conteúdo</CardContent>);
      expect(screen.getByText('Conteúdo')).toBeInTheDocument();
    });

    it('deve ter padding correto', () => {
      const { container } = render(<CardContent>Test</CardContent>);
      expect(container.firstChild).toHaveClass('p-6');
      expect(container.firstChild).toHaveClass('pt-0');
    });
  });

  describe('CardFooter', () => {
    it('deve renderizar children', () => {
      render(<CardFooter>Footer content</CardFooter>);
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });

    it('deve ser flex container', () => {
      const { container } = render(<CardFooter>Test</CardFooter>);
      expect(container.firstChild).toHaveClass('flex');
      expect(container.firstChild).toHaveClass('items-center');
    });
  });

  describe('Card completo', () => {
    it('deve renderizar estrutura completa', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Título do Card</CardTitle>
            <CardDescription>Descrição do card</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Conteúdo principal</p>
          </CardContent>
          <CardFooter>
            <button>Ação</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByText('Título do Card')).toBeInTheDocument();
      expect(screen.getByText('Descrição do card')).toBeInTheDocument();
      expect(screen.getByText('Conteúdo principal')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Ação' })).toBeInTheDocument();
    });
  });
});
