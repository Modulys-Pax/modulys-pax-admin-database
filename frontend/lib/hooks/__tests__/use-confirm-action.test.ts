/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useConfirmAction, useConfirmDelete, CONFIRM_MESSAGES } from '../use-confirm-action';

describe('use-confirm-action', () => {
  // Mock do window.confirm
  const originalConfirm = window.confirm;
  
  beforeEach(() => {
    window.confirm = jest.fn();
  });
  
  afterEach(() => {
    window.confirm = originalConfirm;
  });

  describe('useConfirmAction', () => {
    it('deve chamar onConfirm quando usuário confirma', () => {
      (window.confirm as jest.Mock).mockReturnValue(true);
      const onConfirm = jest.fn();
      
      const { result } = renderHook(() => useConfirmAction());
      
      act(() => {
        result.current('Confirmar ação?', onConfirm);
      });
      
      expect(window.confirm).toHaveBeenCalledWith('Confirmar ação?');
      expect(onConfirm).toHaveBeenCalled();
    });

    it('não deve chamar onConfirm quando usuário cancela', () => {
      (window.confirm as jest.Mock).mockReturnValue(false);
      const onConfirm = jest.fn();
      
      const { result } = renderHook(() => useConfirmAction());
      
      act(() => {
        result.current('Confirmar ação?', onConfirm);
      });
      
      expect(window.confirm).toHaveBeenCalledWith('Confirmar ação?');
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('useConfirmDelete', () => {
    it('deve chamar onConfirm quando usuário confirma exclusão', () => {
      (window.confirm as jest.Mock).mockReturnValue(true);
      const onConfirm = jest.fn();
      
      const { result } = renderHook(() => useConfirmDelete());
      
      act(() => {
        result.current('este funcionário', onConfirm);
      });
      
      expect(window.confirm).toHaveBeenCalledWith('Tem certeza que deseja excluir este funcionário?');
      expect(onConfirm).toHaveBeenCalled();
    });

    it('não deve chamar onConfirm quando usuário cancela exclusão', () => {
      (window.confirm as jest.Mock).mockReturnValue(false);
      const onConfirm = jest.fn();
      
      const { result } = renderHook(() => useConfirmDelete());
      
      act(() => {
        result.current('este produto', onConfirm);
      });
      
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('CONFIRM_MESSAGES', () => {
    it('deve ter mensagem DELETE correta', () => {
      expect(CONFIRM_MESSAGES.DELETE('este item')).toBe(
        'Tem certeza que deseja excluir este item?'
      );
    });

    it('deve ter mensagem DELETE_ITEM correta', () => {
      expect(CONFIRM_MESSAGES.DELETE_ITEM).toBe(
        'Tem certeza que deseja excluir este item?'
      );
    });

    it('deve ter mensagem CANCEL correta', () => {
      expect(CONFIRM_MESSAGES.CANCEL).toBe(
        'Tem certeza que deseja cancelar? As alterações não salvas serão perdidas.'
      );
    });

    it('deve ter mensagem CANCEL_OPERATION correta', () => {
      expect(CONFIRM_MESSAGES.CANCEL_OPERATION('esta manutenção')).toBe(
        'Tem certeza que deseja cancelar esta manutenção?'
      );
    });
  });
});
