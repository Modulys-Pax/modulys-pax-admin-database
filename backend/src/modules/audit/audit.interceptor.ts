import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';
import { AuditAction } from '@prisma/client';
import {
  shouldSkip,
  getEntityType,
  getSubRouteDescription,
  getActionFromMethodAndPath,
} from './audit-path.helper';

/** Campos que nunca devem ser persistidos em audit log */
const SENSITIVE_KEYS = ['password', 'refreshToken', 'accessToken', 'token'];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const path = request.path || (request.url && request.url.split('?')[0]) || '';

    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    if (shouldSkip(path, method)) {
      return next.handle();
    }

    const body = request.body;
    const params = request.params;
    const user = request.user;

    const ipAddress =
      request.ip ||
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.connection?.remoteAddress;
    const userAgent = request.headers['user-agent'];

    return next.handle().pipe(
      tap(async (response) => {
        try {
          const { action, entityType, entityId, description, newValues, oldValues } =
            this.buildAuditPayload(path, method, body, params, response, user);

          const sanitizedNew = this.sanitize(newValues);
          const sanitizedOld = oldValues ? this.sanitize(oldValues) : null;
          const changes =
            action === AuditAction.UPDATE && sanitizedOld && sanitizedNew
              ? this.calculateChanges(sanitizedOld, sanitizedNew)
              : null;

          const userId = user?.sub ?? (path === '/auth/login' && response?.user?.id) ?? null;
          const userName =
            user?.name ?? user?.email ?? response?.user?.name ?? response?.user?.email ?? null;
          const userEmail = user?.email ?? response?.user?.email ?? null;
          const companyId = user?.companyId ?? body?.companyId ?? response?.user?.companyId ?? null;
          const branchId = user?.branchId ?? body?.branchId ?? response?.user?.branchId ?? null;

          await this.auditService.create({
            entityType,
            entityId: entityId ?? response?.id ?? 'unknown',
            action,
            userId,
            userName,
            userEmail,
            companyId,
            branchId,
            oldValues: sanitizedOld,
            newValues: action === AuditAction.DELETE ? null : sanitizedNew,
            changes,
            ipAddress,
            userAgent,
            description,
          });
        } catch (error) {
          console.error('Erro ao criar log de auditoria:', error);
        }
      }),
    );
  }

  private buildAuditPayload(
    path: string,
    method: string,
    body: any,
    params: any,
    response: any,
    user: any,
  ): {
    action: AuditAction;
    entityType: string;
    entityId: string | null;
    description: string;
    newValues: any;
    oldValues: any;
  } {
    if (method === 'POST' && path === '/auth/login') {
      return {
        action: AuditAction.LOGIN,
        entityType: 'Auth',
        entityId: response?.user?.id ?? 'session',
        description: 'Login realizado',
        newValues: response?.user
          ? { userId: response.user.id, email: response.user.email }
          : { email: body?.email },
        oldValues: null,
      };
    }

    const actionStr = getActionFromMethodAndPath(method, path);
    const action = this.mapToAuditAction(actionStr);
    const entityType = getEntityType(path);
    const entityId = params?.id ?? body?.id ?? null;
    const description = this.getDescription(path, action, entityType, entityId);

    const newValues: any = body ?? response;
    const oldValues: any = action === AuditAction.UPDATE ? body : null;

    return { action, entityType, entityId, description, newValues, oldValues };
  }

  private sanitize(obj: any): any {
    if (obj == null || typeof obj !== 'object') return obj;
    const out: any = Array.isArray(obj) ? [] : {};
    for (const key of Object.keys(obj)) {
      if (SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k.toLowerCase()))) continue;
      out[key] =
        typeof obj[key] === 'object' && obj[key] !== null ? this.sanitize(obj[key]) : obj[key];
    }
    return out;
  }

  private mapToAuditAction(actionStr: string): AuditAction {
    switch (actionStr) {
      case 'CREATE':
        return AuditAction.CREATE;
      case 'UPDATE':
        return AuditAction.UPDATE;
      case 'DELETE':
        return AuditAction.DELETE;
      case 'LOGIN':
        return AuditAction.LOGIN;
      default:
        return AuditAction.CREATE;
    }
  }

  private getDescription(
    path: string,
    action: AuditAction,
    entityType: string,
    entityId?: string | null,
  ): string {
    const sub = getSubRouteDescription(path);
    if (sub) return `${sub}${entityId ? ` (ID: ${entityId})` : ''}`;

    const actionText: Record<AuditAction, string> = {
      [AuditAction.CREATE]: 'Criado',
      [AuditAction.UPDATE]: 'Atualizado',
      [AuditAction.DELETE]: 'Excluído',
      [AuditAction.RESTORE]: 'Restaurado',
      [AuditAction.LOGIN]: 'Login realizado',
      [AuditAction.LOGOUT]: 'Logout realizado',
    };
    const text = actionText[action] ?? 'Modificado';
    return `${entityType} ${text}${entityId ? ` (ID: ${entityId})` : ''}`;
  }

  private calculateChanges(oldValues: any, newValues: any): any {
    if (
      !oldValues ||
      !newValues ||
      typeof oldValues !== 'object' ||
      typeof newValues !== 'object'
    ) {
      return null;
    }
    const changes: any = {};
    for (const key of Object.keys(newValues)) {
      if (SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k.toLowerCase()))) continue;
      if (['createdAt', 'updatedAt', 'createdBy', 'deletedAt'].includes(key)) continue;
      const oldVal = oldValues[key];
      const newVal = newValues[key];
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes[key] = { old: oldVal, new: newVal };
      }
    }
    return Object.keys(changes).length > 0 ? changes : null;
  }
}
