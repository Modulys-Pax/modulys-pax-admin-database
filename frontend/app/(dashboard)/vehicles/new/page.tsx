'use client';

import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { vehicleApi, CreateVehicleDto, VEHICLE_PLATE_TYPES, type VehiclePlateType } from '@/lib/api/vehicle';
import { vehicleBrandApi } from '@/lib/api/vehicle-brand';
import { vehicleModelApi } from '@/lib/api/vehicle-model';
import { useEffectiveBranch } from '@/lib/hooks/use-effective-branch';
import { DEFAULT_COMPANY_ID } from '@/lib/constants/company.constants';
import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { toSelectOptions } from '@/lib/hooks/use-searchable-select';
import { Plus, Trash2 } from 'lucide-react';

const PLATE_TYPE_LABELS: Record<VehiclePlateType, string> = {
  CAVALO: 'Cavalo',
  PRIMEIRA_CARRETA: 'Primeira carreta',
  DOLLY: 'Dolly',
  SEGUNDA_CARRETA: 'Segunda carreta',
};

const vehicleSchema = z
  .object({
    plates: z
      .array(
        z.object({
          type: z.enum(VEHICLE_PLATE_TYPES as unknown as [string, ...string[]]),
          plate: z.string().min(1, 'Placa é obrigatória'),
        }),
      )
      .min(1, 'Informe pelo menos uma placa'),
    brandId: z.string().uuid('Selecione uma marca').optional().or(z.literal('')),
    modelId: z.string().uuid('Selecione um modelo').optional().or(z.literal('')),
    year: z.coerce.number().int().min(1900).max(2100).optional().or(z.nan()),
    color: z.string().optional(),
    chassis: z.string().optional(),
    renavam: z.string().optional(),
    currentKm: z.coerce.number().int().min(0).optional().or(z.nan()),
    status: z.enum(['ACTIVE', 'MAINTENANCE', 'STOPPED']).optional(),
    branchId: z.string().uuid('Selecione uma filial').optional(),
    active: z.boolean().default(true),
    replacementItems: z
      .array(
        z.object({
          name: z.string().optional(),
          replaceEveryKm: z.coerce.number().int().min(1, 'Troca em KM deve ser pelo menos 1').optional().or(z.nan()),
        }),
      )
      .optional()
      .default([]),
  })
  .refine(
    (data) => {
      const types = data.plates.map((p) => p.type);
      return new Set(types).size === types.length;
    },
    { message: 'Não repita o mesmo tipo (cavalo, carreta, dolly)', path: ['plates'] },
  );

type VehicleFormData = z.infer<typeof vehicleSchema>;

