'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleMarkingApi, VehicleMarking, CreateVehicleMarkingDto } from '@/lib/api/vehicle-marking';
import { vehicleApi } from '@/lib/api/vehicle';
import { useEffectiveBranch } from '@/lib/hooks/use-effective-branch';
import { DEFAULT_COMPANY_ID } from '@/lib/constants/company.constants';
import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { DataTable, PaginationMeta } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { toSelectOptions } from '@/lib/hooks/use-searchable-select';
import { toastErrorFromException, toastSuccess } from '@/lib/utils';
import { useDebounce } from '@/lib/hooks/use-debounce';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Wrench } from 'lucide-react';
import Link from 'next/link';
import { formatDateTime } from '@/lib/utils/date';

const DEBOUNCE_MS = 500;
const LIMIT = 10;

export default function MarkingsPage() {
  const queryClient = useQueryClient();
  const { branchId: effectiveBranchId } = useEffectiveBranch();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [km, setKm] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState(1);

  const debouncedStartDate = useDebounce(startDate, DEBOUNCE_MS);
  const debouncedEndDate = useDebounce(endDate, DEBOUNCE_MS);

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setPage(1);
  }, [effectiveBranchId, debouncedStartDate, debouncedEndDate]);

  // Buscar veículos
  const { data: vehiclesResponse } = useQuery({
    queryKey: ['vehicles', effectiveBranchId],
    queryFn: () => vehicleApi.getAll(effectiveBranchId || undefined, false, 1, 1000),
    enabled: !!effectiveBranchId,
  });

  const vehicles = vehiclesResponse?.data || [];

  // Buscar marcações
  const { data: markingsResponse, isLoading } = useQuery({
    queryKey: [
      'vehicleMarkings',
      effectiveBranchId,
      debouncedStartDate,
      debouncedEndDate,
      page,
    ],
    queryFn: () =>
      vehicleMarkingApi.getAll(
        effectiveBranchId || undefined,
        debouncedStartDate || undefined,
        debouncedEndDate || undefined,
        page,
        LIMIT,
      ),
    enabled: !!effectiveBranchId,
  });

  const markings = markingsResponse?.data || [];

  // Criar marcação (backend já atualiza vehicle.currentKm; invalidar cache para a listagem/detalhe do veículo refletir)
  const createMutation = useMutation({
    mutationFn: (data: CreateVehicleMarkingDto) => vehicleMarkingApi.create(data),
    onSuccess: async (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehicleMarkings'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceDue'] });
      await queryClient.refetchQueries({ queryKey: ['vehicles'] });
      await queryClient.refetchQueries({ queryKey: ['maintenanceDue'] });
      if (variables.vehicleId) {
        queryClient.invalidateQueries({ queryKey: ['vehicles', variables.vehicleId] });
        queryClient.invalidateQueries({ queryKey: ['vehicles', variables.vehicleId, 'history'] });
      }
      setSelectedVehicleId('');
      setKm('');
      toastSuccess('Marcação criada com sucesso. Quilometragem do veículo atualizada.');
    },
    onError: (error) => {
      toastErrorFromException(error, 'Erro ao criar marcação');
    },
  });

  // Excluir marcação (invalidar veículos para listagem/detalhe atualizarem)
  const deleteMutation = useMutation({
    mutationFn: (id: string) => vehicleMarkingApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicleMarkings'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceDue'] });
      toastSuccess('Marcação excluída com sucesso');
    },
    onError: (error) => {
      toastErrorFromException(error, 'Erro ao excluir marcação');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!effectiveBranchId) {
      toastErrorFromException(
        new Error('Por favor, selecione uma filial na sidebar'),
        'Filial não selecionada',
      );
      return;
    }

    if (!selectedVehicleId) {
      toastErrorFromException(new Error('Selecione um veículo'), 'Veículo obrigatório');
      return;
    }

    if (!km || isNaN(Number(km)) || Number(km) < 0) {
      toastErrorFromException(
        new Error('Informe uma quilometragem válida'),
        'KM inválido',
      );
      return;
    }

    createMutation.mutate({
      vehicleId: selectedVehicleId,
      km: Number(km),
      companyId: DEFAULT_COMPANY_ID,
      branchId: effectiveBranchId,
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta marcação?')) {
      deleteMutation.mutate(id);
    }
  };

  const columns = [
    {
      key: 'createdAt',
      header: 'Data',
      render: (marking: VehicleMarking) => (
        <span className="text-sm text-foreground">
          {formatDateTime(marking.createdAt)}
        </span>
      ),
    },
    {
      key: 'vehicle',
      header: 'Veículo',
      render: (marking: VehicleMarking) => (
        <span className="text-sm font-medium text-foreground">
          {marking.vehiclePlate || marking.vehicleId}
        </span>
      ),
    },
    {
      key: 'km',
      header: 'KM',
      render: (marking: VehicleMarking) => (
        <span className="text-sm text-muted-foreground">
          {marking.km.toLocaleString('pt-BR')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      className: 'text-right',
      render: (marking: VehicleMarking) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleDelete(marking.id)}
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

  const pagination: PaginationMeta | undefined = markingsResponse
    ? {
        page: markingsResponse.page,
        limit: markingsResponse.limit,
        total: markingsResponse.total,
        totalPages: markingsResponse.totalPages,
      }
    : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marcações"
        subtitle="Registre quando um veículo chega em uma filial"
        actions={
          <Link href="/product-changes/new">
            <Button variant="outline">
              <Wrench className="h-4 w-4 mr-2" />
              Registrar Troca na Estrada
            </Button>
          </Link>
        }
      />

      <SectionCard title="Nova Marcação">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vehicle" className="text-sm text-muted-foreground mb-2 block">
                Veículo *
              </Label>
              <SearchableSelect
                id="vehicle"
                options={toSelectOptions(
                  vehicles.filter((v) => v.active),
                  (v) => v.id,
                  (v) => `${v.plate}${v.brandName || v.modelName ? ` - ${v.brandName || ''} ${v.modelName || ''}`.trim() : ''}`,
                )}
                value={selectedVehicleId}
                onChange={(value) => setSelectedVehicleId(value)}
                placeholder="Selecione um veículo"
                disabled={!effectiveBranchId || createMutation.isPending}
              />
            </div>

            <div>
              <Label htmlFor="km" className="text-sm text-muted-foreground mb-2 block">
                Quilometragem (KM) *
              </Label>
              <Input
                id="km"
                type="number"
                min="0"
                step="1"
                value={km}
                onChange={(e) => setKm(e.target.value)}
                placeholder="Ex: 50000"
                className="rounded-xl"
                disabled={createMutation.isPending}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={createMutation.isPending || !effectiveBranchId}
            >
              {createMutation.isPending ? 'Salvando...' : 'Registrar Marcação'}
            </Button>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Filtros">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="filter-start-date" className="text-sm text-muted-foreground mb-2 block">
              Data Inicial
            </Label>
            <Input
              id="filter-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div>
            <Label htmlFor="filter-end-date" className="text-sm text-muted-foreground mb-2 block">
              Data Final
            </Label>
            <Input
              id="filter-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-xl"
            />
          </div>
        </div>
      </SectionCard>

      <DataTable
        data={markings}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="Nenhuma marcação encontrada"
        pagination={pagination}
        onPageChange={setPage}
      />
    </div>
  );
}
