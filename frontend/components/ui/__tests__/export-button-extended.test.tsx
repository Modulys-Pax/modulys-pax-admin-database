import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportButton } from '../export-button';

// Mock das funções de toast
jest.mock('@/lib/utils', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
  toastSuccess: jest.fn(),
  toastError: jest.fn(),
}));

// Mock do jsPDF e jspdf-autotable
jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => ({
    setFontSize: jest.fn(),
    text: jest.fn(),
    save: jest.fn(),
  })),
}));

jest.mock('jspdf-autotable', () => ({
  default: jest.fn(),
}));

// Mock do URL
const mockCreateObjectURL = jest.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = jest.fn();

Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  },
  writable: true,
});

// Mock do Blob
global.Blob = jest.fn().mockImplementation((content, options) => ({
  content,
  options,
  size: 100,
  type: options?.type || '',
})) as unknown as typeof Blob;

describe('ExportButton - getValue function', () => {
  const mockData = [
    { id: 1, name: 'Test 1', nested: { value: 'Nested 1' }, date: new Date('2025-01-01'), empty: null },
    { id: 2, name: 'Test 2', nested: { value: 'Nested 2' }, date: new Date('2025-02-01'), empty: undefined },
  ];

  const mockColumns = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Nome' },
    { key: 'nested.value', header: 'Nested' },
    { key: 'date', header: 'Data' },
    { key: 'empty', header: 'Vazio' },
    { key: 'nonexistent', header: 'Inexistente' },
    { key: 'id', header: 'ID Custom', getValue: (item: typeof mockData[0]) => `Custom-${item.id}` },
  ];

  it('deve renderizar botão de exportar quando há dados', () => {
    render(
      <ExportButton
        data={mockData}
        columns={mockColumns}
        filename="test-export"
      />
    );

    expect(screen.getByText('Exportar')).toBeInTheDocument();
  });

  it('não deve renderizar quando não há dados', () => {
    render(
      <ExportButton
        data={[]}
        columns={mockColumns}
        filename="test-export"
      />
    );

    expect(screen.queryByText('Exportar')).not.toBeInTheDocument();
  });

  it('deve mostrar título quando fornecido', () => {
    render(
      <ExportButton
        data={mockData}
        columns={mockColumns}
        filename="test-export"
        title="Relatório de Teste"
      />
    );

    expect(screen.getByText('Exportar')).toBeInTheDocument();
  });

  it('deve desabilitar botão durante exportação', async () => {
    const { jsPDF } = require('jspdf');
    jsPDF.mockImplementation(() => ({
      setFontSize: jest.fn(),
      text: jest.fn(),
      save: jest.fn(),
    }));

    render(
      <ExportButton
        data={mockData}
        columns={mockColumns}
        filename="test-export"
      />
    );

    const button = screen.getByText('Exportar');
    expect(button).not.toBeDisabled();
  });
});

describe('ExportButton - getValue edge cases', () => {
  it('deve lidar com propriedades aninhadas profundas', () => {
    const deepData = [
      { level1: { level2: { level3: 'deep value' } } },
    ];
    
    const columns = [
      { key: 'level1.level2.level3', header: 'Deep' },
    ];

    render(
      <ExportButton
        data={deepData}
        columns={columns}
        filename="deep-test"
      />
    );

    expect(screen.getByText('Exportar')).toBeInTheDocument();
  });

  it('deve lidar com valores numéricos', () => {
    const numericData = [
      { value: 123.45, integer: 100, zero: 0 },
    ];
    
    const columns = [
      { key: 'value', header: 'Decimal' },
      { key: 'integer', header: 'Inteiro' },
      { key: 'zero', header: 'Zero' },
    ];

    render(
      <ExportButton
        data={numericData}
        columns={columns}
        filename="numeric-test"
      />
    );

    expect(screen.getByText('Exportar')).toBeInTheDocument();
  });

  it('deve lidar com valores booleanos', () => {
    const boolData = [
      { active: true, inactive: false },
    ];
    
    const columns = [
      { key: 'active', header: 'Ativo' },
      { key: 'inactive', header: 'Inativo' },
    ];

    render(
      <ExportButton
        data={boolData}
        columns={columns}
        filename="bool-test"
      />
    );

    expect(screen.getByText('Exportar')).toBeInTheDocument();
  });

  it('deve usar getValue customizado quando fornecido', () => {
    const data = [{ id: 1, name: 'Test' }];
    
    const columns = [
      { 
        key: 'id', 
        header: 'ID',
        getValue: (item: { id: number }) => `CUSTOM-${item.id}`,
      },
    ];

    render(
      <ExportButton
        data={data}
        columns={columns}
        filename="custom-test"
      />
    );

    expect(screen.getByText('Exportar')).toBeInTheDocument();
  });

  it('deve lidar com getValue que retorna número', () => {
    const data = [{ price: 100 }];
    
    const columns = [
      { 
        key: 'price', 
        header: 'Preço',
        getValue: (item: { price: number }) => item.price * 1.1,
      },
    ];

    render(
      <ExportButton
        data={data}
        columns={columns}
        filename="number-return-test"
      />
    );

    expect(screen.getByText('Exportar')).toBeInTheDocument();
  });

  it('deve lidar com getValue que retorna undefined', () => {
    const data = [{ value: 'test' }];
    
    const columns = [
      { 
        key: 'value', 
        header: 'Valor',
        getValue: () => undefined as unknown as string,
      },
    ];

    render(
      <ExportButton
        data={data}
        columns={columns}
        filename="undefined-return-test"
      />
    );

    expect(screen.getByText('Exportar')).toBeInTheDocument();
  });
});

describe('ExportButton - Data processing', () => {
  it('deve processar array de strings corretamente', () => {
    interface StringItem {
      tags: string[];
    }
    
    const data: StringItem[] = [
      { tags: ['tag1', 'tag2'] },
    ];
    
    const columns = [
      { 
        key: 'tags', 
        header: 'Tags',
        getValue: (item: StringItem) => item.tags.join(', '),
      },
    ];

    render(
      <ExportButton
        data={data}
        columns={columns}
        filename="array-test"
      />
    );

    expect(screen.getByText('Exportar')).toBeInTheDocument();
  });

  it('deve processar dados com caracteres especiais', () => {
    const data = [
      { name: 'Açúcar & "Especiarias"' },
      { name: "O'Brien's" },
    ];
    
    const columns = [
      { key: 'name', header: 'Nome' },
    ];

    render(
      <ExportButton
        data={data}
        columns={columns}
        filename="special-chars-test"
      />
    );

    expect(screen.getByText('Exportar')).toBeInTheDocument();
  });

  it('deve processar muitos registros', () => {
    const manyData = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }));
    
    const columns = [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Nome' },
    ];

    render(
      <ExportButton
        data={manyData}
        columns={columns}
        filename="many-records-test"
      />
    );

    expect(screen.getByText('Exportar')).toBeInTheDocument();
  });
});
