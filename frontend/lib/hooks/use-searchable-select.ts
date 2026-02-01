import { useController, Control, FieldValues, Path } from 'react-hook-form';
import { SearchableSelectOption } from '@/components/ui/searchable-select';

/**
 * Hook para usar SearchableSelect com react-hook-form
 */
export function useSearchableSelect<TFieldValues extends FieldValues>(
  control: Control<TFieldValues>,
  name: Path<TFieldValues>,
) {
  const {
    field: { value, onChange, ...field },
    fieldState: { error },
  } = useController({
    control,
    name,
  });

  return {
    value: value || '',
    onChange,
    error: !!error,
    ...field,
  };
}

/**
 * Converte um array de objetos em opções para SearchableSelect
 */
export function toSelectOptions<T>(
  items: T[],
  getValue: (item: T) => string,
  getLabel: (item: T) => string,
  getDisabled?: (item: T) => boolean,
): SearchableSelectOption[] {
  return items.map((item) => ({
    value: getValue(item),
    label: getLabel(item),
    disabled: getDisabled ? getDisabled(item) : false,
  }));
}
