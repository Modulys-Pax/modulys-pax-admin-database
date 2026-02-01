import {
  toastSuccess,
  toastError,
  toastErrorFromException,
  toastInfo,
  toastWarning,
  toast,
} from '../toast';
import { toast as sonnerToast } from 'sonner';

jest.mock('sonner', () => ({
  toast: Object.assign(jest.fn(), {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  }),
}));

jest.mock('../error-handler', () => ({
  extractErrorMessage: jest.fn((error) => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'Erro desconhecido';
  }),
}));

describe('toast utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('toastSuccess', () => {
    it('deve exibir toast de sucesso', () => {
      toastSuccess('Operação concluída');

      expect(sonnerToast.success).toHaveBeenCalledWith('Operação concluída', {
        description: undefined,
        duration: 4000,
      });
    });

    it('deve exibir toast de sucesso com descrição', () => {
      toastSuccess('Salvo', 'Dados salvos com sucesso');

      expect(sonnerToast.success).toHaveBeenCalledWith('Salvo', {
        description: 'Dados salvos com sucesso',
        duration: 4000,
      });
    });
  });

  describe('toastError', () => {
    it('deve exibir toast de erro', () => {
      toastError('Erro ao salvar');

      expect(sonnerToast.error).toHaveBeenCalledWith('Erro ao salvar', {
        description: undefined,
        duration: 5000,
      });
    });

    it('deve exibir toast de erro com descrição', () => {
      toastError('Falha', 'Tente novamente mais tarde');

      expect(sonnerToast.error).toHaveBeenCalledWith('Falha', {
        description: 'Tente novamente mais tarde',
        duration: 5000,
      });
    });
  });

  describe('toastErrorFromException', () => {
    it('deve extrair mensagem de Error', () => {
      const error = new Error('Erro de conexão');
      toastErrorFromException(error);

      expect(sonnerToast.error).toHaveBeenCalledWith('Erro de conexão', expect.any(Object));
    });

    it('deve usar mensagem padrão quando error é null', () => {
      toastErrorFromException(null, 'Erro padrão');

      expect(sonnerToast.error).toHaveBeenCalledWith('Erro padrão', expect.any(Object));
    });

    it('deve usar mensagem genérica quando não há error nem default', () => {
      toastErrorFromException(null);

      expect(sonnerToast.error).toHaveBeenCalledWith('Ocorreu um erro inesperado.', expect.any(Object));
    });
  });

  describe('toastInfo', () => {
    it('deve exibir toast de informação', () => {
      toastInfo('Informação importante');

      expect(sonnerToast.info).toHaveBeenCalledWith('Informação importante', {
        description: undefined,
        duration: 4000,
      });
    });
  });

  describe('toastWarning', () => {
    it('deve exibir toast de aviso', () => {
      toastWarning('Atenção');

      expect(sonnerToast.warning).toHaveBeenCalledWith('Atenção', {
        description: undefined,
        duration: 4000,
      });
    });
  });

  describe('toast', () => {
    it('deve exibir toast padrão', () => {
      toast('Mensagem');

      expect(sonnerToast).toHaveBeenCalledWith('Mensagem', {
        description: undefined,
        duration: 4000,
      });
    });
  });
});
