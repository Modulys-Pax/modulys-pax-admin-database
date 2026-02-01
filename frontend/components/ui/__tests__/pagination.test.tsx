import { render, screen, fireEvent } from '@testing-library/react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '../pagination';

describe('Pagination', () => {
  describe('Pagination container', () => {
    it('deve renderizar com role navigation', () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink>1</PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('deve ter aria-label pagination', () => {
      render(<Pagination><span>Test</span></Pagination>);
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'pagination');
    });

    it('deve aplicar className adicional', () => {
      render(<Pagination className="custom-class"><span>Test</span></Pagination>);
      expect(screen.getByRole('navigation')).toHaveClass('custom-class');
    });
  });

  describe('PaginationContent', () => {
    it('deve renderizar como lista', () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>Item</PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      
      expect(screen.getByRole('list')).toBeInTheDocument();
    });
  });

  describe('PaginationItem', () => {
    it('deve renderizar como list item', () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>Item</PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      
      expect(screen.getByRole('listitem')).toBeInTheDocument();
    });
  });

  describe('PaginationLink', () => {
    it('deve renderizar como botão quando onClick é fornecido', () => {
      const handleClick = jest.fn();
      render(
        <PaginationLink onClick={handleClick}>1</PaginationLink>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalled();
    });

    it('deve ter aria-current quando ativo', () => {
      render(<PaginationLink isActive>1</PaginationLink>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-current', 'page');
    });

    it('não deve ter aria-current quando inativo', () => {
      render(<PaginationLink>1</PaginationLink>);
      expect(screen.getByRole('button')).not.toHaveAttribute('aria-current');
    });

    it('deve aplicar estilo outline quando ativo', () => {
      render(<PaginationLink isActive>1</PaginationLink>);
      const link = screen.getByRole('button');
      expect(link).toHaveClass('border-primary');
    });
  });

  describe('PaginationPrevious', () => {
    it('deve renderizar com aria-label correto', () => {
      render(<PaginationPrevious />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Go to previous page');
    });

    it('deve chamar onClick quando clicado', () => {
      const handleClick = jest.fn();
      render(<PaginationPrevious onClick={handleClick} />);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalled();
    });

    it('deve estar desabilitado quando disabled', () => {
      render(<PaginationPrevious disabled />);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('PaginationNext', () => {
    it('deve renderizar com aria-label correto', () => {
      render(<PaginationNext />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Go to next page');
    });

    it('deve chamar onClick quando clicado', () => {
      const handleClick = jest.fn();
      render(<PaginationNext onClick={handleClick} />);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('PaginationEllipsis', () => {
    it('deve renderizar com aria-hidden', () => {
      const { container } = render(<PaginationEllipsis />);
      const span = container.querySelector('span');
      expect(span).toHaveAttribute('aria-hidden', 'true');
    });

    it('deve ter texto screen reader only', () => {
      render(<PaginationEllipsis />);
      expect(screen.getByText('More pages')).toHaveClass('sr-only');
    });
  });

  describe('Pagination completa', () => {
    it('deve renderizar paginação funcional', () => {
      const onPageChange = jest.fn();
      
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => onPageChange(1)} disabled />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink isActive onClick={() => onPageChange(1)}>1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink onClick={() => onPageChange(2)}>2</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink onClick={() => onPageChange(3)}>3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext onClick={() => onPageChange(2)} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );

      // Verifica estrutura
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(6);
      
      // Clica na página 2
      fireEvent.click(screen.getByText('2'));
      expect(onPageChange).toHaveBeenCalledWith(2);
    });
  });
});
