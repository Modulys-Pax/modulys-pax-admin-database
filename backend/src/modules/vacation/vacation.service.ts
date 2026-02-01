import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateVacationDto } from './dto/create-vacation.dto';
import { UpdateVacationDto, VacationStatus } from './dto/update-vacation.dto';
import { VacationResponseDto } from './dto/vacation-response.dto';
import { Prisma } from '@prisma/client';
import { DEFAULT_COMPANY_ID } from '../../shared/constants/company.constants';

@Injectable()
export class VacationService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateVacationDto, userId?: string): Promise<VacationResponseDto> {
    // Usar DEFAULT_COMPANY_ID (single-tenant)
    const companyId = DEFAULT_COMPANY_ID;

    // Verificar se empresa existe
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

    // Verificar se funcionário existe
    const employee = await this.prisma.employee.findFirst({
      where: {
        id: createDto.employeeId,
        companyId: companyId,
        branchId: createDto.branchId,
        deletedAt: null,
        active: true,
      },
    });

    if (!employee) {
      throw new NotFoundException('Funcionário não encontrado');
    }

    // Validar datas (adiciona T12:00:00 para evitar problema de timezone)
    const startDateStr = createDto.startDate.split('T')[0];
    const endDateStr = createDto.endDate.split('T')[0];
    const startDate = new Date(startDateStr + 'T12:00:00');
    const endDate = new Date(endDateStr + 'T12:00:00');

    if (startDate >= endDate) {
      throw new BadRequestException('Data de início deve ser anterior à data de término');
    }

    // Validar quantidade de dias
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (createDto.days !== diffDays) {
      throw new BadRequestException(
        `Quantidade de dias informada (${createDto.days}) não corresponde ao período entre as datas (${diffDays} dias)`,
      );
    }

    // Validar dias vendidos (abono pecuniário)
    const soldDays = createDto.soldDays || 0;
    if (soldDays > 10) {
      throw new BadRequestException('O máximo de dias que podem ser vendidos é 10');
    }

    if (soldDays > createDto.days) {
      throw new BadRequestException(
        'Quantidade de dias vendidos não pode ser maior que a quantidade total de dias de férias',
      );
    }

    // Verificar sobreposição de férias
    const overlappingVacation = await this.prisma.vacation.findFirst({
      where: {
        employeeId: createDto.employeeId,
        deletedAt: null,
        status: {
          notIn: ['CANCELLED'],
        },
        OR: [
          {
            startDate: {
              lte: endDate,
              gte: startDate,
            },
          },
          {
            endDate: {
              lte: endDate,
              gte: startDate,
            },
          },
          {
            AND: [
              {
                startDate: {
                  lte: startDate,
                },
              },
              {
                endDate: {
                  gte: endDate,
                },
              },
            ],
          },
        ],
      },
    });

    if (overlappingVacation) {
      throw new BadRequestException(
        'Já existe férias cadastrada para este funcionário no período informado',
      );
    }

    const vacation = await this.prisma.vacation.create({
      data: {
        employeeId: createDto.employeeId,
        startDate,
        endDate,
        days: createDto.days,
        soldDays: createDto.soldDays || 0,
        advance13thSalary: createDto.advance13thSalary || false,
        status: 'PLANNED',
        observations: createDto.observations,
        // Campos financeiros
        monthlySalary: createDto.monthlySalary,
        vacationBase: createDto.vacationBase,
        vacationThird: createDto.vacationThird,
        vacationTotal: createDto.vacationTotal,
        soldDaysValue: createDto.soldDaysValue,
        soldDaysThird: createDto.soldDaysThird,
        soldDaysTotal: createDto.soldDaysTotal,
        advance13thValue: createDto.advance13thValue,
        grossTotal: createDto.grossTotal,
        inss: createDto.inss,
        irrf: createDto.irrf,
        totalDeductions: createDto.totalDeductions,
        netTotal: createDto.netTotal,
        fgts: createDto.fgts,
        employerCost: createDto.employerCost,
        // Campos padrão
        companyId: companyId,
        branchId: createDto.branchId,
        createdBy: userId,
      },
      include: {
        employee: {
          select: {
            name: true,
          },
        },
      },
    });

