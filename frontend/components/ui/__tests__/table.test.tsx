import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from '../table';

describe('Table', () => {
  it('deve renderizar tabela completa', () => {
    render(
      <Table>
        <TableCaption>Lista de usuários</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>John Doe</TableCell>
            <TableCell>john@example.com</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>Total: 1</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );

    expect(screen.getByText('Lista de usuários')).toBeInTheDocument();
    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Total: 1')).toBeInTheDocument();
  });

  it('Table deve aplicar className', () => {
    render(
      <Table className="custom-table">
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByRole('table')).toHaveClass('custom-table');
  });

  it('TableHeader deve aplicar className', () => {
    render(
      <Table>
        <TableHeader className="custom-header">
          <TableRow>
            <TableHead>Head</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );

    expect(screen.getByRole('rowgroup')).toHaveClass('custom-header');
  });

  it('TableBody deve aplicar className', () => {
    render(
      <Table>
        <TableBody className="custom-body">
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByRole('rowgroup')).toHaveClass('custom-body');
  });

  it('TableFooter deve aplicar className', () => {
    render(
      <Table>
        <TableFooter className="custom-footer">
          <TableRow>
            <TableCell>Footer</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );

    const footer = screen.getByText('Footer').closest('tfoot');
    expect(footer).toHaveClass('custom-footer');
  });

  it('TableRow deve aplicar className', () => {
    render(
      <Table>
        <TableBody>
          <TableRow className="custom-row">
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByRole('row')).toHaveClass('custom-row');
  });

  it('TableHead deve aplicar className', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="custom-head">Head</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );

    expect(screen.getByRole('columnheader')).toHaveClass('custom-head');
  });

  it('TableCell deve aplicar className', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="custom-cell">Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByRole('cell')).toHaveClass('custom-cell');
  });

  it('TableCaption deve aplicar className', () => {
    render(
      <Table>
        <TableCaption className="custom-caption">Caption</TableCaption>
      </Table>
    );

    expect(screen.getByText('Caption')).toHaveClass('custom-caption');
  });
});
