import { Injectable } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditHelperService {
  constructor(private auditService: AuditService) {}

  async logAction(params: {
    entityType: string;
    entityId: string;
    action: AuditAction;
    userId?: string;
    userName?: string;
    userEmail?: string;
    companyId?: string;
    branchId?: string;
    oldValues?: any;
    newValues?: any;
    description?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      // Calcular mudanças se for UPDATE
      const changes =
        params.action === AuditAction.UPDATE && params.oldValues && params.newValues
          ? this.calculateChanges(params.oldValues, params.newValues)
          : null;

      await this.auditService.create({
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        userId: params.userId,
        userName: params.userName,
        userEmail: params.userEmail,
        companyId: params.companyId,
        branchId: params.branchId,
        oldValues: params.oldValues,
        newValues: params.newValues,
        changes,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        description: params.description,
      });
    } catch (error) {
      // Não falhar a operação se o log de auditoria falhar
      console.error('Erro ao criar log de auditoria:', error);
    }
  }

  private calculateChanges(oldValues: any, newValues: any): any {
    if (!oldValues || !newValues) {
      return null;
    }

    const changes: any = {};
    for (const key in newValues) {
      // Ignorar campos de auditoria e timestamps
      if (['createdAt', 'updatedAt', 'createdBy', 'deletedAt'].includes(key)) {
        continue;
      }

      if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
        changes[key] = {
          old: oldValues[key],
          new: newValues[key],
        };
      }
    }
    return Object.keys(changes).length > 0 ? changes : null;
  }
}
