import React from 'react';
import { render, screen } from '@testing-library/react';
import { Breadcrumb } from '../breadcrumb';

describe('Breadcrumb', () => {
  it('deve renderizar itens de breadcrumb', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/products' },
      { label: 'Details' },
    ];

    render(<Breadcrumb items={items} />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
  });

  it('deve renderizar links para itens com href', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Details' },
    ];

    render(<Breadcrumb items={items} />);

    const homeLink = screen.getByText('Home');
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
  });

  it('último item não deve ser link', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Details' },
    ];

    render(<Breadcrumb items={items} />);

    const details = screen.getByText('Details');
    expect(details.closest('a')).toBeNull();
    expect(details).toHaveClass('font-medium');
  });

  it('deve aplicar className customizado', () => {
    const items = [{ label: 'Home' }];

    render(<Breadcrumb items={items} className="custom-class" />);

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('custom-class');
  });

  it('deve ter aria-label', () => {
    const items = [{ label: 'Home' }];

    render(<Breadcrumb items={items} />);

    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Breadcrumb');
  });

  it('deve renderizar separadores entre itens', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/products' },
      { label: 'Details' },
    ];

    const { container } = render(<Breadcrumb items={items} />);

    // ChevronRight é renderizado como SVG
    const separators = container.querySelectorAll('svg');
    expect(separators.length).toBe(2); // 2 separadores para 3 itens
  });

  it('não deve renderizar separador antes do primeiro item', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Details' },
    ];

    const { container } = render(<Breadcrumb items={items} />);

    const listItems = container.querySelectorAll('li');
    const firstItem = listItems[0];
    
    // O primeiro item não deve ter SVG antes dele
    const firstSvg = firstItem.querySelector('svg');
    if (firstSvg) {
      // Se houver SVG, não deve ser o primeiro elemento
      expect(firstItem.firstChild).not.toBe(firstSvg);
    }
  });

  it('deve renderizar item sem href como span', () => {
    const items = [
      { label: 'No Link' },
      { label: 'Last' },
    ];

    render(<Breadcrumb items={items} />);

    const noLink = screen.getByText('No Link');
    expect(noLink.tagName.toLowerCase()).toBe('span');
    expect(noLink.closest('a')).toBeNull();
  });

  it('deve renderizar lista vazia corretamente', () => {
    render(<Breadcrumb items={[]} />);

    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });
});
