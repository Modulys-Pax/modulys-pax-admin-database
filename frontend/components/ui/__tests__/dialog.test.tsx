import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '../dialog';

describe('Dialog', () => {
  it('deve renderizar trigger', () => {
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Open Dialog')).toBeInTheDocument();
  });

  it('deve abrir dialog ao clicar no trigger', () => {
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>Dialog description</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    fireEvent.click(screen.getByText('Open Dialog'));

    expect(screen.getByText('Dialog Title')).toBeInTheDocument();
    expect(screen.getByText('Dialog description')).toBeInTheDocument();
  });

  it('deve renderizar DialogHeader com className', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader className="header-class">
            <DialogTitle>Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    const header = screen.getByText('Title').parentElement;
    expect(header).toHaveClass('header-class');
  });

  it('deve renderizar DialogFooter com className', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogFooter className="footer-class">
            <button>Save</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    const footer = screen.getByText('Save').parentElement;
    expect(footer).toHaveClass('footer-class');
  });

  it('deve renderizar DialogTitle com className', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle className="title-class">Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Title')).toHaveClass('title-class');
  });

  it('deve renderizar DialogDescription com className', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription className="desc-class">Description</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Description')).toHaveClass('desc-class');
  });

  it('deve fechar ao clicar no botão de fechar', () => {
    const onOpenChange = jest.fn();

    render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
