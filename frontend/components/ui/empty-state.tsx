import { ReactNode } from 'react';
import { LucideIcon, Package, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
  children?: ReactNode;
}

/**
 * Componente de estado vazio reutilizável
 * Exibe uma mensagem amigável quando não há dados para mostrar
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      <div className="mb-4 rounded-full bg-muted p-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      
      <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>
      
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">
          {description}
        </p>
      )}
      
      {action && (
        action.href ? (
          <Link href={action.href}>
            <Button>{action.label}</Button>
          </Link>
        ) : (
          <Button onClick={action.onClick}>{action.label}</Button>
        )
      )}
      
      {children}
    </div>
  );
}

// =============================================================================
// Variantes pré-configuradas para contextos comuns
// =============================================================================

interface ContextualEmptyStateProps {
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyVehicles({ action, className }: ContextualEmptyStateProps) {
  return (
    <EmptyState
      icon={Package}
      title="Nenhum veículo encontrado"
      description="Cadastre veículos para começar a gerenciar sua frota."
      action={action || { label: 'Cadastrar Veículo', href: '/vehicles/new' }}
      className={className}
    />
  );
}

export function EmptyMaintenance({ action, className }: ContextualEmptyStateProps) {
  return (
    <EmptyState
      icon={Package}
      title="Nenhuma ordem de manutenção"
      description="Crie uma ordem de manutenção para registrar serviços realizados nos veículos."
      action={action || { label: 'Nova Ordem', href: '/maintenance/new' }}
      className={className}
    />
  );
}

export function EmptyProducts({ action, className }: ContextualEmptyStateProps) {
  return (
    <EmptyState
      icon={Package}
      title="Nenhum produto cadastrado"
      description="Cadastre produtos para gerenciar o estoque de peças e materiais."
      action={action || { label: 'Cadastrar Produto', href: '/products/new' }}
      className={className}
    />
  );
}

export function EmptyStock({ className }: ContextualEmptyStateProps) {
  return (
    <EmptyState
      icon={Package}
      title="Nenhum estoque encontrado"
      description="O estoque será atualizado conforme movimentações forem registradas."
      className={className}
    />
  );
}

export function EmptyMovements({ action, className }: ContextualEmptyStateProps) {
  return (
    <EmptyState
      icon={Inbox}
      title="Nenhuma movimentação encontrada"
      description="Registre entradas de estoque para acompanhar o histórico de movimentações."
      action={action || { label: 'Nova Entrada', href: '/stock/movements/new' }}
      className={className}
    />
  );
}

export function EmptyLabels({ action, className }: ContextualEmptyStateProps) {
  return (
    <EmptyState
      icon={Package}
      title="Nenhuma etiqueta encontrada"
      description="Crie etiquetas de manutenção para controlar trocas por KM dos veículos."
      action={action || { label: 'Nova Etiqueta', href: '/maintenance-labels/new' }}
      className={className}
    />
  );
}
