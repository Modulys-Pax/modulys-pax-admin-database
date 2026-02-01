'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleBrandApi, VehicleBrand } from '@/lib/api/vehicle-brand';
import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { toastSuccess, toastError, toastErrorFromException } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Car,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

export default function VehicleBrandsPage() {
  const queryClient = useQueryClient();
  const [showInactive, setShowInactive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<VehicleBrand | null>(null);
  const [brandName, setBrandName] = useState('');
  const [brandActive, setBrandActive] = useState(true);

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ['vehicle-brands', showInactive],
    queryFn: () => vehicleBrandApi.getAll(showInactive),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; active: boolean }) =>
      vehicleBrandApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-brands'] });
      toastSuccess('Marca criada com sucesso');
      closeDialog();
    },
    onError: (error) => toastErrorFromException(error, 'Erro ao criar marca'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; active?: boolean } }) =>
      vehicleBrandApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-brands'] });
      toastSuccess('Marca atualizada com sucesso');
      closeDialog();
    },
    onError: (error) => toastErrorFromException(error, 'Erro ao atualizar marca'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vehicleBrandApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-brands'] });
      toastSuccess('Marca excluída com sucesso');
    },
    onError: (error) => toastErrorFromException(error, 'Erro ao excluir marca'),
  });

  const openCreateDialog = () => {
    setEditingBrand(null);
    setBrandName('');
    setBrandActive(true);
    setDialogOpen(true);
  };

  const openEditDialog = (brand: VehicleBrand) => {
    setEditingBrand(brand);
    setBrandName(brand.name);
    setBrandActive(brand.active);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingBrand(null);
    setBrandName('');
    setBrandActive(true);
  };

  const handleSubmit = () => {
    if (!brandName.trim()) {
      toastError('Informe o nome da marca');
      return;
    }

    if (editingBrand) {
      updateMutation.mutate({
        id: editingBrand.id,
        data: { name: brandName.trim(), active: brandActive },
      });
    } else {
      createMutation.mutate({ name: brandName.trim(), active: brandActive });
    }
  };

  const handleDelete = (brand: VehicleBrand) => {
    if (confirm(`Excluir a marca "${brand.name}"? Esta ação não pode ser desfeita.`)) {
      deleteMutation.mutate(brand.id);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marcas de Veículos"
        subtitle="Gerencie as marcas de veículos disponíveis no sistema"
        actions={
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Marca
          </Button>
        }
      />

      {/* Filtros */}
      <SectionCard>
        <label htmlFor="show-inactive" className="inline-flex items-center gap-2 cursor-pointer mt-6">
          <Switch
            id="show-inactive"
            checked={showInactive}
            onCheckedChange={setShowInactive}
          />
          <span className="text-sm font-medium leading-none">
            Mostrar inativas
          </span>
        </label>
      </SectionCard>

      {/* Lista de Marcas */}
      <SectionCard
        title="Marcas Cadastradas"
        description={brands.length > 0 ? `${brands.length} marca(s)` : undefined}
      >
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : brands.length === 0 ? (
          <EmptyState
            icon={Car}
            title="Nenhuma marca cadastrada"
            description="Cadastre marcas de veículos para usá-las ao registrar novos veículos."
            action={{ label: 'Nova Marca', onClick: openCreateDialog }}
          />
        ) : (
          <DataTable
            data={brands}
            isLoading={isLoading}
            emptyMessage="Nenhuma marca encontrada"
            columns={[
              {
                key: 'name',
                header: 'Nome',
                render: (brand) => (
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Car className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">{brand.name}</span>
                  </div>
                ),
              },
              {
                key: 'active',
                header: 'Status',
                render: (brand) =>
                  brand.active ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Ativa
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                      <XCircle className="h-3 w-3 mr-1" />
                      Inativa
                    </Badge>
                  ),
              },
              {
                key: 'models',
                header: 'Modelos',
                render: (brand) => (
                  <Link
                    href={`/vehicle-models?brandId=${brand.id}`}
                    className="text-primary hover:underline text-sm"
                  >
                    Ver modelos →
                  </Link>
                ),
              },
              {
                key: 'actions',
                header: 'Ações',
                className: 'text-right',
                render: (brand) => (
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(brand)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(brand)}
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
            ]}
          />
        )}
      </SectionCard>

      {/* Dialog de Criar/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBrand ? 'Editar Marca' : 'Nova Marca'}</DialogTitle>
            <DialogDescription>
              {editingBrand
                ? 'Atualize as informações da marca.'
                : 'Preencha os dados para criar uma nova marca de veículo.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nome da Marca *</Label>
              <Input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Ex: Volvo, Scania, Mercedes-Benz..."
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="brand-active"
                checked={brandActive}
                onCheckedChange={setBrandActive}
              />
              <Label htmlFor="brand-active">Marca ativa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : editingBrand ? (
                'Salvar'
              ) : (
                'Criar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
