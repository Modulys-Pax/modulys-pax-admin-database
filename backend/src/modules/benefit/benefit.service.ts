import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateBenefitDto } from './dto/create-benefit.dto';
import { UpdateBenefitDto } from './dto/update-benefit.dto';
import { BenefitResponseDto } from './dto/benefit-response.dto';
import { Prisma } from '@prisma/client';
import { DEFAULT_COMPANY_ID } from '../../shared/constants/company.constants';
import { validateBranchAccess } from '../../shared/utils/branch-access.util';

@Injectable()
export class BenefitService {
  constructor(private prisma: PrismaService) {}

  async create(
    createDto: CreateBenefitDto,
    userId?: string,
    user?: any,
  ): Promise<BenefitResponseDto> {
    const companyId = DEFAULT_COMPANY_ID;

    // Validar acesso por filial (não-admin só cria na própria filial)
    // O interceptor já força o branchId no body, mas validamos aqui também por segurança
    if (user) {
      validateBranchAccess(user.branchId, user.role, createDto.branchId, undefined);
    }

    // Verificar se empresa e filial existem
    const company = await this.prisma.company.findFirst({
      where: {
        id: companyId,
        deletedAt: null,
      },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    const branch = await this.prisma.branch.findFirst({
      where: {
        id: createDto.branchId,
        companyId: companyId,
        deletedAt: null,
      },
    });

    if (!branch) {
      throw new NotFoundException('Filial não encontrada');
    }

    const benefit = await this.prisma.benefit.create({
      data: {
        name: createDto.name,
        dailyCost: new Prisma.Decimal(createDto.dailyCost),
        employeeValue: new Prisma.Decimal(createDto.employeeValue),
        includeWeekends: createDto.includeWeekends || false,
        description: createDto.description,
        active: createDto.active !== undefined ? createDto.active : true,
        companyId,
        branchId: createDto.branchId,
        createdBy: userId,
      },
    });

    return this.mapToResponse(benefit);
  }

  async findAll(branchId?: string, active?: boolean, page = 1, limit = 15): Promise<any> {
    const companyId = DEFAULT_COMPANY_ID;
    const skip = (page - 1) * limit;

    const where: Prisma.BenefitWhereInput = {
      companyId,
      deletedAt: null,
      ...(branchId ? { branchId } : {}),
      ...(active !== undefined ? { active } : {}),
    };

    const [benefits, total] = await Promise.all([
      this.prisma.benefit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.benefit.count({ where }),
    ]);

    return {
      data: benefits.map((benefit) => this.mapToResponse(benefit)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, user?: any): Promise<BenefitResponseDto> {
    const benefit = await this.prisma.benefit.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!benefit) {
      throw new NotFoundException('Benefício não encontrado');
    }

    // Validar acesso por filial (não-admin só acessa própria filial)
    if (user) {
      validateBranchAccess(user.branchId, user.role, undefined, benefit.branchId);
    }

    return this.mapToResponse(benefit);
  }

  async update(id: string, updateDto: UpdateBenefitDto, user?: any): Promise<BenefitResponseDto> {
    const existing = await this.prisma.benefit.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException('Benefício não encontrado');
    }

    // Validar acesso por filial (não-admin só acessa própria filial)
    if (user) {
      validateBranchAccess(user.branchId, user.role, updateDto.branchId, existing.branchId);
    }

    const updateData: any = { ...updateDto };
    if (updateDto.dailyCost !== undefined) {
      updateData.dailyCost = new Prisma.Decimal(updateDto.dailyCost);
    }
    if (updateDto.employeeValue !== undefined) {
      updateData.employeeValue = new Prisma.Decimal(updateDto.employeeValue);
    }

    const benefit = await this.prisma.benefit.update({
      where: { id },
      data: updateData,
    });

    return this.mapToResponse(benefit);
  }

  async remove(id: string, user?: any): Promise<void> {
    const benefit = await this.prisma.benefit.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        employeeBenefits: {
          where: {
            deletedAt: null,
            active: true,
          },
          take: 1,
        },
      },
    });

    if (!benefit) {
      throw new NotFoundException('Benefício não encontrado');
    }

    // Validar acesso por filial (não-admin só acessa própria filial)
    if (user) {
      validateBranchAccess(user.branchId, user.role, undefined, benefit.branchId);
    }

    // Verificar se há funcionários usando este benefício ativo
    if (benefit.employeeBenefits.length > 0) {
      throw new ConflictException(
        'Não é possível excluir um benefício que está sendo usado por funcionários. Desative o benefício ou remova as associações primeiro.',
      );
    }

    await this.prisma.benefit.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private mapToResponse(benefit: any): BenefitResponseDto {
    return {
      id: benefit.id,
      name: benefit.name,
      dailyCost: Number(benefit.dailyCost),
      employeeValue: Number(benefit.employeeValue),
      includeWeekends: benefit.includeWeekends,
      description: benefit.description,
      active: benefit.active,
      companyId: benefit.companyId,
      branchId: benefit.branchId,
      createdAt: benefit.createdAt,
      updatedAt: benefit.updatedAt,
      createdBy: benefit.createdBy,
      deletedAt: benefit.deletedAt,
    };
  }
}
