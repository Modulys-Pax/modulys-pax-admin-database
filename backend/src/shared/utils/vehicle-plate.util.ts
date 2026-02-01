/**
 * Retorna a placa principal do veículo:
 * CAVALO se existir, senão a primeira placa da lista.
 * Usado para exibição, pastas de documento e relatórios.
 */
export function getPrimaryPlate(vehicle: { plates?: { type: string; plate: string }[] }): string {
  const plates = vehicle.plates ?? [];
  const cavalo = plates.find((p) => p.type === 'CAVALO');
  if (cavalo) return cavalo.plate;
  if (plates.length > 0) return plates[0].plate;
  return '';
}
