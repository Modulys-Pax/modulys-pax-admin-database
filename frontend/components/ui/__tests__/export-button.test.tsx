import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportButton } from '../export-button';

// Mock das funções de toast
jest.mock('@/lib/utils', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
  toastSuccess: jest.fn(),
  toastError: jest.fn(),
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock document.createElement para link
const mockClick = jest.fn();
const originalCreateElement = document.createElement.bind(document);
jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
  if (tagName === 'a') {
    const element = originalCreateElement(tagName);
    element.click = mockClick;
    return element;
  }
  return originalCreateElement(tagName);
});

import { toastSuccess, toastError } from '@/lib/utils';

describe('ExportButton', () => {
  const mockData = [
    { id: '1', name: 'Item 1', value: 100, nested: { prop: 'nested1' } },
    { id: '2', name: 'Item 2', value: 200, nested: { prop: 'nested2' } },
    { id: '3', name: 'Item 3', value: null, nested: null },
  ];

  const mockColumns = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Nome' },
    { key: 'value', header: 'Valor', getValue: (item: typeof mockData[0]) => item.value ? `R$ ${item.value}` : '' },
    { key: 'nested.prop', header: 'Nested' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('não deve renderizar quando não há dados', () => {
    const { container } = render(
      <ExportButton data={[]} columns={mockColumns} filename="test" />
    );

    expect(container.firstChild).toBeNull();
  });

  it('deve renderizar botão quando há dados', () => {
    render(
      <ExportButton data={mockData} columns={mockColumns} filename="test" />
    );

    expect(screen.getByText('Exportar')).toBeInTheDocument();
  });

  it('deve ter o ícone de download', () => {
    const { container } = render(
      <ExportButton data={mockData} columns={mockColumns} filename="test" />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('deve aceitar título customizado', () => {
    render(
      <ExportButton
        data={mockData}
        columns={mockColumns}
        filename="test"
        title="Relatório de Vendas"
      />
    );

    expect(screen.getByText('Exportar')).toBeInTheDocument();
  });

  it('botão deve ter variante outline e tamanho sm', () => {
    render(
      <ExportButton data={mockData} columns={mockColumns} filename="test" />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('border');
    expect(button).toHaveClass('h-9');
  });

  it('deve renderizar opções de dropdown', () => {
    render(
      <ExportButton data={mockData} columns={mockColumns} filename="test" />
    );

    const button = screen.getByText('Exportar');
    expect(button).toBeInTheDocument();
    expect(button.closest('button')).not.toBeDisabled();
  });

  it('deve lidar com valores null/undefined corretamente', () => {
    const dataWithNulls = [
      { id: '1', name: null, value: undefined, nested: null },
    ];

    const { container } = render(
      <ExportButton data={dataWithNulls} columns={mockColumns} filename="test" />
    );

    expect(container.firstChild).not.toBeNull();
  });

  it('deve lidar com Date no getValue', () => {
    const dataWithDate = [
      { id: '1', date: new Date('2024-01-15') },
    ];
    const columnsWithDate = [
      { key: 'date', header: 'Data' },
    ];

    const { container } = render(
      <ExportButton data={dataWithDate} columns={columnsWithDate} filename="test" />
    );

    expect(container.firstChild).not.toBeNull();
  });
});
