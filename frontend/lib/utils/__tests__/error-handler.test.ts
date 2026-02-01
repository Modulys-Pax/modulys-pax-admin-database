import { extractErrorMessage } from '../error-handler';

describe('error-handler utils', () => {
  describe('extractErrorMessage', () => {
    it('deve retornar mensagem padrão para erro nulo', () => {
      expect(extractErrorMessage(null)).toBe('Ocorreu um erro inesperado. Tente novamente.');
    });

    it('deve retornar mensagem padrão para undefined', () => {
      expect(extractErrorMessage(undefined)).toBe('Ocorreu um erro inesperado. Tente novamente.');
    });

    it('deve extrair mensagem de erro do Axios', () => {
      const axiosError = {
        response: {
          data: {
            message: 'Funcionário não encontrado',
          },
        },
      };
      expect(extractErrorMessage(axiosError)).toBe('Funcionário não encontrado');
    });

    it('deve extrair erro alternativo do Axios', () => {
      const axiosError = {
        response: {
          data: {
            error: 'Registro duplicado',
          },
        },
      };
      expect(extractErrorMessage(axiosError)).toBe('Registro duplicado');
    });

    it('deve traduzir erro 401 Unauthorized', () => {
      const axiosError = {
        response: {
          data: {
            message: 'Unauthorized',
          },
        },
      };
      expect(extractErrorMessage(axiosError)).toBe('Sua sessão expirou. Faça login novamente.');
    });

    it('deve traduzir erro 403 Forbidden', () => {
      const axiosError = {
        response: {
          data: {
            message: 'Forbidden',
          },
        },
      };
      expect(extractErrorMessage(axiosError)).toBe('Você não tem permissão para realizar esta ação.');
    });

    it('deve traduzir erro 404 Not Found', () => {
      const axiosError = {
        response: {
          data: {
            message: 'Not Found',
          },
        },
      };
      expect(extractErrorMessage(axiosError)).toBe('O registro solicitado não foi encontrado.');
    });

    it('deve traduzir erro 409 Conflict', () => {
      const axiosError = {
        response: {
          data: {
            message: 'Conflict',
          },
        },
      };
      expect(extractErrorMessage(axiosError)).toBe('Já existe um registro com estas informações.');
    });

    it('deve traduzir erro 500 Internal Server Error', () => {
      const axiosError = {
        response: {
          data: {
            message: 'Internal Server Error',
          },
        },
      };
      expect(extractErrorMessage(axiosError)).toBe('Erro no servidor. Tente novamente em alguns instantes.');
    });

    it('deve traduzir erro de rede', () => {
      const axiosError = {
        response: {
          data: {
            message: 'Network Error',
          },
        },
      };
      expect(extractErrorMessage(axiosError)).toBe('Erro de conexão. Verifique sua internet e tente novamente.');
    });

    it('deve traduzir erro de timeout', () => {
      const axiosError = {
        response: {
          data: {
            message: 'Request timeout',
          },
        },
      };
      expect(extractErrorMessage(axiosError)).toBe('Erro de conexão. Verifique sua internet e tente novamente.');
    });

    it('deve traduzir erro de validação', () => {
      const axiosError = {
        response: {
          data: {
            message: 'Validation failed',
          },
        },
      };
      expect(extractErrorMessage(axiosError)).toBe('Os dados informados são inválidos. Verifique e tente novamente.');
    });

    it('deve extrair mensagem de Error padrão', () => {
      const error = new Error('Erro de teste');
      // Mensagens claras em português são retornadas como estão
      expect(extractErrorMessage(error)).toBe('Erro de teste');
    });

    it('deve tratar string de erro diretamente', () => {
      expect(extractErrorMessage('Email já cadastrado')).toBe('Email já cadastrado');
    });

    it('deve traduzir baseado em status code', () => {
      const axiosError = {
        response: {
          status: 401,
        },
      };
      expect(extractErrorMessage(axiosError)).toBe('Sua sessão expirou. Faça login novamente.');
    });

    it('deve manter mensagens em português claras', () => {
      const axiosError = {
        response: {
          data: {
            message: 'Funcionário já possui férias marcadas neste período',
          },
        },
      };
      expect(extractErrorMessage(axiosError)).toBe('Funcionário já possui férias marcadas neste período');
    });

    it('deve traduzir mensagens técnicas genéricas', () => {
      const axiosError = {
        response: {
          data: {
            message: 'NullPointerException occurred',
          },
        },
      };
      expect(extractErrorMessage(axiosError)).toBe('Não foi possível realizar esta operação. Tente novamente.');
    });
  });
});
