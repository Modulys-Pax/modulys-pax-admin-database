import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obter a permissão requerida do decorator
    const requiredPermission = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Se não houver permissão requerida, permitir acesso
    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Se não houver usuário autenticado, negar acesso
    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    // ADMIN tem bypass automático - acesso total
    if (user.role === 'ADMIN') {
      return true;
    }

    // Verificar se o usuário possui a permissão requerida
    const userPermissions: string[] = user.permissions || [];

    if (!userPermissions.includes(requiredPermission)) {
      throw new ForbiddenException(
        `Você não tem permissão para realizar esta ação. Permissão necessária: ${requiredPermission}`,
      );
    }

    return true;
  }
}
