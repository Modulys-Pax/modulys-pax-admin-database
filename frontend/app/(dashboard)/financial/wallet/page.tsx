'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletApi, WalletSummary, MonthlyMovement } from '@/lib/api/wallet';
import { formatCurrency } from '@/lib/utils/currency';
import { useEffectiveBranch } from '@/lib/hooks/use-effective-branch';
import { useAuth } from '@/lib/auth/auth-context';
import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { toastSuccess, toastErrorFromException, toastError } from '@/lib/utils';
import { formatDate } from '@/lib/utils/date';
import { MONTH_NAMES } from '@/lib/utils/date';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
  Settings,
  Calendar,
  RefreshCw,
  Loader2,
  Plus,
} from 'lucide-react';
import Link from 'next/link';

export default function WalletPage() {
  const queryClient = useQueryClient();
  const { branchId: effectiveBranchId } = useEffectiveBranch();
  const { user } = useAuth();
  const isAdmin = user?.role?.name === 'ADMIN' || user?.role?.name === 'admin';

  // Estado para filtros
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Estado para modal de ajuste
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [newBalance, setNewBalance] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustType, setAdjustType] = useState<'MANUAL_ADJUSTMENT' | 'INITIAL_BALANCE' | 'CORRECTION'>('MANUAL_ADJUSTMENT');

  // Buscar resumo da carteira
  const { data: walletData, isLoading, error } = useQuery({
    queryKey: ['wallet-summary', effectiveBranchId, selectedMonth, selectedYear],
    queryFn: () => walletApi.getSummary(selectedMonth, selectedYear, effectiveBranchId || undefined),
    enabled: !!effectiveBranchId,
  });

  // Mutation para ajuste de saldo
  const adjustMutation = useMutation({
    mutationFn: () =>
      walletApi.adjustBalance(
        {
          newBalance: parseFloat(newBalance),
          adjustmentType: adjustType,
          reason: adjustReason || undefined,
        },
        effectiveBranchId || undefined,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-summary'] });
      toastSuccess('Saldo ajustado com sucesso');
      setAdjustDialogOpen(false);
      setNewBalance('');
      setAdjustReason('');
    },
    onError: (error) => toastErrorFromException(error, 'Erro ao ajustar saldo'),
  });

  const handleAdjust = () => {
    const value = parseFloat(newBalance);
    if (isNaN(value) || value < 0) {
      toastError('Informe um valor válido');
      return;
    }
    adjustMutation.mutate();
  };

  // Opções de meses
  const monthOptions = MONTH_NAMES.map((name, index) => ({
    value: (index + 1).toString(),
    label: name,
  }));

  // Opções de anos (últimos 5 anos)
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = now.getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  // Ajuste type options
  const adjustTypeOptions = [
    { value: 'MANUAL_ADJUSTMENT', label: 'Ajuste Manual' },
    { value: 'INITIAL_BALANCE', label: 'Saldo Inicial' },
    { value: 'CORRECTION', label: 'Correção' },
  ];

  // Separar movimentações
  const { pendingPayables, pendingReceivables, paidMovements, receivedMovements } = useMemo(() => {
    if (!walletData?.movements) {
      return { pendingPayables: [], pendingReceivables: [], paidMovements: [], receivedMovements: [] };
    }

    return {
      pendingPayables: walletData.movements.filter(m => m.type === 'payable' && m.status === 'PENDING'),
      pendingReceivables: walletData.movements.filter(m => m.type === 'receivable' && m.status === 'PENDING'),
      paidMovements: walletData.movements.filter(m => m.type === 'payable' && m.status === 'PAID'),
      receivedMovements: walletData.movements.filter(m => m.type === 'receivable' && m.status === 'RECEIVED'),
    };
  }, [walletData?.movements]);

  const getStatusBadge = (movement: MonthlyMovement) => {
    if (movement.status === 'PENDING') {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Pendente
        </Badge>
      );
    }
    if (movement.status === 'PAID' || movement.status === 'RECEIVED') {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          {movement.status === 'PAID' ? 'Pago' : 'Recebido'}
        </Badge>
      );
    }
    return <Badge variant="outline">{movement.status}</Badge>;
  };

  const getOriginLabel = (originType?: string) => {
    const labels: Record<string, string> = {
      MAINTENANCE: 'Manutenção',
      STOCK: 'Estoque',
      HR: 'Folha de Pagamento',
      MANUAL: 'Manual',
    };
    return originType ? labels[originType] || originType : '-';
  };

  // Verificar se saldo é insuficiente para pendentes
  const hasInsufficientBalance = walletData && walletData.currentBalance < walletData.pendingPayables;

  if (!effectiveBranchId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Carteira" subtitle="Selecione uma filial para visualizar" />
        <SectionCard>
          <EmptyState
            icon={Wallet}
            title="Nenhuma filial selecionada"
            description="Selecione uma filial no menu lateral para visualizar a carteira."
          />
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Carteira da Empresa"
        subtitle={walletData ? `Filial: ${walletData.branchName}` : 'Visão financeira consolidada'}
        actions={
          isAdmin && (
            <Button variant="outline" onClick={() => setAdjustDialogOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Ajustar Saldo
            </Button>
          )
        }
      />

      {/* Filtros */}
      <SectionCard title="Período">
        <div className="flex gap-4 items-end">
          <div className="w-48">
            <Label className="text-sm text-muted-foreground mb-2 block">Mês</Label>
            <SearchableSelect
              options={monthOptions}
              value={selectedMonth.toString()}
              onChange={(v) => setSelectedMonth(parseInt(v))}
              placeholder="Mês"
            />
          </div>
          <div className="w-32">
            <Label className="text-sm text-muted-foreground mb-2 block">Ano</Label>
            <SearchableSelect
              options={yearOptions}
              value={selectedYear.toString()}
              onChange={(v) => setSelectedYear(parseInt(v))}
              placeholder="Ano"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['wallet-summary'] })}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </SectionCard>

      {/* Cards de Métricas */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : walletData ? (
        <>
          {/* Alerta de saldo insuficiente */}
          {hasInsufficientBalance && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-800 dark:text-red-200">Saldo Insuficiente</p>
                <p className="text-sm text-red-600 dark:text-red-300">
                  O saldo atual ({formatCurrency(walletData.currentBalance)}) é menor que as contas pendentes ({formatCurrency(walletData.pendingPayables)}).
                  Faltam {formatCurrency(walletData.pendingPayables - walletData.currentBalance)} para cobrir todas as pendências.
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Saldo em Caixa"
              value={formatCurrency(walletData.currentBalance)}
              icon={Wallet}
              className={`border-l-4 ${walletData.currentBalance >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`}
            />
            <StatCard
              title="Recebido no Mês"
              value={formatCurrency(walletData.totalIncome)}
              icon={ArrowUpCircle}
              className="border-l-4 border-l-blue-500"
            />
            <StatCard
              title="Pago no Mês"
              value={formatCurrency(walletData.totalExpense)}
              icon={ArrowDownCircle}
              className="border-l-4 border-l-orange-500"
            />
            <StatCard
              title={walletData.periodProfit >= 0 ? 'Lucro do Período' : 'Prejuízo do Período'}
              value={formatCurrency(Math.abs(walletData.periodProfit))}
              icon={walletData.periodProfit >= 0 ? TrendingUp : TrendingDown}
              className={`border-l-4 ${walletData.periodProfit >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`}
            />
          </div>

          {/* Cards de Pendentes */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/20 dark:to-yellow-900/10 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">A Pagar (Pendente)</span>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {formatCurrency(walletData.pendingPayables)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {pendingPayables.length} conta(s) pendente(s)
              </p>
            </div>

            <div className="rounded-xl border border-border bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">A Receber (Pendente)</span>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {formatCurrency(walletData.pendingReceivables)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {pendingReceivables.length} conta(s) pendente(s)
              </p>
            </div>

            <div className="rounded-xl border border-border bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Projeção de Saldo</span>
              </div>
              <p className={`text-3xl font-bold ${walletData.projectedBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(walletData.projectedBalance)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Saldo + Receber - Pagar
              </p>
            </div>
          </div>

          {/* Tabelas de Movimentações */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Contas a Pagar Pendentes */}
            <SectionCard
              title="Contas a Pagar Pendentes"
              description={pendingPayables.length > 0 ? `${pendingPayables.length} conta(s)` : undefined}
              actions={
                pendingPayables.length > 5 ? (
                  <Link href="/accounts-payable">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      <Plus className="h-4 w-4 mr-1" />
                      Ver todas ({pendingPayables.length})
                    </Button>
                  </Link>
                ) : undefined
              }
            >
              {pendingPayables.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma conta a pagar pendente no período</p>
                </div>
              ) : (
                <>
                  <DataTable
                    data={pendingPayables.slice(0, 5)}
                    isLoading={false}
                    emptyMessage="Nenhuma conta pendente"
                    columns={[
                      {
                        key: 'description',
                        header: 'Descrição',
                        render: (m) => (
                          <div>
                            <p className="font-medium text-foreground">{m.description}</p>
                            <p className="text-xs text-muted-foreground">{getOriginLabel(m.originType)}</p>
                          </div>
                        ),
                      },
                      {
                        key: 'dueDate',
                        header: 'Vencimento',
                        render: (m) => (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{formatDate(m.dueDate)}</span>
                          </div>
                        ),
                      },
                      {
                        key: 'amount',
                        header: 'Valor',
                        render: (m) => (
                          <span className="font-semibold text-red-600">{formatCurrency(m.amount)}</span>
                        ),
                        className: 'text-right',
                      },
                    ]}
                  />
                  {pendingPayables.length > 0 && (
                    <div className="mt-4 pt-4 border-t flex justify-center">
                      <Link href="/accounts-payable">
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Ver todas as contas a pagar
                        </Button>
                      </Link>
                    </div>
                  )}
                </>
              )}
            </SectionCard>

            {/* Contas a Receber Pendentes */}
            <SectionCard
              title="Contas a Receber Pendentes"
              description={pendingReceivables.length > 0 ? `${pendingReceivables.length} conta(s)` : undefined}
              actions={
                pendingReceivables.length > 5 ? (
                  <Link href="/accounts-receivable">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      <Plus className="h-4 w-4 mr-1" />
                      Ver todas ({pendingReceivables.length})
                    </Button>
                  </Link>
                ) : undefined
              }
            >
              {pendingReceivables.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma conta a receber pendente no período</p>
                </div>
              ) : (
                <>
                  <DataTable
                    data={pendingReceivables.slice(0, 5)}
                    isLoading={false}
                    emptyMessage="Nenhuma conta pendente"
                    columns={[
                      {
                        key: 'description',
                        header: 'Descrição',
                        render: (m) => (
                          <div>
                            <p className="font-medium text-foreground">{m.description}</p>
                            <p className="text-xs text-muted-foreground">{getOriginLabel(m.originType)}</p>
                          </div>
                        ),
                      },
                      {
                        key: 'dueDate',
                        header: 'Vencimento',
                        render: (m) => (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{formatDate(m.dueDate)}</span>
                          </div>
                        ),
                      },
                      {
                        key: 'amount',
                        header: 'Valor',
                        render: (m) => (
                          <span className="font-semibold text-green-600">{formatCurrency(m.amount)}</span>
                        ),
                        className: 'text-right',
                      },
                    ]}
                  />
                  {pendingReceivables.length > 0 && (
                    <div className="mt-4 pt-4 border-t flex justify-center">
                      <Link href="/accounts-receivable">
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Ver todas as contas a receber
                        </Button>
                      </Link>
                    </div>
                  )}
                </>
              )}
            </SectionCard>
          </div>

          {/* Movimentações Realizadas */}
          <SectionCard
            title="Movimentações Realizadas no Período"
            description={`${paidMovements.length + receivedMovements.length} movimentação(ões)`}
          >
            {paidMovements.length === 0 && receivedMovements.length === 0 ? (
              <EmptyState
                icon={DollarSign}
                title="Nenhuma movimentação no período"
                description="Não há pagamentos ou recebimentos realizados neste mês."
              />
            ) : (
              <DataTable
                data={[...paidMovements, ...receivedMovements].sort(
                  (a, b) => new Date(b.paymentDate || b.dueDate).getTime() - new Date(a.paymentDate || a.dueDate).getTime()
                )}
                isLoading={false}
                emptyMessage="Nenhuma movimentação"
                columns={[
                  {
                    key: 'type',
                    header: 'Tipo',
                    render: (m) => (
                      <Badge
                        variant="outline"
                        className={m.type === 'receivable' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}
                      >
                        {m.type === 'receivable' ? (
                          <><ArrowUpCircle className="h-3 w-3 mr-1" /> Entrada</>
                        ) : (
                          <><ArrowDownCircle className="h-3 w-3 mr-1" /> Saída</>
                        )}
                      </Badge>
                    ),
                  },
                  {
                    key: 'description',
                    header: 'Descrição',
                    render: (m) => (
                      <div>
                        <p className="font-medium text-foreground">{m.description}</p>
                        <p className="text-xs text-muted-foreground">{getOriginLabel(m.originType)}</p>
                      </div>
                    ),
                  },
                  {
                    key: 'paymentDate',
                    header: 'Data',
                    render: (m) => (
                      <span className="text-sm text-foreground">
                        {formatDate(m.paymentDate || m.dueDate)}
                      </span>
                    ),
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (m) => getStatusBadge(m),
                  },
                  {
                    key: 'amount',
                    header: 'Valor',
                    render: (m) => (
                      <span className={`font-semibold ${m.type === 'receivable' ? 'text-green-600' : 'text-red-600'}`}>
                        {m.type === 'receivable' ? '+' : '-'} {formatCurrency(m.amount)}
                      </span>
                    ),
                    className: 'text-right',
                  },
                ]}
              />
            )}
          </SectionCard>
        </>
      ) : (
        <SectionCard>
          <EmptyState
            icon={Wallet}
            title="Erro ao carregar dados"
            description="Não foi possível carregar os dados da carteira."
          />
        </SectionCard>
      )}

      {/* Dialog de Ajuste de Saldo */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Saldo</DialogTitle>
            <DialogDescription>
              Defina o novo saldo da filial. Esta ação ficará registrada no histórico.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {walletData && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Saldo Atual</p>
                <p className="text-xl font-bold">{formatCurrency(walletData.currentBalance)}</p>
              </div>
            )}
            <div>
              <Label>Novo Saldo (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div>
              <Label>Tipo de Ajuste</Label>
              <SearchableSelect
                options={adjustTypeOptions}
                value={adjustType}
                onChange={(v) => setAdjustType(v as 'MANUAL_ADJUSTMENT' | 'INITIAL_BALANCE' | 'CORRECTION')}
                placeholder="Selecione"
              />
            </div>
            <div>
              <Label>Motivo do Ajuste</Label>
              <Textarea
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Descreva o motivo do ajuste..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdjust} disabled={adjustMutation.isPending}>
              {adjustMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ajustando...
                </>
              ) : (
                'Confirmar Ajuste'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
