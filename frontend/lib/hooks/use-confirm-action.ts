'use client';

import { useCallback } from 'react';

/**
 * Hook para confirmar ações destrutivas (delete, cancel, etc.)
 * Usa o confirm() nativo do browser
 */
export function useConfirmAction() {
  const confirmAction = useCallback(
    (message: string, onConfirm: () => void) => {
      if (confirm(message)) {
        onConfirm();
      }
    },
    []
  );

  return confirmAction;
}

/**
 * Hook específico para confirmação de exclusão
 */
export function useConfirmDelete() {
  const confirmDelete = useCallback(
    (entityName: string, onConfirm: () => void) => {
      if (confirm(`Tem certeza que deseja excluir ${entityName}?`)) {
        onConfirm();
      }
    },
    []
  );

  return confirmDelete;
}

/**
 * Mensagens de confirmação padrão
 */
export const CONFIRM_MESSAGES = {
  DELETE: (entity: string) => `Tem certeza que deseja excluir ${entity}?`,
  DELETE_ITEM: 'Tem certeza que deseja excluir este item?',
  CANCEL: 'Tem certeza que deseja cancelar? As alterações não salvas serão perdidas.',
  CANCEL_OPERATION: (operation: string) => `Tem certeza que deseja cancelar ${operation}?`,
} as const;
