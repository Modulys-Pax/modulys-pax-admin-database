import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';
import { PaySalaryDto } from './dto/pay-salary.dto';
import { SalaryResponseDto } from './dto/salary-response.dto';
import {
  ProcessSalariesDto,
  ProcessSalariesResultDto,
  ProcessSalaryEmployeeDetail,
} from './dto/process-salaries.dto';
import { Prisma } from '@prisma/client';
import { DEFAULT_COMPANY_ID } from '../../shared/constants/company.constants';
import { validateBranchAccess } from '../../shared/utils/branch-access.util';

@Injectable()
export class SalaryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Valida se o mês/ano de referência está dentro do período permitido.
   * Regra: Somente mês atual ou 1 mês no passado. Meses futuros não são permitidos.
   */
  private validateReferencePeriod(referenceMonth: number, referenceYear: number): void {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    // Converter para número de meses desde o ano 0 para facilitar comparação
    const currentTotalMonths = currentYear * 12 + currentMonth;
    const referenceTotalMonths = referenceYear * 12 + referenceMonth;

    // Diferença em meses (positivo = passado, negativo = futuro)
    const monthsDiff = currentTotalMonths - referenceTotalMonths;

    // Não permite meses futuros
    if (monthsDiff < 0) {
      throw new BadRequestException('Não é permitido criar ou apurar salários para meses futuros');
    }

    // Não permite mais de 1 mês no passado
    if (monthsDiff > 1) {
      const minMonth = currentMonth - 1;
      const minYear = currentYear;

      // Calcular o mês mínimo permitido
      let allowedMinMonth = minMonth;
      let allowedMinYear = minYear;

      if (allowedMinMonth <= 0) {
        allowedMinMonth += 12;
        allowedMinYear -= 1;
      }

      throw new BadRequestException(
        `Período fora do limite permitido. Só é possível criar ou apurar salários a partir de ${allowedMinMonth.toString().padStart(2, '0')}/${allowedMinYear}`,
      );
    }
  }

  async create(
    createDto: CreateSalaryDto,
    userId?: string,
    user?: any,
  ): Promise<SalaryResponseDto> {
    // Validar período de referência (mês atual ou até 2 meses atrás)
    this.validateReferencePeriod(createDto.referenceMonth, createDto.referenceYear);

    // Usar DEFAULT_COMPANY_ID (single-tenant)
    const companyId = DEFAULT_COMPANY_ID;

    // Validar acesso por filial (não-admin só cria na própria filial)
    // O interceptor já força o branchId no body, mas validamos aqui também por segurança
    if (user) {
      validateBranchAccess(user.branchId, user.role, createDto.branchId, undefined);
    }

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

    // Usar monthlySalary do funcionário como padrão se amount não for informado
    const amount =
      createDto.amount !== undefined && createDto.amount !== null
        ? createDto.amount
        : employee.monthlySalary && Number(employee.monthlySalary) > 0
          ? Number(employee.monthlySalary)
          : 0;

    // Verificar se já existe salário para o mesmo funcionário, mês e ano
    const existingSalary = await this.prisma.salary.findFirst({
      where: {
        employeeId: createDto.employeeId,
        referenceMonth: createDto.referenceMonth,
        referenceYear: createDto.referenceYear,
        companyId: companyId,
        branchId: createDto.branchId,
        deletedAt: null,
      },
    });

    if (existingSalary) {
      throw new ConflictException(
        `Já existe salário cadastrado para este funcionário no mês ${createDto.referenceMonth}/${createDto.referenceYear}`,
      );
    }

    const salary = await this.prisma.salary.create({
      data: {
        employeeId: createDto.employeeId,
        amount: new Prisma.Decimal(amount),
        referenceMonth: createDto.referenceMonth,
        referenceYear: createDto.referenceYear,
        paymentDate: createDto.paymentDate ? new Date(createDto.paymentDate) : undefined,
        description: createDto.description,
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

    return this.mapToResponse(salary);
  }

  async findAll(
    companyId?: string,
    branchId?: string,
    employeeId?: string,
    referenceMonth?: number,
    referenceYear?: number,
    includeDeleted = false,
  ): Promise<SalaryResponseDto[]> {
    const where: Prisma.SalaryWhereInput = includeDeleted ? {} : { deletedAt: null };

    if (companyId) {
      where.companyId = companyId;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (referenceMonth) {
      where.referenceMonth = referenceMonth;
    }

    if (referenceYear) {
      where.referenceYear = referenceYear;
    }

    const salaries = await this.prisma.salary.findMany({
      where,
      include: {
        employee: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ referenceYear: 'desc' }, { referenceMonth: 'desc' }, { createdAt: 'desc' }],
    });

    return salaries.map((salary) => this.mapToResponse(salary));
  }

  async findOne(id: string, user?: any): Promise<SalaryResponseDto> {
    const salary = await this.prisma.salary.findFirst({
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
        financialTransaction: true,
      },
    });

    if (!salary) {
      throw new NotFoundException('Salário não encontrado');
    }

    // Validar acesso por filial (não-admin só acessa própria filial)
    if (user) {
      validateBranchAccess(user.branchId, user.role, undefined, salary.branchId);
    }

    return this.mapToResponse(salary);
  }

  async update(id: string, updateDto: UpdateSalaryDto, user?: any): Promise<SalaryResponseDto> {
    const existingSalary = await this.prisma.salary.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existingSalary) {
      throw new NotFoundException('Salário não encontrado');
    }

    // Validar acesso por filial (não-admin só acessa própria filial)
    if (user) {
      validateBranchAccess(
        user.branchId,
        user.role,
        undefined, // branchId não pode ser alterado na atualização
        existingSalary.branchId,
      );
    }

    // Não permitir editar salário já pago
    if (existingSalary.financialTransactionId) {
      throw new BadRequestException('Não é possível editar salário que já foi pago');
    }

    // Validar funcionário se informado
    if (updateDto.employeeId) {
      const employee = await this.prisma.employee.findFirst({
        where: {
          id: updateDto.employeeId,
          companyId: existingSalary.companyId,
          branchId: existingSalary.branchId,
          deletedAt: null,
          active: true,
        },
      });

      if (!employee) {
        throw new NotFoundException('Funcionário não encontrado');
      }
    }

    // Verificar duplicidade se mês/ano foram alterados
    if (
      (updateDto.referenceMonth || updateDto.referenceYear) &&
      (updateDto.employeeId || existingSalary.employeeId)
    ) {
      const month = updateDto.referenceMonth || existingSalary.referenceMonth;
      const year = updateDto.referenceYear || existingSalary.referenceYear;
      const empId = updateDto.employeeId || existingSalary.employeeId;

      const duplicate = await this.prisma.salary.findFirst({
        where: {
          employeeId: empId,
          referenceMonth: month,
          referenceYear: year,
          companyId: existingSalary.companyId,
          branchId: existingSalary.branchId,
          deletedAt: null,
          NOT: {
            id: existingSalary.id,
          },
        },
      });

      if (duplicate) {
        throw new ConflictException(
          `Já existe salário cadastrado para este funcionário no mês ${month}/${year}`,
        );
      }
    }

    const salary = await this.prisma.salary.update({
      where: { id },
      data: {
        ...(updateDto.employeeId && { employeeId: updateDto.employeeId }),
        ...(updateDto.amount !== undefined && { amount: updateDto.amount }),
        ...(updateDto.referenceMonth !== undefined && {
          referenceMonth: updateDto.referenceMonth,
        }),
        ...(updateDto.referenceYear !== undefined && {
          referenceYear: updateDto.referenceYear,
        }),
        ...(updateDto.paymentDate !== undefined && {
          paymentDate: updateDto.paymentDate ? new Date(updateDto.paymentDate) : undefined,
        }),
        ...(updateDto.description !== undefined && {
          description: updateDto.description,
        }),
      },
      include: {
        employee: {
          select: {
            name: true,
          },
        },
      },
    });

    return this.mapToResponse(salary);
  }

  async pay(id: string, payDto: PaySalaryDto, userId?: string): Promise<SalaryResponseDto> {
    const salary = await this.prisma.salary.findFirst({
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

    if (!salary) {
      throw new NotFoundException('Salário não encontrado');
    }

    if (salary.financialTransactionId) {
      throw new BadRequestException('Salário já foi pago');
    }

    const paymentDate = payDto.paymentDate ? new Date(payDto.paymentDate) : new Date();

    // Criar transação financeira e atualizar salário em uma transação
    const result = await this.prisma.$transaction(async (tx) => {
      // Criar transação financeira
      const financialTransaction = await tx.financialTransaction.create({
        data: {
          type: 'EXPENSE',
          amount: salary.amount,
          description:
            salary.description ||
            `Salário - ${salary.employee.name} - ${salary.referenceMonth}/${salary.referenceYear}`,
          transactionDate: paymentDate,
          originType: 'HR',
          originId: salary.id,
          documentNumber: `SAL-${salary.referenceMonth.toString().padStart(2, '0')}-${salary.referenceYear}`,
          notes: payDto.notes,
          companyId: salary.companyId,
          branchId: salary.branchId,
          createdBy: userId,
        },
      });

      // Atualizar salário
      const updatedSalary = await tx.salary.update({
        where: { id },
        data: {
          paymentDate,
          financialTransactionId: financialTransaction.id,
        },
        include: {
          employee: {
            select: {
              name: true,
            },
          },
          financialTransaction: true,
        },
      });

      return updatedSalary;
    });

    return this.mapToResponse(result);
  }

  async remove(id: string, user?: any): Promise<void> {
    const salary = await this.prisma.salary.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!salary) {
      throw new NotFoundException('Salário não encontrado');
    }

    // Validar acesso por filial (não-admin só acessa própria filial)
    if (user) {
      validateBranchAccess(user.branchId, user.role, undefined, salary.branchId);
    }

    // Não permitir excluir salário já pago
    if (salary.financialTransactionId) {
      throw new BadRequestException('Não é possível excluir salário que já foi pago');
    }

    // Soft delete
    await this.prisma.salary.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Processa a apuração de salários para um mês/ano específico.
   * Cria registros de salário para todos os funcionários ativos que ainda não possuem.
   */
  async processSalaries(
    processDto: ProcessSalariesDto,
    userId?: string,
    user?: any,
  ): Promise<ProcessSalariesResultDto> {
    // Validar período de referência (mês atual ou até 2 meses atrás)
    this.validateReferencePeriod(processDto.referenceMonth, processDto.referenceYear);

    // Usar DEFAULT_COMPANY_ID (single-tenant)
    const companyId = DEFAULT_COMPANY_ID;

    // Validar acesso por filial (não-admin só cria na própria filial)
    if (user) {
      validateBranchAccess(user.branchId, user.role, processDto.branchId, undefined);
    }

    // Verificar se filial existe
    const branch = await this.prisma.branch.findFirst({
      where: {
        id: processDto.branchId,
        companyId: companyId,
        deletedAt: null,
      },
    });

    if (!branch) {
      throw new NotFoundException('Filial não encontrada');
    }

    // Buscar todos os funcionários ativos da filial
    const employees = await this.prisma.employee.findMany({
      where: {
        companyId: companyId,
        branchId: processDto.branchId,
        deletedAt: null,
        active: true,
      },
      orderBy: { name: 'asc' },
    });

    // Buscar salários já existentes para o mês/ano
    const existingSalaries = await this.prisma.salary.findMany({
      where: {
        companyId: companyId,
        branchId: processDto.branchId,
        referenceMonth: processDto.referenceMonth,
        referenceYear: processDto.referenceYear,
        deletedAt: null,
      },
    });

    // Criar mapa de salários existentes por employeeId
    const salaryMap = new Map(existingSalaries.map((s) => [s.employeeId, s]));

    // Processar cada funcionário
    const details: ProcessSalaryEmployeeDetail[] = [];
    let created = 0;
    let alreadyPending = 0;
    let alreadyPaid = 0;
    let skippedNoSalary = 0;

    for (const employee of employees) {
      const existingSalary = salaryMap.get(employee.id);
      const monthlySalary = employee.monthlySalary ? Number(employee.monthlySalary) : 0;

      if (existingSalary) {
        // Já existe salário para este funcionário no mês/ano
        if (existingSalary.paymentDate || existingSalary.financialTransactionId) {
          // Já foi pago
          alreadyPaid++;
          details.push({
            employeeId: employee.id,
            employeeName: employee.name,
            amount: Number(existingSalary.amount),
            status: 'already_paid',
            salaryId: existingSalary.id,
            paymentDate: existingSalary.paymentDate || undefined,
          });
        } else {
          // Está pendente
          alreadyPending++;
          details.push({
            employeeId: employee.id,
            employeeName: employee.name,
            amount: Number(existingSalary.amount),
            status: 'already_pending',
            salaryId: existingSalary.id,
          });
        }
      } else if (monthlySalary <= 0) {
        // Funcionário sem salário base definido
        skippedNoSalary++;
        details.push({
          employeeId: employee.id,
          employeeName: employee.name,
          amount: 0,
          status: 'skipped_no_salary',
        });
      } else {
        // Criar novo registro de salário
        const newSalary = await this.prisma.salary.create({
          data: {
            employeeId: employee.id,
            amount: new Prisma.Decimal(monthlySalary),
            referenceMonth: processDto.referenceMonth,
            referenceYear: processDto.referenceYear,
            description: `Apuração automática - ${processDto.referenceMonth}/${processDto.referenceYear}`,
            companyId: companyId,
            branchId: processDto.branchId,
            createdBy: userId,
          },
        });

        created++;
        details.push({
          employeeId: employee.id,
          employeeName: employee.name,
          amount: monthlySalary,
          status: 'created',
          salaryId: newSalary.id,
        });
      }
    }

    return {
      totalEmployees: employees.length,
      created,
      alreadyPending,
      alreadyPaid,
      skippedNoSalary,
      details,
    };
  }

  private mapToResponse(salary: any): SalaryResponseDto {
    return {
      id: salary.id,
      employeeId: salary.employeeId,
      employeeName: salary.employee?.name,
      amount: Number(salary.amount),
      referenceMonth: salary.referenceMonth,
      referenceYear: salary.referenceYear,
      paymentDate: salary.paymentDate,
      description: salary.description,
      companyId: salary.companyId,
      branchId: salary.branchId,
      financialTransactionId: salary.financialTransactionId,
      createdAt: salary.createdAt,
      updatedAt: salary.updatedAt,
      createdBy: salary.createdBy,
      deletedAt: salary.deletedAt,
    };
  }
}