export default function NewVehiclePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { branchId: effectiveBranchId } = useEffectiveBranch();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      plates: [{ type: 'CAVALO', plate: '' }],
      replacementItems: [],
      active: true,
      branchId: effectiveBranchId || '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'plates',
  });

  const {
    fields: replacementFields,
    append: appendReplacement,
    remove: removeReplacement,
  } = useFieldArray({ control, name: 'replacementItems' });

  const selectedBrandId = watch('brandId');

  useEffect(() => {
    if (effectiveBranchId) {
      setValue('branchId', effectiveBranchId);
    }
  }, [effectiveBranchId, setValue]);

  const { data: brands = [] } = useQuery({
    queryKey: ['vehicle-brands'],
    queryFn: () => vehicleBrandApi.getAll(),
  });

  const { data: models = [] } = useQuery({
    queryKey: ['vehicle-models', selectedBrandId],
    queryFn: () => vehicleModelApi.getAll(selectedBrandId || undefined),
    enabled: !!selectedBrandId,
  });

  useEffect(() => {
    if (selectedBrandId) {
      setValue('modelId', '');
    }
  }, [selectedBrandId, setValue]);

  const createMutation = useMutation({
    mutationFn: (data: CreateVehicleDto) => vehicleApi.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      await queryClient.refetchQueries({ queryKey: ['vehicles'] });
      router.push('/vehicles');
    },
  });

  const onSubmit = (data: VehicleFormData) => {
    if (!effectiveBranchId) return;

    const submitData: CreateVehicleDto = {
      plates: data.plates.map((p) => ({ type: p.type as VehiclePlateType, plate: p.plate.trim() })),
      replacementItems:
        data.replacementItems?.filter((r) => r.name?.trim()).length
          ? data.replacementItems
              .filter((r) => r.name?.trim())
              .map((r) => ({
                name: r.name!.trim(),
                replaceEveryKm: Number(r.replaceEveryKm),
              }))
          : undefined,
      companyId: DEFAULT_COMPANY_ID,
      brandId: data.brandId || undefined,
      modelId: data.modelId || undefined,
      year: isNaN(data.year as number) ? undefined : data.year,
      color: data.color || undefined,
      chassis: data.chassis || undefined,
      renavam: data.renavam || undefined,
      currentKm: isNaN(data.currentKm as number) ? undefined : data.currentKm,
      status: data.status || 'ACTIVE',
      branchId: effectiveBranchId,
      active: data.active,
    };
    createMutation.mutate(submitData);
  };

  const plateTypeOptions = VEHICLE_PLATE_TYPES.map((t) => ({
    value: t,
    label: PLATE_TYPE_LABELS[t],
  }));

  const usedTypes = watch('plates').map((p) => p.type);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Veículo"
        subtitle="Cadastre um novo veículo (cavalo, carretas, dolly)"
      />

      <SectionCard title="Dados do Veículo">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm text-muted-foreground">
                Placas (cavalo, carretas, dolly) *
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const next = VEHICLE_PLATE_TYPES.find((t) => !usedTypes.includes(t));
                  if (next) append({ type: next, plate: '' });
                }}
                disabled={fields.length >= VEHICLE_PLATE_TYPES.length}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar placa
              </Button>
            </div>
            {errors.plates?.message && typeof errors.plates.message === 'string' && (
              <p className="text-sm text-destructive mb-2">{errors.plates.message}</p>
            )}
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex gap-2 items-end flex-wrap rounded-xl border border-border p-3 bg-muted/30"
                >
                  <div className="flex-1 min-w-[140px]">
                    <Label className="text-xs text-muted-foreground">Tipo</Label>
                    <SearchableSelect
                      options={plateTypeOptions.filter(
                        (o) => usedTypes[index] === o.value || !usedTypes.filter((_, i) => i !== index).includes(o.value),
                      )}
                      value={watch(`plates.${index}.type`)}
                      onChange={(value) => setValue(`plates.${index}.type`, value as VehiclePlateType, { shouldValidate: true })}
                      placeholder="Tipo"
                      error={!!errors.plates?.[index]?.type}
                    />
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <Label className="text-xs text-muted-foreground">Placa</Label>
                    <Input
                      {...register(`plates.${index}.plate`)}
                      placeholder="ABC1D23"
                      className={errors.plates?.[index]?.plate ? 'border-destructive' : 'rounded-xl'}
                    />
                    {errors.plates?.[index]?.plate && (
                      <p className="text-xs text-destructive mt-0.5">
                        {errors.plates[index]?.plate?.message}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm text-muted-foreground">
                Itens para troca por KM (opcional)
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendReplacement({ name: '', replaceEveryKm: 10000 })}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar item
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Itens que serão trocados a cada X KM neste veículo (ex: Óleo Motor, Filtro de óleo). Aparecem em &quot;Próximas trocas&quot; e nas etiquetas. Não usam estoque.
            </p>
            <div className="space-y-3">
              {replacementFields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex gap-2 items-end flex-wrap rounded-xl border border-border p-3 bg-muted/30"
                >
                  <div className="flex-1 min-w-[200px]">
                    <Label className="text-xs text-muted-foreground">Nome do item</Label>
                    <Input
                      {...register(`replacementItems.${index}.name`)}
                      placeholder="Ex: Óleo Motor 15W40"
                      className={errors.replacementItems?.[index]?.name ? 'border-destructive' : 'rounded-xl'}
                    />
                    {errors.replacementItems?.[index]?.name && (
                      <p className="text-xs text-destructive mt-0.5">
                        {errors.replacementItems[index]?.name?.message}
                      </p>
                    )}
                  </div>
                  <div className="w-32">
                    <Label className="text-xs text-muted-foreground">Troca a cada (KM)</Label>
                    <Input
                      type="number"
                      min={1}
                      placeholder="10000"
                      {...register(`replacementItems.${index}.replaceEveryKm`, {
                        valueAsNumber: true,
                      })}
                      className={errors.replacementItems?.[index]?.replaceEveryKm ? 'border-destructive' : 'rounded-xl'}
                    />
                    {errors.replacementItems?.[index]?.replaceEveryKm && (
                      <p className="text-xs text-destructive mt-0.5">
                        {errors.replacementItems[index]?.replaceEveryKm?.message}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeReplacement(index)}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brandId" className="text-sm text-muted-foreground mb-2">
                Marca
              </Label>
              <SearchableSelect
                id="brandId"
                options={toSelectOptions(brands, (b) => b.id, (b) => b.name)}
                value={watch('brandId') || ''}
                onChange={(value) => {
                  setValue('brandId', value || '', { shouldValidate: true });
                  setValue('modelId', '', { shouldValidate: true });
                }}
                placeholder="Selecione uma marca"
                error={!!errors.brandId}
              />
              {errors.brandId && (
                <p className="text-sm text-destructive mt-1">{errors.brandId.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="modelId" className="text-sm text-muted-foreground mb-2">
                Modelo
              </Label>
              <SearchableSelect
                id="modelId"
                options={toSelectOptions(models, (m) => m.id, (m) => m.name)}
                value={watch('modelId') || ''}
                onChange={(value) => setValue('modelId', value || '', { shouldValidate: true })}
                placeholder={selectedBrandId ? 'Selecione um modelo' : 'Selecione primeiro uma marca'}
                disabled={!selectedBrandId}
                error={!!errors.modelId}
              />
              {errors.modelId && (
                <p className="text-sm text-destructive mt-1">{errors.modelId.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year" className="text-sm text-muted-foreground mb-2">
                Ano
              </Label>
              <Input
                id="year"
                type="number"
                {...register('year', { valueAsNumber: true })}
                className="rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="color" className="text-sm text-muted-foreground mb-2">
                Cor
              </Label>
              <Input id="color" {...register('color')} className="rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="chassis" className="text-sm text-muted-foreground mb-2">
                Chassi
              </Label>
              <Input id="chassis" {...register('chassis')} className="rounded-xl" />
            </div>
            <div>
              <Label htmlFor="renavam" className="text-sm text-muted-foreground mb-2">
                RENAVAM
              </Label>
              <Input id="renavam" {...register('renavam')} className="rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currentKm" className="text-sm text-muted-foreground mb-2">
                Quilometragem Atual
              </Label>
              <Input
                id="currentKm"
                type="number"
                {...register('currentKm', { valueAsNumber: true })}
                className="rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="status" className="text-sm text-muted-foreground mb-2">
                Status
              </Label>
              <SearchableSelect
                id="status"
                options={[
                  { value: 'ACTIVE', label: 'Em Operação' },
                  { value: 'MAINTENANCE', label: 'Em Manutenção' },
                  { value: 'STOPPED', label: 'Parado' },
                ]}
                value={watch('status') || ''}
                onChange={(value) =>
                  setValue('status', value as 'ACTIVE' | 'MAINTENANCE' | 'STOPPED' | undefined, {
                    shouldValidate: true,
                  })
                }
                placeholder="Selecione o status"
                error={!!errors.status}
              />
              {errors.status && (
                <p className="text-sm text-destructive mt-1">{errors.status.message}</p>
              )}
            </div>
          </div>

          <input type="hidden" {...register('branchId')} value={effectiveBranchId || ''} />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              {...register('active')}
              className="rounded border-border"
            />
            <Label htmlFor="active" className="text-sm text-muted-foreground cursor-pointer">
              Veículo ativo
            </Label>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