    return this.mapToResponse(vacation);
  }

  async findAll(
    companyId?: string,
    branchId?: string,
    employeeId?: string,
    status?: string,
    includeDeleted = false,
  ): Promise<VacationResponseDto[]> {
    const where: Prisma.VacationWhereInput = includeDeleted ? {} : { deletedAt: null };

    if (companyId) {
      where.companyId = companyId;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (status) {
      where.status = status as any;
    }

    const vacations = await this.prisma.vacation.findMany({
      where,
      include: {
        employee: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return vacations.map((vacation) => this.mapToResponse(vacation));
  }

  async findOne(id: string): Promise<VacationResponseDto> {
    const vacation = await this.prisma.vacation.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        employee: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!vacation) {
      throw new NotFoundException('Férias não encontrada');
    }

    return this.mapToResponse(vacation);
  }

  async update(id: string, updateDto: UpdateVacationDto): Promise<VacationResponseDto> {
    const existingVacation = await this.prisma.vacation.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existingVacation) {
      throw new NotFoundException('Férias não encontrada');
    }

    // Não permitir editar férias concluídas ou canceladas
    if (existingVacation.status === 'COMPLETED' || existingVacation.status === 'CANCELLED') {
      throw new BadRequestException('Não é possível editar férias concluída ou cancelada');
    }

    // Validar funcionário se informado
    if (updateDto.employeeId) {
      const employee = await this.prisma.employee.findFirst({
        where: {
          id: updateDto.employeeId,
          companyId: existingVacation.companyId,
          branchId: existingVacation.branchId,
          deletedAt: null,
          active: true,
        },
      });

      if (!employee) {
        throw new NotFoundException('Funcionário não encontrado');
      }
    }

    // Validar datas se informadas
    let startDate = existingVacation.startDate;
    let endDate = existingVacation.endDate;
    let days = existingVacation.days;

    if (updateDto.startDate || updateDto.endDate) {
      if (updateDto.startDate) {
        const startDateStr = updateDto.startDate.split('T')[0];
        startDate = new Date(startDateStr + 'T12:00:00');
      }
      if (updateDto.endDate) {
        const endDateStr = updateDto.endDate.split('T')[0];
        endDate = new Date(endDateStr + 'T12:00:00');
      }

      if (startDate >= endDate) {
        throw new BadRequestException('Data de início deve ser anterior à data de término');
      }

      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      if (updateDto.days && updateDto.days !== days) {
        throw new BadRequestException(
          `Quantidade de dias informada (${updateDto.days}) não corresponde ao período entre as datas (${days} dias)`,
        );
      }
    }

    if (updateDto.days && !updateDto.startDate && !updateDto.endDate) {
      days = updateDto.days;
    }

    // Verificar sobreposição se datas foram alteradas
    if (updateDto.startDate || updateDto.endDate) {
      const overlappingVacation = await this.prisma.vacation.findFirst({
        where: {
          employeeId: updateDto.employeeId || existingVacation.employeeId,
          deletedAt: null,
          status: {
            notIn: ['CANCELLED'],
          },
          NOT: {
            id: existingVacation.id,
          },
          OR: [
            {
              startDate: {
                lte: endDate,
                gte: startDate,
              },
            },
            {
              endDate: {
                lte: endDate,
                gte: startDate,
              },
            },
            {
              AND: [
                {
                  startDate: {
                    lte: startDate,
                  },
                },
                {
                  endDate: {
                    gte: endDate,
                  },
                },
              ],
            },
          ],
        },
      });

      if (overlappingVacation) {
        throw new BadRequestException(
          'Já existe férias cadastrada para este funcionário no período informado',
        );
      }
    }

    // Validar dias vendidos se informados
    if (updateDto.soldDays !== undefined) {
      if (updateDto.soldDays > 10) {
        throw new BadRequestException('O máximo de dias que podem ser vendidos é 10');
      }
      const totalDays = updateDto.days ?? days;
      if (updateDto.soldDays > totalDays) {
        throw new BadRequestException(
          'Quantidade de dias vendidos não pode ser maior que a quantidade total de dias de férias',
        );
      }
    }

    const vacation = await this.prisma.vacation.update({
      where: { id },
      data: {
        ...(updateDto.employeeId && { employeeId: updateDto.employeeId }),
        ...(updateDto.startDate && { startDate }),
        ...(updateDto.endDate && { endDate }),
        ...(updateDto.days !== undefined && { days }),
        ...(updateDto.soldDays !== undefined && { soldDays: updateDto.soldDays }),
        ...(updateDto.advance13thSalary !== undefined && {
          advance13thSalary: updateDto.advance13thSalary,
        }),
        ...(updateDto.status && { status: updateDto.status }),
        ...(updateDto.observations !== undefined && {
          observations: updateDto.observations,
        }),
        // Campos financeiros
        ...(updateDto.monthlySalary !== undefined && { monthlySalary: updateDto.monthlySalary }),
        ...(updateDto.vacationBase !== undefined && { vacationBase: updateDto.vacationBase }),
        ...(updateDto.vacationThird !== undefined && { vacationThird: updateDto.vacationThird }),
        ...(updateDto.vacationTotal !== undefined && { vacationTotal: updateDto.vacationTotal }),
        ...(updateDto.soldDaysValue !== undefined && { soldDaysValue: updateDto.soldDaysValue }),
        ...(updateDto.soldDaysThird !== undefined && { soldDaysThird: updateDto.soldDaysThird }),
        ...(updateDto.soldDaysTotal !== undefined && { soldDaysTotal: updateDto.soldDaysTotal }),
        ...(updateDto.advance13thValue !== undefined && {
          advance13thValue: updateDto.advance13thValue,
        }),
        ...(updateDto.grossTotal !== undefined && { grossTotal: updateDto.grossTotal }),
        ...(updateDto.inss !== undefined && { inss: updateDto.inss }),
        ...(updateDto.irrf !== undefined && { irrf: updateDto.irrf }),
        ...(updateDto.totalDeductions !== undefined && {
          totalDeductions: updateDto.totalDeductions,
        }),
        ...(updateDto.netTotal !== undefined && { netTotal: updateDto.netTotal }),
        ...(updateDto.fgts !== undefined && { fgts: updateDto.fgts }),
        ...(updateDto.employerCost !== undefined && { employerCost: updateDto.employerCost }),
      },
      include: {
        employee: {
          select: {
            name: true,
          },
        },
      },
    });

    return this.mapToResponse(vacation);
  }

  async remove(id: string): Promise<void> {
    const vacation = await this.prisma.vacation.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!vacation) {
      throw new NotFoundException('Férias não encontrada');
    }

    // Não permitir excluir férias em andamento ou concluídas
    if (vacation.status === 'IN_PROGRESS' || vacation.status === 'COMPLETED') {
      throw new BadRequestException('Não é possível excluir férias em andamento ou concluída');
    }

    // Soft delete
    await this.prisma.vacation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private mapToResponse(vacation: any): VacationResponseDto {
    const toNumber = (val: any) => (val !== null && val !== undefined ? Number(val) : undefined);

    return {
      id: vacation.id,
      employeeId: vacation.employeeId,
      employeeName: vacation.employee?.name,
      startDate: vacation.startDate,
      endDate: vacation.endDate,
      days: vacation.days,
      soldDays: vacation.soldDays || 0,
      advance13thSalary: vacation.advance13thSalary || false,
      status: vacation.status,
      observations: vacation.observations,
      // Campos financeiros
      monthlySalary: toNumber(vacation.monthlySalary),
      vacationBase: toNumber(vacation.vacationBase),
      vacationThird: toNumber(vacation.vacationThird),
      vacationTotal: toNumber(vacation.vacationTotal),
      soldDaysValue: toNumber(vacation.soldDaysValue),
      soldDaysThird: toNumber(vacation.soldDaysThird),
      soldDaysTotal: toNumber(vacation.soldDaysTotal),
      advance13thValue: toNumber(vacation.advance13thValue),
      grossTotal: toNumber(vacation.grossTotal),
      inss: toNumber(vacation.inss),
      irrf: toNumber(vacation.irrf),
      totalDeductions: toNumber(vacation.totalDeductions),
      netTotal: toNumber(vacation.netTotal),
      fgts: toNumber(vacation.fgts),
      employerCost: toNumber(vacation.employerCost),
      // Campos padrão
      companyId: vacation.companyId,
      branchId: vacation.branchId,
      createdAt: vacation.createdAt,
      updatedAt: vacation.updatedAt,
      createdBy: vacation.createdBy,
      deletedAt: vacation.deletedAt,
    };
  }
}
