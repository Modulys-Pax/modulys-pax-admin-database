'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceLabelApi, MaintenanceLabel } from '@/lib/api/maintenance-label';
import { useEffectiveBranch } from '@/lib/hooks/use-effective-branch';
import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable, PaginationMeta } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyLabels } from '@/components/ui/empty-state';
import { toastErrorFromException, toastSuccess } from '@/lib/utils';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Trash2,
  Printer,
  Eye,
  Tag,
  Truck,
  Package,
  Calendar,
} from 'lucide-react';
import { formatDate } from '@/lib/utils/date';

const LIMIT = 10;

export default function MaintenanceLabelsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { branchId: effectiveBranchId } = useEffectiveBranch();
  const [page, setPage] = useState(1);

  const { data: response, isLoading } = useQuery({
    queryKey: ['maintenanceLabels', effectiveBranchId, page, LIMIT],
    queryFn: () =>
      maintenanceLabelApi.getAll(
        effectiveBranchId || undefined,
        undefined,
        page,
        LIMIT,
      ),
    enabled: !!effectiveBranchId,
  });

  // Buscar todas as etiquetas para métricas
  const { data: allLabelsResponse } = useQuery({
    queryKey: ['maintenanceLabels-metrics', effectiveBranchId],
    queryFn: () => maintenanceLabelApi.getAll(effectiveBranchId || undefined, undefined, 1, 1000),
    enabled: !!effectiveBranchId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => maintenanceLabelApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceLabels'] });
      toastSuccess('Etiqueta excluída com sucesso');
    },
    onError: (error) => {
      toastErrorFromException(error, 'Erro ao excluir etiqueta');
    },
  });

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta etiqueta?')) {
      deleteMutation.mutate(id);
    }
  };

  const handlePrint = (label: MaintenanceLabel) => {
    router.push(`/maintenance-labels/${label.id}?print=true`);
  };

  // Calcular métricas
  const metrics = useMemo(() => {
    const labels = allLabelsResponse?.data || [];
    const totalLabels = labels.length;
    
    // Contar veículos únicos
    const uniqueVehicles = new Set(labels.map(l => l.vehicleId)).size;
    
    // Total de produtos em todas as etiquetas
    const totalProducts = labels.reduce((sum, l) => sum + (l.products?.length || 0), 0);
    
    // Etiquetas do mês atual
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const labelsThisMonth = labels.filter(l => {
      const date = new Date(l.createdAt);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;

    return {
      totalLabels,
      uniqueVehicles,
      totalProducts,
      labelsThisMonth,
    };
  }, [allLabelsResponse]);

  const columns = [
    {
      key: 'createdAt',
      header: 'Data',
      render: (label: MaintenanceLabel) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-foreground">
            {formatDate(label.createdAt)}
          </span>
        </div>
      ),
    },
    {
      key: 'vehicle',
      header: 'Veículo',
      render: (label: MaintenanceLabel) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Truck className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold text-foreground">
            {label.vehiclePlate}
          </span>
        </div>
      ),
    },
    {
      key: 'products',
      header: 'Produtos',
      render: (label: MaintenanceLabel) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {label.products.length} item(ns)
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      className: 'text-right',
      render: (label: MaintenanceLabel) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/maintenance-labels/${label.id}`} className="flex items-center">
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePrint(label)} className="flex items-center">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(label.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const pagination: PaginationMeta | undefined = response
    ? {
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages,
      }
    : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Etiquetas de Manutenção"
        subtitle="Gerencie as etiquetas de troca por KM dos veículos"
        actions={
          <Link href="/maintenance-labels/new">
            <Button>Nova Etiqueta</Button>
          </Link>
        }
      />

      {/* Métricas */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total de Etiquetas"
            value={metrics.totalLabels}
            icon={Tag}
            className="border-l-4 border-l-primary"
          />
          <StatCard
            title="Veículos com Etiqueta"
            value={metrics.uniqueVehicles}
            icon={Truck}
            className="border-l-4 border-l-blue-500"
          />
          <StatCard
            title="Itens Controlados"
            value={metrics.totalProducts}
            icon={Package}
            className="border-l-4 border-l-green-500"
          />
          <StatCard
            title="Etiquetas do Mês"
            value={metrics.labelsThisMonth}
            icon={Calendar}
            className="border-l-4 border-l-yellow-500"
          />
        </div>
      )}

      {/* Lista de Etiquetas */}
      <SectionCard
        title="Etiquetas"
        description={response?.total ? `${response.total} etiqueta(s) encontrada(s)` : undefined}
      >
        {!isLoading && response?.data.length === 0 ? (
          <EmptyLabels />
        ) : (
          <DataTable
            data={response?.data || []}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="Nenhuma etiqueta encontrada"
            pagination={pagination}
            onPageChange={setPage}
          />
        )}
      </SectionCard>
    </div>
  );
}
