import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateEmployeeBenefitDto } from './dto/create-employee-benefit.dto';
import { UpdateEmployeeBenefitDto } from './dto/update-employee-benefit.dto';
import { EmployeeBenefitResponseDto } from './dto/employee-benefit-response.dto';
import { Prisma } from '@prisma/client';
import { DEFAULT_COMPANY_ID } from '../../shared/constants/company.constants';

@Injectable()
export class EmployeeBenefitService {
  constructor(private prisma: PrismaService) {}

  async create(
    createDto: CreateEmployeeBenefitDto,
    userId?: string,
  ): Promise<EmployeeBenefitResponseDto> {
    const companyId = DEFAULT_COMPANY_ID;

    // Verificar se funcionário existe
    const employee = await this.prisma.employee.findFirst({
      where: {
        id: createDto.employeeId,
        companyId,
        branchId: createDto.branchId,
        deletedAt: null,
      },
    });

    if (!employee) {
      throw new NotFoundException('Funcionário não encontrado');
    }

    // Verificar se benefício existe e está ativo
    const benefit = await this.prisma.benefit.findFirst({
      where: {
        id: createDto.benefitId,
        companyId,
        branchId: createDto.branchId,
        deletedAt: null,
        active: true,
      },
    });

    if (!benefit) {
      throw new NotFoundException('Benefício não encontrado ou inativo');
    }

    // Verificar se funcionário já tem este benefício ativo
    const existing = await this.prisma.employeeBenefit.findFirst({
      where: {
        employeeId: createDto.employeeId,
        benefitId: createDto.benefitId,
        active: true,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException('Funcionário já possui este benefício ativo');
    }

    const employeeBenefit = await this.prisma.employeeBenefit.create({
      data: {
        employeeId: createDto.employeeId,
        benefitId: createDto.benefitId,
        active: createDto.active !== undefined ? createDto.active : true,
        startDate: createDto.startDate ? new Date(createDto.startDate) : undefined,
        companyId,
        branchId: createDto.branchId,
        createdBy: userId,
      },
      include: {
        benefit: true,
      },
    });

    return this.mapToResponse(employeeBenefit);
  }

  async findAll(
    employeeId?: string,
    branchId?: string,
    active?: boolean,
  ): Promise<EmployeeBenefitResponseDto[]> {
    const companyId = DEFAULT_COMPANY_ID;

    const where: Prisma.EmployeeBenefitWhereInput = {
      companyId,
      deletedAt: null,
      ...(employeeId ? { employeeId } : {}),
      ...(branchId ? { branchId } : {}),
      ...(active !== undefined ? { active } : {}),
    };

    const benefits = await this.prisma.employeeBenefit.findMany({
      where,
      include: {
        benefit: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return benefits.map((benefit) => this.mapToResponse(benefit));
  }

  async findOne(id: string): Promise<EmployeeBenefitResponseDto> {
    const benefit = await this.prisma.employeeBenefit.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        benefit: true,
      },
    });

    if (!benefit) {
      throw new NotFoundException('Benefício não encontrado');
    }

    return this.mapToResponse(benefit);
  }

  async update(
    id: string,
    updateDto: UpdateEmployeeBenefitDto,
  ): Promise<EmployeeBenefitResponseDto> {
    const existing = await this.prisma.employeeBenefit.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException('Benefício não encontrado');
    }

    const updateData: any = { ...updateDto };
    if (updateDto.startDate) {
      updateData.startDate = new Date(updateDto.startDate);
    }

    // Se estiver alterando o benefício, verificar se existe
    if (updateDto.benefitId) {
      const benefit = await this.prisma.benefit.findFirst({
        where: {
          id: updateDto.benefitId,
          deletedAt: null,
          active: true,
        },
      });

      if (!benefit) {
        throw new NotFoundException('Benefício não encontrado ou inativo');
      }
    }

    const employeeBenefit = await this.prisma.employeeBenefit.update({
      where: { id },
      data: updateData,
      include: {
        benefit: true,
      },
    });

    return this.mapToResponse(employeeBenefit);
  }

  async remove(id: string): Promise<void> {
    const benefit = await this.prisma.employeeBenefit.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!benefit) {
      throw new NotFoundException('Benefício não encontrado');
    }

    await this.prisma.employeeBenefit.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private mapToResponse(employeeBenefit: any): EmployeeBenefitResponseDto {
    return {
      id: employeeBenefit.id,
      employeeId: employeeBenefit.employeeId,
      benefitId: employeeBenefit.benefitId,
      benefit: {
        id: employeeBenefit.benefit.id,
        name: employeeBenefit.benefit.name,
        dailyCost: Number(employeeBenefit.benefit.dailyCost),
        employeeValue: Number(employeeBenefit.benefit.employeeValue),
        includeWeekends: employeeBenefit.benefit.includeWeekends,
        description: employeeBenefit.benefit.description,
      },
      active: employeeBenefit.active,
      startDate: employeeBenefit.startDate,
      companyId: employeeBenefit.companyId,
      branchId: employeeBenefit.branchId,
      createdAt: employeeBenefit.createdAt,
      updatedAt: employeeBenefit.updatedAt,
      createdBy: employeeBenefit.createdBy,
      deletedAt: employeeBenefit.deletedAt,
    };
  }
}
