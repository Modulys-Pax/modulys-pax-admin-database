'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  maintenanceLabelApi,
  RegisterProductChangeDto,
} from '@/lib/api/maintenance-label';
import { maintenanceApi } from '@/lib/api/maintenance';
import { vehicleApi } from '@/lib/api/vehicle';
import { useEffectiveBranch } from '@/lib/hooks/use-effective-branch';
import { DEFAULT_COMPANY_ID } from '@/lib/constants/company.constants';
import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { toSelectOptions } from '@/lib/hooks/use-searchable-select';
import { toastErrorFromException, toastSuccess } from '@/lib/utils';
import { roundCurrency } from '@/lib/utils/numbers';
import { Plus, Trash2 } from 'lucide-react';

type FormData = {
  vehicleId: string;
  changeKm: string;
  serviceDate: string; // YYYY-MM-DD
  items: Array<{
    vehicleReplacementItemId: string;
    cost: string | number; // CurrencyInput pode setar number
  }>;
};

const defaultItem: FormData['items'][0] = {
  vehicleReplacementItemId: '',
  cost: '',
};

export default function NewProductChangePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { branchId: effectiveBranchId } = useEffectiveBranch();

  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { watch, setValue, register, handleSubmit, control } = useForm<FormData>({
    defaultValues: {
      vehicleId: '',
      changeKm: '',
      serviceDate: '',
      items: [defaultItem],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const selectedVehicleId = watch('vehicleId');

  const { data: vehiclesResponse } = useQuery({
    queryKey: ['vehicles', effectiveBranchId],
    queryFn: () =>
      vehicleApi.getAll(effectiveBranchId || undefined, false, 1, 1000),
    enabled: !!effectiveBranchId,
  });

  const vehicles = vehiclesResponse?.data || [];

  const { data: selectedVehicle } = useQuery({
    queryKey: ['vehicles', selectedVehicleId],
    queryFn: () => vehicleApi.getById(selectedVehicleId),
    enabled: !!selectedVehicleId,
  });

  const replacementItems = selectedVehicle?.replacementItems ?? [];

  const items = watch('items');
  const totalCost = items.reduce((sum, item) => {
    const raw = item.cost;
    const c =
      raw != null && raw !== ''
        ? Number(typeof raw === 'number' ? raw : String(raw).replace(',', '.'))
        : 0;
    return sum + (Number.isFinite(c) && c >= 0 ? c : 0);
  }, 0);

  const registerMutation = useMutation({
    mutationFn: (data: RegisterProductChangeDto) =>
      maintenanceLabelApi.registerProductChange(data),
    onError: (error) => {
      toastErrorFromException(error, 'Erro ao registrar troca');
    },
  });

  const onSubmit = (data: FormData) => {
    if (!effectiveBranchId) {
      toastErrorFromException(
        new Error('Por favor, selecione uma filial na sidebar'),
        'Filial não selecionada',
      );
      return;
    }

    if (!data.vehicleId) {
      toastErrorFromException(new Error('Selecione um veículo'), 'Veículo obrigatório');
      return;
    }

    const changeKmNum = data.changeKm?.trim()
      ? Number(String(data.changeKm).replace(/\D/g, ''))
      : NaN;
    if (!Number.isFinite(changeKmNum) || changeKmNum < 0) {
      toastErrorFromException(
        new Error('Informe uma quilometragem válida'),
        'KM inválido',
      );
      return;
    }

    const validItems = data.items.filter(
      (i) => i.vehicleReplacementItemId && i.vehicleReplacementItemId.length > 0,
    );
    if (validItems.length === 0) {
      toastErrorFromException(
        new Error('Adicione pelo menos um item trocado'),
        'Itens obrigatórios',
      );
      return;
    }

    const payload: RegisterProductChangeDto = {
      vehicleId: data.vehicleId,
      changeKm: Math.round(changeKmNum),
      items: validItems.map((i) => {
        const raw = i.cost;
        const costNum =
          raw != null && raw !== ''
            ? Number(typeof raw === 'number' ? raw : String(raw).replace(',', '.'))
            : undefined;
        return {
          vehicleReplacementItemId: i.vehicleReplacementItemId,
          cost:
            costNum !== undefined &&
            Number.isFinite(costNum) &&
            costNum >= 0
              ? roundCurrency(costNum)
              : undefined,
        };
      }),
      serviceDate: data.serviceDate?.trim()
        ? data.serviceDate.trim()
        : undefined,
      companyId: DEFAULT_COMPANY_ID,
      branchId: effectiveBranchId,
    };

    (async () => {
      try {
        const result = await registerMutation.mutateAsync(payload);
        // Ler o arquivo do input no momento do envio (evita state desatualizado)
        const fileToUpload = fileInputRef.current?.files?.[0] ?? attachmentFile;
        if (fileToUpload && fileToUpload.size > 0) {
          await maintenanceApi.uploadAttachment(result.orderId, fileToUpload);
        }
        queryClient.invalidateQueries({ queryKey: ['maintenanceLabels'] });
        queryClient.invalidateQueries({ queryKey: ['vehicles'] });
        queryClient.invalidateQueries({ queryKey: ['maintenanceDue'] });
        queryClient.invalidateQueries({ queryKey: ['vehicle-costs'] });
        queryClient.invalidateQueries({ queryKey: ['maintenance'] });
        queryClient.invalidateQueries({ queryKey: ['account-payable'] });
        toastSuccess('Troca registrada com sucesso');
        router.push('/product-changes');
      } catch {
        // erro já tratado em onError
      }
    })();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registrar Troca na Estrada"
        subtitle="Registre os itens que foram trocados na estrada (um ou mais)"
      />

      <SectionCard title="Dados da Troca">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="vehicle" className="text-sm text-muted-foreground mb-2 block">
              Veículo *
            </Label>
            <SearchableSelect
              id="vehicle"
              options={toSelectOptions(
                vehicles.filter((v) => v.active),
                (v) => v.id,
                (v) =>
                  `${v.plate}${v.brandName || v.modelName ? ` - ${v.brandName || ''} ${v.modelName || ''}`.trim() : ''}`,
              )}
              value={watch('vehicleId')}
              onChange={(value) => {
                setValue('vehicleId', value || '');
                setValue('items', [{ ...defaultItem }]);
              }}
              placeholder="Selecione um veículo"
              disabled={!effectiveBranchId || registerMutation.isPending}
            />
          </div>

          <div>
            <Label htmlFor="changeKm" className="text-sm text-muted-foreground mb-2 block">
              Quilometragem da Troca (KM) *
            </Label>
            <Input
              id="changeKm"
              type="text"
              inputMode="numeric"
              placeholder="Ex: 60000"
              className="rounded-xl"
              disabled={registerMutation.isPending}
              {...register('changeKm')}
            />
            <p className="text-xs text-muted-foreground mt-1">
              KM em que os itens foram trocados na estrada
            </p>
          </div>

          <div>
            <Label htmlFor="serviceDate" className="text-sm text-muted-foreground mb-2 block">
              Data de realização do serviço
            </Label>
            <Input
              id="serviceDate"
              type="date"
              className="rounded-xl"
              disabled={registerMutation.isPending}
              {...register('serviceDate')}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Data em que o serviço foi realizado na rua (opcional)
            </p>
          </div>

          <div>
            <Label htmlFor="attachment" className="text-sm text-muted-foreground mb-2 block">
              Anexar nota (PDF ou imagem)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="attachment"
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/*"
                className="rounded-xl max-w-xs"
                disabled={registerMutation.isPending}
                onChange={(e) => setAttachmentFile(e.target.files?.[0] ?? null)}
              />
              {attachmentFile && (
                <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                  {attachmentFile.name}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Nota de terceiro (ex.: oficina na estrada). Você poderá visualizar o anexo depois na ordem de manutenção.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm text-muted-foreground">
                Itens trocados *
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ ...defaultItem })}
                disabled={
                  !selectedVehicleId ||
                  replacementItems.length === 0 ||
                  registerMutation.isPending
                }
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar item
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => {
                const costVal = watch(`items.${index}.cost`);
                const costNum =
                  costVal != null && costVal !== ''
                    ? Number(
                        typeof costVal === 'number'
                          ? costVal
                          : String(costVal).replace(',', '.'),
                      )
                    : undefined;
                return (
                <div
                  key={field.id}
                  className="flex gap-3 items-end p-3 border rounded-xl bg-muted/30"
                >
                  <div className="flex-1 min-w-0">
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Item
                    </Label>
                    <SearchableSelect
                      options={replacementItems.map((r) => ({
                        value: r.id,
                        label: `${r.name} (Troca a cada ${r.replaceEveryKm.toLocaleString('pt-BR')} KM)`,
                      }))}
                      value={watch(`items.${index}.vehicleReplacementItemId`)}
                      onChange={(value) =>
                        setValue(`items.${index}.vehicleReplacementItemId`, value || '')
                      }
                      placeholder="Selecione o item"
                      disabled={
                        !selectedVehicleId ||
                        replacementItems.length === 0 ||
                        registerMutation.isPending
                      }
                    />
                  </div>
                  <div className="w-40">
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Custo (R$)
                    </Label>
                    <CurrencyInput
                      placeholder="0,00"
                      className="rounded-xl"
                      disabled={registerMutation.isPending}
                      value={costNum !== undefined && !Number.isNaN(costNum) ? costNum : undefined}
                      onChange={(value) =>
                        setValue(`items.${index}.cost`, value ?? '', {
                          shouldValidate: true,
                        })
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1 || registerMutation.isPending}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
              })}
            </div>
            {replacementItems.length === 0 && selectedVehicleId && (
              <p className="text-sm text-muted-foreground mt-1">
                Este veículo não tem itens de troca por KM configurados. Configure na
                edição do veículo.
              </p>
            )}
          </div>

          {items.length > 0 && (
            <div className="flex justify-end py-2">
              <span className="text-sm font-medium text-foreground">
                Total: R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                registerMutation.isPending ||
                !effectiveBranchId ||
                !watch('vehicleId') ||
                !watch('changeKm')?.trim() ||
                validItemsLength(watch('items')) === 0
              }
            >
              {registerMutation.isPending ? 'Registrando...' : 'Registrar Troca'}
            </Button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}

function validItemsLength(items: FormData['items']): number {
  return items.filter(
    (i) => i.vehicleReplacementItemId && i.vehicleReplacementItemId.length > 0,
  ).length;
}
