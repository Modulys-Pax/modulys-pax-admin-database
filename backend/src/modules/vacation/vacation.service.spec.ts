import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { VacationService } from './vacation.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { createMockPrismaService, PrismaMock } from '../../shared/testing/prisma.mock';

// Mock da constante DEFAULT_COMPANY_ID
jest.mock('../../shared/constants/company.constants', () => ({
  DEFAULT_COMPANY_ID: 'company-123',
}));

describe('VacationService', () => {
  let service: VacationService;
  let prisma: PrismaMock;

  const mockCompany = {
    id: 'company-123',
    name: 'Test Company',
    deletedAt: null,
  };

  const mockBranch = {
    id: 'branch-123',
    name: 'Test Branch',
    companyId: 'company-123',
    deletedAt: null,
  };

  const mockEmployee = {
    id: 'employee-123',
    name: 'Test Employee',
    companyId: 'company-123',
    branchId: 'branch-123',
    active: true,
    deletedAt: null,
    monthlySalary: 5000,
  };

  const mockVacation = {
    id: 'vacation-123',
    employeeId: 'employee-123',
    startDate: new Date('2024-01-15T12:00:00'),
    endDate: new Date('2024-01-30T12:00:00'),
    days: 16,
    soldDays: 0,
    advance13thSalary: false,
    status: 'PLANNED',
    observations: null,
    companyId: 'company-123',
    branchId: 'branch-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-123',
    deletedAt: null,
    employee: { name: 'Test Employee' },
  };

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VacationService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<VacationService>(VacationService);
    prisma = module.get(PrismaService) as unknown as PrismaMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      employeeId: 'employee-123',
      companyId: 'company-123',
      branchId: 'branch-123',
      startDate: '2024-01-15',
      endDate: '2024-01-30',
      days: 16,
      soldDays: 0,
      advance13thSalary: false,
    } as any;

    it('deve criar férias com sucesso', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.employee.findFirst.mockResolvedValue(mockEmployee);
      prisma.vacation.findFirst.mockResolvedValue(null); // Sem sobreposição
      prisma.vacation.create.mockResolvedValue(mockVacation);

      const result = await service.create(createDto);

      expect(result).toHaveProperty('id');
      expect(result.employeeId).toBe(createDto.employeeId);
      expect(result.days).toBe(createDto.days);
      expect(prisma.vacation.create).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException quando empresa não existe', async () => {
      prisma.company.findFirst.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(createDto)).rejects.toThrow('Empresa não encontrada');
    });

    it('deve lançar NotFoundException quando filial não existe', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(createDto)).rejects.toThrow('Filial não encontrada');
    });

    it('deve lançar NotFoundException quando funcionário não existe', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.employee.findFirst.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(createDto)).rejects.toThrow('Funcionário não encontrado');
    });

    it('deve lançar BadRequestException quando data de início é posterior à data de término', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.employee.findFirst.mockResolvedValue(mockEmployee);

      const invalidDto = {
        ...createDto,
        startDate: '2024-01-30',
        endDate: '2024-01-15',
        days: 16,
      };

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(invalidDto)).rejects.toThrow(
        'Data de início deve ser anterior à data de término',
      );
    });

    it('deve lançar BadRequestException quando dias não correspondem ao período', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.employee.findFirst.mockResolvedValue(mockEmployee);

      const invalidDto = {
        ...createDto,
        days: 10, // Errado, deveria ser 16
      };

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException quando dias vendidos excede 10', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.employee.findFirst.mockResolvedValue(mockEmployee);

      const invalidDto = {
        ...createDto,
        soldDays: 15,
      };

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(invalidDto)).rejects.toThrow(
        'O máximo de dias que podem ser vendidos é 10',
      );
    });

    it('deve lançar BadRequestException quando dias vendidos excede total de dias', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.employee.findFirst.mockResolvedValue(mockEmployee);

      const invalidDto = {
        ...createDto,
        days: 5,
        startDate: '2024-01-15',
        endDate: '2024-01-19',
        soldDays: 8,
      };

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException quando há sobreposição de férias', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.employee.findFirst.mockResolvedValue(mockEmployee);
      prisma.vacation.findFirst.mockResolvedValue(mockVacation); // Já existe férias

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto)).rejects.toThrow(
        'Já existe férias cadastrada para este funcionário no período informado',
      );
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de férias', async () => {
      prisma.vacation.findMany.mockResolvedValue([mockVacation]);

      const result = await service.findAll('company-123', 'branch-123');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockVacation.id);
      expect(prisma.vacation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId: 'company-123',
            branchId: 'branch-123',
            deletedAt: null,
          }),
        }),
      );
    });

    it('deve filtrar por funcionário', async () => {
      prisma.vacation.findMany.mockResolvedValue([mockVacation]);

      await service.findAll('company-123', 'branch-123', 'employee-123');

      expect(prisma.vacation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            employeeId: 'employee-123',
          }),
        }),
      );
    });

    it('deve filtrar por status', async () => {
      prisma.vacation.findMany.mockResolvedValue([mockVacation]);

      await service.findAll('company-123', 'branch-123', undefined, 'PLANNED');

      expect(prisma.vacation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PLANNED',
          }),
        }),
      );
    });

    it('deve incluir deletados quando solicitado', async () => {
      prisma.vacation.findMany.mockResolvedValue([]);

      await service.findAll('company-123', undefined, undefined, undefined, true);

      expect(prisma.vacation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            deletedAt: null,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar férias por ID', async () => {
      prisma.vacation.findFirst.mockResolvedValue(mockVacation);

      const result = await service.findOne('vacation-123');

      expect(result.id).toBe(mockVacation.id);
      expect(prisma.vacation.findFirst).toHaveBeenCalledWith({
        where: { id: 'vacation-123', deletedAt: null },
        include: { employee: { select: { name: true } } },
      });
    });

    it('deve lançar NotFoundException quando férias não existe', async () => {
      prisma.vacation.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('invalid-id')).rejects.toThrow('Férias não encontrada');
    });
  });

  describe('update', () => {
    it('deve atualizar férias com sucesso', async () => {
      prisma.vacation.findFirst.mockResolvedValue(mockVacation);
      prisma.vacation.update.mockResolvedValue({
        ...mockVacation,
        observations: 'Atualizado',
      });

      const result = await service.update('vacation-123', {
        observations: 'Atualizado',
      });

      expect(result.observations).toBe('Atualizado');
    });

    it('deve lançar NotFoundException quando férias não existe', async () => {
      prisma.vacation.findFirst.mockResolvedValue(null);

      await expect(service.update('invalid-id', {})).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException quando férias está concluída', async () => {
      prisma.vacation.findFirst.mockResolvedValue({
        ...mockVacation,
        status: 'COMPLETED',
      });

      await expect(service.update('vacation-123', {})).rejects.toThrow(BadRequestException);
      await expect(service.update('vacation-123', {})).rejects.toThrow(
        'Não é possível editar férias concluída ou cancelada',
      );
    });

    it('deve lançar BadRequestException quando férias está cancelada', async () => {
      prisma.vacation.findFirst.mockResolvedValue({
        ...mockVacation,
        status: 'CANCELLED',
      });

      await expect(service.update('vacation-123', {})).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('deve fazer soft delete das férias', async () => {
      prisma.vacation.findFirst.mockResolvedValue(mockVacation);
      prisma.vacation.update.mockResolvedValue({ ...mockVacation, deletedAt: new Date() });

      await service.remove('vacation-123');

      expect(prisma.vacation.update).toHaveBeenCalledWith({
        where: { id: 'vacation-123' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('deve lançar NotFoundException quando férias não existe', async () => {
      prisma.vacation.findFirst.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException quando férias está em andamento', async () => {
      prisma.vacation.findFirst.mockResolvedValue({
        ...mockVacation,
        status: 'IN_PROGRESS',
      });

      await expect(service.remove('vacation-123')).rejects.toThrow(BadRequestException);
      await expect(service.remove('vacation-123')).rejects.toThrow(
        'Não é possível excluir férias em andamento ou concluída',
      );
    });

    it('deve lançar BadRequestException quando férias está concluída', async () => {
      prisma.vacation.findFirst.mockResolvedValue({
        ...mockVacation,
        status: 'COMPLETED',
      });

      await expect(service.remove('vacation-123')).rejects.toThrow(BadRequestException);
    });

    it('deve permitir excluir férias planejadas', async () => {
      prisma.vacation.findFirst.mockResolvedValue({
        ...mockVacation,
        status: 'PLANNED',
      });
      prisma.vacation.update.mockResolvedValue({ ...mockVacation, deletedAt: new Date() });

      await expect(service.remove('vacation-123')).resolves.not.toThrow();
    });

    it('deve permitir excluir férias canceladas', async () => {
      prisma.vacation.findFirst.mockResolvedValue({
        ...mockVacation,
        status: 'CANCELLED',
      });
      prisma.vacation.update.mockResolvedValue({ ...mockVacation, deletedAt: new Date() });

      await expect(service.remove('vacation-123')).resolves.not.toThrow();
    });
  });

  describe('update - validações adicionais', () => {
    it('deve validar funcionário ao atualizar employeeId', async () => {
      prisma.vacation.findFirst.mockResolvedValue(mockVacation);
      prisma.employee.findFirst.mockResolvedValue(null);

      await expect(
        service.update('vacation-123', { employeeId: 'invalid-employee' }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.update('vacation-123', { employeeId: 'invalid-employee' }),
      ).rejects.toThrow('Funcionário não encontrado');
    });

    it('deve permitir atualizar funcionário válido', async () => {
      const newEmployee = { ...mockEmployee, id: 'new-employee-123' };
      prisma.vacation.findFirst.mockResolvedValue(mockVacation);
      prisma.employee.findFirst.mockResolvedValue(newEmployee);
      prisma.vacation.update.mockResolvedValue({
        ...mockVacation,
        employeeId: 'new-employee-123',
        employee: { name: newEmployee.name },
      });

      const result = await service.update('vacation-123', { employeeId: 'new-employee-123' });

      expect(prisma.employee.findFirst).toHaveBeenCalled();
      expect(result.employeeId).toBe('new-employee-123');
    });

    it('deve validar sobreposição ao atualizar datas', async () => {
      const overlappingVacation = { ...mockVacation, id: 'other-vacation' };
      prisma.vacation.findFirst
        .mockResolvedValueOnce(mockVacation) // existingVacation
        .mockResolvedValueOnce(overlappingVacation); // overlapping check

      await expect(
        service.update('vacation-123', {
          startDate: '2024-02-01',
          endDate: '2024-02-15',
          days: 15,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve validar dias vendidos no update', async () => {
      prisma.vacation.findFirst.mockResolvedValue(mockVacation);

      await expect(service.update('vacation-123', { soldDays: 15 })).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('vacation-123', { soldDays: 15 })).rejects.toThrow(
        'O máximo de dias que podem ser vendidos é 10',
      );
    });

    it('deve validar dias vendidos maior que total no update', async () => {
      prisma.vacation.findFirst.mockResolvedValue({
        ...mockVacation,
        days: 5,
      });

      await expect(service.update('vacation-123', { soldDays: 8 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve atualizar status para IN_PROGRESS', async () => {
      prisma.vacation.findFirst.mockResolvedValue(mockVacation);
      prisma.vacation.update.mockResolvedValue({
        ...mockVacation,
        status: 'IN_PROGRESS',
        employee: { name: 'Test Employee' },
      });

      const result = await service.update('vacation-123', { status: 'IN_PROGRESS' as any });

      expect(result.status).toBe('IN_PROGRESS');
    });

    it('deve atualizar observações', async () => {
      prisma.vacation.findFirst.mockResolvedValue(mockVacation);
      prisma.vacation.update.mockResolvedValue({
        ...mockVacation,
        observations: 'Observação atualizada',
        employee: { name: 'Test Employee' },
      });

      const result = await service.update('vacation-123', {
        observations: 'Observação atualizada',
      });

      expect(result.observations).toBe('Observação atualizada');
    });

    it('deve atualizar campos financeiros', async () => {
      prisma.vacation.findFirst.mockResolvedValue(mockVacation);
      prisma.vacation.update.mockResolvedValue({
        ...mockVacation,
        monthlySalary: 6000,
        vacationBase: 5000,
        vacationTotal: 6666.67,
        employee: { name: 'Test Employee' },
      });

      const result = await service.update('vacation-123', {
        monthlySalary: 6000,
        vacationBase: 5000,
        vacationTotal: 6666.67,
      });

      expect(result.monthlySalary).toBe(6000);
    });

    it('deve validar datas consistentes ao atualizar apenas startDate', async () => {
      prisma.vacation.findFirst
        .mockResolvedValueOnce({
          ...mockVacation,
          startDate: new Date('2024-01-15T12:00:00'),
          endDate: new Date('2024-01-30T12:00:00'),
        })
        .mockResolvedValueOnce(null); // overlapping

      await expect(service.update('vacation-123', { startDate: '2024-02-01' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('create - validações financeiras', () => {
    const createDtoWithFinancials = {
      ...({
        employeeId: 'employee-123',
        companyId: 'company-123',
        branchId: 'branch-123',
        startDate: '2024-01-15',
        endDate: '2024-01-30',
        days: 16,
        soldDays: 5,
        advance13thSalary: true,
        monthlySalary: 5000,
        vacationBase: 4444.44,
        vacationThird: 1481.48,
        vacationTotal: 5925.92,
        soldDaysValue: 833.33,
        soldDaysThird: 277.78,
        soldDaysTotal: 1111.11,
        advance13thValue: 2500,
        grossTotal: 9537.03,
        inss: 751.01,
        irrf: 500,
        totalDeductions: 1251.01,
        netTotal: 8286.02,
        fgts: 762.96,
        employerCost: 10300,
      } as any),
    };

    it('deve criar férias com campos financeiros completos', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.employee.findFirst.mockResolvedValue(mockEmployee);
      prisma.vacation.findFirst.mockResolvedValue(null);
      prisma.vacation.create.mockResolvedValue({
        ...mockVacation,
        ...createDtoWithFinancials,
        employee: { name: 'Test Employee' },
      });

      const result = await service.create(createDtoWithFinancials);

      expect(result.monthlySalary).toBeDefined();
      expect(result.vacationTotal).toBeDefined();
      expect(result.netTotal).toBeDefined();
    });

    it('deve criar férias com adiantamento de 13º', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.employee.findFirst.mockResolvedValue(mockEmployee);
      prisma.vacation.findFirst.mockResolvedValue(null);
      prisma.vacation.create.mockResolvedValue({
        ...mockVacation,
        advance13thSalary: true,
        advance13thValue: 2500,
        employee: { name: 'Test Employee' },
      });

      const dtoWith13th = { ...createDtoWithFinancials, advance13thSalary: true };
      const result = await service.create(dtoWith13th);

      expect(result.advance13thSalary).toBe(true);
    });
  });

  describe('findAll - filtros avançados', () => {
    it('deve retornar lista vazia quando não há férias', async () => {
      prisma.vacation.findMany.mockResolvedValue([]);

      const result = await service.findAll('company-123');

      expect(result).toHaveLength(0);
    });

    it('deve retornar múltiplas férias', async () => {
      const vacations = [
        { ...mockVacation, id: 'v1' },
        { ...mockVacation, id: 'v2' },
        { ...mockVacation, id: 'v3' },
      ];
      prisma.vacation.findMany.mockResolvedValue(vacations);

      const result = await service.findAll('company-123');

      expect(result).toHaveLength(3);
    });

    it('deve ordenar por startDate desc', async () => {
      prisma.vacation.findMany.mockResolvedValue([mockVacation]);

      await service.findAll('company-123');

      expect(prisma.vacation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { startDate: 'desc' },
        }),
      );
    });
  });

  describe('create - validação de sobreposição', () => {
    it('deve detectar sobreposição de férias', async () => {
      const existingVacation = {
        ...mockVacation,
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-25'),
      };

      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.employee.findFirst.mockResolvedValue(mockEmployee);
      prisma.vacation.findFirst.mockResolvedValue(existingVacation);

      const createDto = {
        employeeId: 'employee-123',
        companyId: 'company-123',
        branchId: 'branch-123',
        startDate: '2024-01-15', // Durante a outra
        endDate: '2024-01-30',
        days: 16,
        soldDays: 0,
        advance13thSalary: false,
      } as any;

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto)).rejects.toThrow(
        'Já existe férias cadastrada para este funcionário no período informado',
      );
    });

    it('deve permitir férias quando não há sobreposição', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.employee.findFirst.mockResolvedValue(mockEmployee);
      prisma.vacation.findFirst.mockResolvedValue(null); // Sem sobreposição
      prisma.vacation.create.mockResolvedValue({
        ...mockVacation,
        employee: { name: 'Test Employee' },
      });

      const createDto = {
        employeeId: 'employee-123',
        companyId: 'company-123',
        branchId: 'branch-123',
        startDate: '2024-02-01',
        endDate: '2024-02-15',
        days: 15,
        soldDays: 0,
        advance13thSalary: false,
      } as any;

      await expect(service.create(createDto)).resolves.not.toThrow();
    });
  });

  describe('update - edge cases de datas', () => {
    it('deve rejeitar data final antes da data inicial', async () => {
      prisma.vacation.findFirst.mockResolvedValue(mockVacation);

      await expect(
        service.update('vacation-123', {
          startDate: '2024-01-30',
          endDate: '2024-01-15', // Antes do início
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update('vacation-123', {
          startDate: '2024-01-30',
          endDate: '2024-01-15',
        }),
      ).rejects.toThrow('Data de início deve ser anterior à data de término');
    });

    it('deve rejeitar dias informados diferente do período calculado', async () => {
      prisma.vacation.findFirst.mockResolvedValue(mockVacation);

      await expect(
        service.update('vacation-123', {
          startDate: '2024-01-15',
          endDate: '2024-01-20',
          days: 30, // Errado - deveria ser 6
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update('vacation-123', {
          startDate: '2024-01-15',
          endDate: '2024-01-20',
          days: 30,
        }),
      ).rejects.toThrow(/não corresponde ao período entre as datas/);
    });
  });

  describe('create - validação de dias vendidos', () => {
    it('deve rejeitar dias vendidos maior que 10', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.employee.findFirst.mockResolvedValue(mockEmployee);

      const createDto = {
        employeeId: 'employee-123',
        companyId: 'company-123',
        branchId: 'branch-123',
        startDate: '2024-01-15',
        endDate: '2024-01-30',
        days: 16,
        soldDays: 15, // Maior que 10
        advance13thSalary: false,
      } as any;

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto)).rejects.toThrow(
        'O máximo de dias que podem ser vendidos é 10',
      );
    });

    it('deve rejeitar dias vendidos maior que dias totais', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.employee.findFirst.mockResolvedValue(mockEmployee);

      const createDto = {
        employeeId: 'employee-123',
        companyId: 'company-123',
        branchId: 'branch-123',
        startDate: '2024-01-15',
        endDate: '2024-01-20',
        days: 6,
        soldDays: 8, // Maior que total
        advance13thSalary: false,
      } as any;

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });
  });
});
