/**
 * Utilitário para tratamento de erros - traduz erros técnicos para linguagem clara
 * Conforme diretrizes: "Linguagem clara, nunca técnica"
 */

interface ErrorResponse {
  message?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Extrai mensagem de erro de diferentes formatos de resposta
 */
export function extractErrorMessage(error: unknown): string {
  if (!error) {
    return 'Ocorreu um erro inesperado. Tente novamente.';
  }

  // Erro do Axios
  if (typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: ErrorResponse } };
    const errorData = axiosError.response?.data;

    if (errorData?.message) {
      return translateErrorMessage(errorData.message);
    }

    if (errorData?.error) {
      return translateErrorMessage(errorData.error);
    }

    // Erros HTTP comuns
    const statusCode = (axiosError.response as { status?: number })?.status;
    if (statusCode) {
      return translateHttpError(statusCode);
    }
  }

  // Erro padrão do JavaScript
  if (error instanceof Error) {
    return translateErrorMessage(error.message);
  }

  // String de erro
  if (typeof error === 'string') {
    return translateErrorMessage(error);
  }

  return 'Ocorreu um erro inesperado. Tente novamente.';
}

/**
 * Traduz mensagens de erro técnicas para linguagem clara
 */
function translateErrorMessage(message: string): string {
  const lowerMessage = message.toLowerCase();

  // Erros de autenticação
  if (lowerMessage.includes('unauthorized') || lowerMessage.includes('401')) {
    return 'Sua sessão expirou. Faça login novamente.';
  }

  if (lowerMessage.includes('forbidden') || lowerMessage.includes('403')) {
    return 'Você não tem permissão para realizar esta ação.';
  }

  // Erros de validação
  if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
    return 'Os dados informados são inválidos. Verifique e tente novamente.';
  }

  // Erros de não encontrado
  if (
    lowerMessage.includes('not found') ||
    lowerMessage.includes('404') ||
    lowerMessage.includes('does not exist')
  ) {
    return 'O registro solicitado não foi encontrado.';
  }

  // Erros de conflito
  if (lowerMessage.includes('conflict') || lowerMessage.includes('409')) {
    return 'Já existe um registro com estas informações.';
  }

  // Erros de servidor
  if (
    lowerMessage.includes('internal server error') ||
    lowerMessage.includes('500')
  ) {
    return 'Erro no servidor. Tente novamente em alguns instantes.';
  }

  // Erros de rede
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('econnrefused')
  ) {
    return 'Erro de conexão. Verifique sua internet e tente novamente.';
  }

  // Se a mensagem já estiver em português e clara, retorna como está
  if (
    !lowerMessage.includes('error') &&
    !lowerMessage.includes('exception') &&
    !lowerMessage.includes('failed') &&
    !lowerMessage.includes('undefined') &&
    !lowerMessage.includes('null')
  ) {
    return message;
  }

  // Mensagem genérica para erros técnicos não mapeados
  return 'Não foi possível realizar esta operação. Tente novamente.';
}

/**
 * Traduz códigos HTTP para mensagens claras
 */
function translateHttpError(statusCode: number): string {
  const errorMap: Record<number, string> = {
    400: 'Os dados informados são inválidos. Verifique e tente novamente.',
    401: 'Sua sessão expirou. Faça login novamente.',
    403: 'Você não tem permissão para realizar esta ação.',
    404: 'O registro solicitado não foi encontrado.',
    409: 'Já existe um registro com estas informações.',
    422: 'Os dados informados são inválidos. Verifique e tente novamente.',
    500: 'Erro no servidor. Tente novamente em alguns instantes.',
    502: 'Serviço temporariamente indisponível. Tente novamente em alguns instantes.',
    503: 'Serviço temporariamente indisponível. Tente novamente em alguns instantes.',
  };

  return (
    errorMap[statusCode] ||
    'Ocorreu um erro ao processar sua solicitação. Tente novamente.'
  );
}
