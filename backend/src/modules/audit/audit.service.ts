import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { AuditLogFilterDto } from './dto/audit-log-filter.dto';
import { AuditLogResponseDto, AuditLogListResponseDto } from './dto/audit-log-response.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async create(createAuditLogDto: CreateAuditLogDto): Promise<AuditLogResponseDto> {
    const auditLog = await this.prisma.auditLog.create({
      data: {
        entityType: createAuditLogDto.entityType,
        entityId: createAuditLogDto.entityId,
        action: createAuditLogDto.action,
        userId: createAuditLogDto.userId,
        userName: createAuditLogDto.userName,
        userEmail: createAuditLogDto.userEmail,
        companyId: createAuditLogDto.companyId,
        branchId: createAuditLogDto.branchId,
        oldValues: createAuditLogDto.oldValues
          ? (createAuditLogDto.oldValues as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        newValues: createAuditLogDto.newValues
          ? (createAuditLogDto.newValues as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        changes: createAuditLogDto.changes
          ? (createAuditLogDto.changes as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        ipAddress: createAuditLogDto.ipAddress,
        userAgent: createAuditLogDto.userAgent,
        description: createAuditLogDto.description,
      },
    });

    return this.mapToResponse(auditLog);
  }

  async findAll(filter: AuditLogFilterDto): Promise<AuditLogListResponseDto> {
    const page = filter.page ? Number(filter.page) : 1;
    const limit = filter.limit ? Number(filter.limit) : 50;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (filter.entityType) {
      where.entityType = filter.entityType;
    }

    if (filter.entityId) {
      where.entityId = filter.entityId;
    }

    if (filter.action) {
      where.action = filter.action;
    }

    if (filter.userId) {
      where.userId = filter.userId;
    }

    if (filter.companyId) {
      where.companyId = filter.companyId;
    }

    if (filter.branchId) {
      where.branchId = filter.branchId;
    }

    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) {
        where.createdAt.gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        where.createdAt.lte = new Date(filter.endDate);
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: data.map((log) => this.mapToResponse(log)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByEntity(
    entityType: string,
    entityId: string,
    page: number | string = 1,
    limit: number | string = 50,
  ): Promise<AuditLogListResponseDto> {
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.AuditLogWhereInput = {
      entityType,
      entityId,
    };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: data.map((log) => this.mapToResponse(log)),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  async findOne(id: string): Promise<AuditLogResponseDto> {
    const auditLog = await this.prisma.auditLog.findUnique({
      where: { id },
    });

    if (!auditLog) {
      throw new NotFoundException('Log de auditoria não encontrado');
    }

    return this.mapToResponse(auditLog);
  }

  private mapToResponse(auditLog: any): AuditLogResponseDto {
    return {
      id: auditLog.id,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      action: auditLog.action,
      userId: auditLog.userId,
      userName: auditLog.userName,
      userEmail: auditLog.userEmail,
      companyId: auditLog.companyId,
      branchId: auditLog.branchId,
      oldValues: auditLog.oldValues,
      newValues: auditLog.newValues,
      changes: auditLog.changes,
      ipAddress: auditLog.ipAddress,
      userAgent: auditLog.userAgent,
      description: auditLog.description,
      createdAt: auditLog.createdAt,
    };
  }
}
