/**
 * Utilitário para exibir toasts de forma padronizada
 * Usa Sonner conforme diretrizes de UX
 */

import { toast as sonnerToast } from 'sonner';
import { extractErrorMessage } from './error-handler';

/**
 * Exibe toast de sucesso
 */
export function toastSuccess(message: string, description?: string) {
  sonnerToast.success(message, {
    description,
    duration: 4000,
  });
}

/**
 * Exibe toast de erro
 */
export function toastError(message: string, description?: string) {
  sonnerToast.error(message, {
    description,
    duration: 5000,
  });
}

/**
 * Exibe toast de erro a partir de um objeto Error
 * Traduz automaticamente para linguagem clara
 */
export function toastErrorFromException(error: unknown, defaultMessage?: string) {
  const message = error ? extractErrorMessage(error) : (defaultMessage || 'Ocorreu um erro inesperado.');
  toastError(message);
}

/**
 * Exibe toast de informação
 */
export function toastInfo(message: string, description?: string) {
  sonnerToast.info(message, {
    description,
    duration: 4000,
  });
}

/**
 * Exibe toast de aviso
 */
export function toastWarning(message: string, description?: string) {
  sonnerToast.warning(message, {
    description,
    duration: 4000,
  });
}

/**
 * Exibe toast padrão
 */
export function toast(message: string, description?: string) {
  sonnerToast(message, {
    description,
    duration: 4000,
  });
}

// Re-export do sonner para casos avançados
export { toast as toastPromise } from 'sonner';
