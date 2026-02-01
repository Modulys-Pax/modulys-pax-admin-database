import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Interceptor que força o branchId do usuário quando não é admin
 *
 * Para usuários não-admin:
 * - Substitui qualquer branchId no query params pelo branchId do usuário
 * - Substitui qualquer branchId no body pelo branchId do usuário
 * - Garante que não-admin só acessa/cria dados da própria filial
 *
 * Para admin:
 * - Permite usar qualquer branchId (ou null para todas as filiais)
 */
@Injectable()
export class BranchFilterInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Se não houver usuário autenticado, não fazer nada
    if (!user) {
      return next.handle();
    }

    // Verificar se é admin (role em minúsculo é 'admin')
    const isAdmin = user.role?.toLowerCase() === 'admin';

    // Se não for admin e tiver branchId no usuário, forçar o branchId
    if (!isAdmin && user.branchId) {
      // Substituir branchId no query params (para GET requests)
      if (request.query && request.query.branchId) {
        request.query.branchId = user.branchId;
      }

      // Substituir branchId no body (para POST/PATCH/PUT requests)
      if (request.body && request.body.branchId) {
        request.body.branchId = user.branchId;
      }
    }

    return next.handle();
  }
}
