import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserService } from './user.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { createMockPrismaService, PrismaMock } from '../../shared/testing/prisma.mock';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
}));

// Mock da constante DEFAULT_COMPANY_ID
jest.mock('../../shared/constants/company.constants', () => ({
  DEFAULT_COMPANY_ID: 'company-123',
}));

describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaMock;

  const mockRole = {
    id: 'role-123',
    name: 'Admin',
    description: 'Administrador',
    active: true,
  };

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
    deletedAt: null,
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashedPassword',
    name: 'Test User',
    companyId: 'company-123',
    branchId: 'branch-123',
    roleId: 'role-123',
    employeeId: null,
    active: true,
    role: mockRole,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: null,
    deletedAt: null,
  };

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get(PrismaService) as unknown as PrismaMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      email: 'new@example.com',
      password: 'password123',
      name: 'New User',
      roleId: 'role-123',
      branchId: 'branch-123',
    };

    it('deve criar usuário com sucesso', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.role.findFirst.mockResolvedValue(mockRole);
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.user.create.mockResolvedValue({ ...mockUser, ...createDto });

      const result = await service.create(createDto);

      expect(result).toHaveProperty('id');
      expect(result.email).toBe(createDto.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(createDto.password, 10);
    });

    it('deve lançar ConflictException quando email já existe', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createDto)).rejects.toThrow('Email já cadastrado');
    });

    it('deve lançar NotFoundException quando role não existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.role.findFirst.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(createDto)).rejects.toThrow('Cargo não encontrado ou inativo');
    });

    it('deve lançar NotFoundException quando empresa não existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.role.findFirst.mockResolvedValue(mockRole);
      prisma.company.findFirst.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(createDto)).rejects.toThrow('Empresa não encontrada');
    });

    it('deve lançar NotFoundException quando filial não existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.role.findFirst.mockResolvedValue(mockRole);
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(createDto)).rejects.toThrow('Filial não encontrada');
    });

    it('deve criar usuário com funcionário vinculado', async () => {
      const dtoWithEmployee = { ...createDto, employeeId: 'employee-123' };

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.role.findFirst.mockResolvedValue(mockRole);
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.employee.findFirst.mockResolvedValue(mockEmployee);
      prisma.user.findFirst.mockResolvedValue(null); // Nenhum usuário vinculado ao employee
      prisma.user.create.mockResolvedValue({
        ...mockUser,
        ...dtoWithEmployee,
      });

      const result = await service.create(dtoWithEmployee);

      expect(result.employeeId).toBe('employee-123');
    });

    it('deve lançar ConflictException quando funcionário já está vinculado', async () => {
      const dtoWithEmployee = { ...createDto, employeeId: 'employee-123' };

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.role.findFirst.mockResolvedValue(mockRole);
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.employee.findFirst.mockResolvedValue(mockEmployee);
      prisma.user.findFirst.mockResolvedValue(mockUser); // Já existe usuário vinculado

      await expect(service.create(dtoWithEmployee)).rejects.toThrow(ConflictException);
      await expect(service.create(dtoWithEmployee)).rejects.toThrow(
        'Já existe um usuário vinculado a este funcionário',
      );
    });

    it('deve lançar ConflictException quando funcionário é de empresa diferente', async () => {
      const dtoWithEmployee = { ...createDto, employeeId: 'employee-123' };
      const employeeFromOtherCompany = { ...mockEmployee, companyId: 'other-company' };

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.role.findFirst.mockResolvedValue(mockRole);
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.employee.findFirst.mockResolvedValue(employeeFromOtherCompany);

      await expect(service.create(dtoWithEmployee)).rejects.toThrow(ConflictException);
      await expect(service.create(dtoWithEmployee)).rejects.toThrow(
        'Funcionário não pertence à mesma empresa do usuário',
      );
    });

    it('deve lançar ConflictException quando filial do funcionário é diferente', async () => {
      const dtoWithEmployee = { ...createDto, employeeId: 'employee-123' };
      const employeeFromOtherBranch = { ...mockEmployee, branchId: 'other-branch' };

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.role.findFirst.mockResolvedValue(mockRole);
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.employee.findFirst.mockResolvedValue(employeeFromOtherBranch);

      await expect(service.create(dtoWithEmployee)).rejects.toThrow(ConflictException);
      await expect(service.create(dtoWithEmployee)).rejects.toThrow(
        'Filial do funcionário é diferente da filial informada para o usuário',
      );
    });

    it('deve lançar NotFoundException quando funcionário não existe', async () => {
      const dtoWithEmployee = { ...createDto, employeeId: 'invalid-employee' };

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.role.findFirst.mockResolvedValue(mockRole);
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.employee.findFirst.mockResolvedValue(null);

      await expect(service.create(dtoWithEmployee)).rejects.toThrow(NotFoundException);
      await expect(service.create(dtoWithEmployee)).rejects.toThrow('Funcionário não encontrado');
    });

    it('deve criar usuário sem filial', async () => {
      const dtoWithoutBranch = { ...createDto, branchId: undefined };

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.role.findFirst.mockResolvedValue(mockRole);
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.user.create.mockResolvedValue({ ...mockUser, branchId: null });

      const result = await service.create(dtoWithoutBranch);

      expect(result).toHaveProperty('id');
    });
  });

  describe('findAll', () => {
    it('deve retornar lista paginada de usuários', async () => {
      prisma.user.findMany.mockResolvedValue([mockUser]);
      prisma.user.count.mockResolvedValue(1);

      const result = await service.findAll('branch-123');

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('deve filtrar por filial', async () => {
      prisma.user.findMany.mockResolvedValue([mockUser]);
      prisma.user.count.mockResolvedValue(1);

      await service.findAll('branch-123');

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            branchId: 'branch-123',
          }),
        }),
      );
    });

    it('deve filtrar por employeeId', async () => {
      prisma.user.findMany.mockResolvedValue([mockUser]);
      prisma.user.count.mockResolvedValue(1);

      await service.findAll(undefined, false, 1, 15, 'employee-123');

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            employeeId: 'employee-123',
          }),
        }),
      );
    });

    it('deve incluir deletados quando solicitado', async () => {
      prisma.user.findMany.mockResolvedValue([{ ...mockUser, deletedAt: new Date() }]);
      prisma.user.count.mockResolvedValue(1);

      await service.findAll(undefined, true);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            deletedAt: null,
          }),
        }),
      );
    });

    it('deve aplicar paginação corretamente', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(50);

      const result = await service.findAll(undefined, false, 3, 10);

      expect(result.page).toBe(3);
      expect(result.totalPages).toBe(5);
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        }),
      );
    });

    it('deve ordenar por nome ascendente', async () => {
      prisma.user.findMany.mockResolvedValue([mockUser]);
      prisma.user.count.mockResolvedValue(1);

      await service.findAll();

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar usuário por ID', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.findOne('user-123');

      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
    });

    it('deve lançar NotFoundException quando usuário não existe', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('invalid-id')).rejects.toThrow('Usuário não encontrado');
    });
  });

  describe('update', () => {
    it('deve atualizar usuário com sucesso', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({
        ...mockUser,
        name: 'Nome Atualizado',
      });

      const result = await service.update('user-123', { name: 'Nome Atualizado' });

      expect(result.name).toBe('Nome Atualizado');
    });

    it('deve lançar NotFoundException quando usuário não existe', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.update('invalid-id', {})).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ConflictException quando novo email já existe', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, id: 'other-user' });

      await expect(service.update('user-123', { email: 'existing@example.com' })).rejects.toThrow(
        ConflictException,
      );
      await expect(service.update('user-123', { email: 'existing@example.com' })).rejects.toThrow(
        'Email já cadastrado',
      );
    });

    it('deve permitir manter o mesmo email', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);

      const result = await service.update('user-123', { email: mockUser.email });

      expect(result.email).toBe(mockUser.email);
    });

    it('deve lançar NotFoundException quando nova role não existe', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.role.findFirst.mockResolvedValue(null);

      await expect(service.update('user-123', { roleId: 'invalid-role' })).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update('user-123', { roleId: 'invalid-role' })).rejects.toThrow(
        'Cargo não encontrado ou inativo',
      );
    });

    it('deve fazer hash da nova senha', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);

      await service.update('user-123', { newPassword: 'newPassword123' });

      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 10);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: 'hashedPassword',
          }),
        }),
      );
    });

    it('deve validar filial ao atualizar branchId', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.branch.findFirst.mockResolvedValue(null);

      await expect(service.update('user-123', { branchId: 'invalid-branch' })).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update('user-123', { branchId: 'invalid-branch' })).rejects.toThrow(
        'Filial não encontrada',
      );
    });

    it('deve validar funcionário ao atualizar employeeId', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.employee.findFirst.mockResolvedValue(null);

      await expect(service.update('user-123', { employeeId: 'invalid-employee' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar ConflictException quando funcionário já está vinculado a outro usuário', async () => {
      prisma.user.findFirst.mockImplementation((args: any) => {
        // Se está buscando pelo ID, retorna o usuário atual
        if (args.where?.id) {
          return Promise.resolve(mockUser);
        }
        // Se está buscando por employeeId, retorna outro usuário
        if (args.where?.employeeId) {
          return Promise.resolve({ ...mockUser, id: 'other-user' });
        }
        return Promise.resolve(null);
      });
      prisma.employee.findFirst.mockResolvedValue(mockEmployee);

      await expect(service.update('user-123', { employeeId: 'employee-123' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('deve lançar ConflictException quando filial não pertence à empresa', async () => {
      const branchFromOtherCompany = { ...mockBranch, companyId: 'other-company' };

      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.branch.findFirst.mockResolvedValue(branchFromOtherCompany);

      await expect(service.update('user-123', { branchId: 'branch-123' })).rejects.toThrow(
        ConflictException,
      );
      await expect(service.update('user-123', { branchId: 'branch-123' })).rejects.toThrow(
        'Filial não pertence à empresa informada',
      );
    });

    it('deve lançar ConflictException quando funcionário é de empresa diferente', async () => {
      const employeeFromOtherCompany = { ...mockEmployee, companyId: 'other-company' };

      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.employee.findFirst.mockResolvedValue(employeeFromOtherCompany);

      await expect(service.update('user-123', { employeeId: 'employee-123' })).rejects.toThrow(
        ConflictException,
      );
      await expect(service.update('user-123', { employeeId: 'employee-123' })).rejects.toThrow(
        'Funcionário não pertence à mesma empresa do usuário',
      );
    });

    it('deve lançar ConflictException quando funcionário é de filial diferente', async () => {
      const employeeFromOtherBranch = { ...mockEmployee, branchId: 'other-branch' };

      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.employee.findFirst.mockResolvedValue(employeeFromOtherBranch);

      await expect(service.update('user-123', { employeeId: 'employee-123' })).rejects.toThrow(
        ConflictException,
      );
      await expect(service.update('user-123', { employeeId: 'employee-123' })).rejects.toThrow(
        'Filial do funcionário é diferente da filial do usuário',
      );
    });

    it('deve validar empresa ao atualizar companyId', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.company.findFirst.mockResolvedValue(null);

      await expect(service.update('user-123', { companyId: 'invalid-company' })).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update('user-123', { companyId: 'invalid-company' })).rejects.toThrow(
        'Empresa não encontrada',
      );
    });
  });

  describe('remove', () => {
    it('deve fazer soft delete do usuário', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ ...mockUser, deletedAt: new Date() });

      await service.remove('user-123');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('deve lançar NotFoundException quando usuário não existe', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(service.remove('invalid-id')).rejects.toThrow('Usuário não encontrado');
    });
  });
});
