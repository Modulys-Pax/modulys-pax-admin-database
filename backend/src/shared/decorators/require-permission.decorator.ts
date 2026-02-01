import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';

/**
 * Decorator para exigir uma permissão específica em um endpoint.
 * O admin (role.name === 'ADMIN') tem bypass automático.
 *
 * Uso:
 * @RequirePermission('vehicles.create')
 * @Post()
 * create() { ... }
 *
 * @param permission - Nome da permissão no formato 'modulo.acao'
 */
export const RequirePermission = (permission: string) => SetMetadata(PERMISSION_KEY, permission);
