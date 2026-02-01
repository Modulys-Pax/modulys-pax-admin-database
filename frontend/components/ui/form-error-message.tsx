import { cn } from '@/lib/utils';

interface FormErrorMessageProps {
  error?: { message?: string } | string;
  className?: string;
}

/**
 * Componente para exibir mensagens de erro de formulário de forma consistente
 */
export function FormErrorMessage({ error, className }: FormErrorMessageProps) {
  if (!error) return null;

  const message = typeof error === 'string' ? error : error.message;
  if (!message) return null;

  return (
    <p className={cn('text-sm text-destructive mt-1', className)}>
      {message}
    </p>
  );
}
