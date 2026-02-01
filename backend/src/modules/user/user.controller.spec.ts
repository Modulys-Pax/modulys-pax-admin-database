import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;

  const mockUserService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@test.com',
    name: 'Test User',
    roleId: 'role-1',
    branchId: 'branch-1',
  };

  const mockCurrentUser = { sub: 'admin-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('deve criar um usuário', async () => {
      const createDto = {
        email: 'test@test.com',
        name: 'Test',
        password: '123456',
        roleId: 'role-1',
        branchId: 'branch-1',
        companyId: 'company-1',
      };
      mockUserService.create.mockResolvedValue(mockUser);

      const result = await controller.create(createDto, mockCurrentUser);

      expect(result).toEqual(mockUser);
      expect(userService.create).toHaveBeenCalledWith(createDto, 'admin-1');
    });
  });

  describe('findAll', () => {
    it('deve retornar lista paginada', async () => {
      const response = { data: [mockUser], meta: { page: 1, limit: 50, total: 1 } };
      mockUserService.findAll.mockResolvedValue(response);

      const result = await controller.findAll('branch-1', 'false', '1', '50');

      expect(result).toEqual(response);
      expect(userService.findAll).toHaveBeenCalledWith('branch-1', false, 1, 50, undefined);
    });

    it('deve filtrar por employeeId', async () => {
      mockUserService.findAll.mockResolvedValue({ data: [], meta: {} });

      await controller.findAll(undefined, undefined, undefined, undefined, 'emp-1');

      expect(userService.findAll).toHaveBeenCalledWith(undefined, false, 1, 50, 'emp-1');
    });
  });

  describe('findOne', () => {
    it('deve retornar um usuário', async () => {
      mockUserService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne('user-1');

      expect(result).toEqual(mockUser);
    });

    it('deve propagar erro quando não encontrado', async () => {
      mockUserService.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('user-999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('deve atualizar um usuário', async () => {
      const updateDto = { name: 'Updated' };
      mockUserService.update.mockResolvedValue({ ...mockUser, ...updateDto });

      const result = await controller.update('user-1', updateDto);

      expect(result.name).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('deve remover um usuário', async () => {
      mockUserService.remove.mockResolvedValue(undefined);

      await controller.remove('user-1');

      expect(userService.remove).toHaveBeenCalledWith('user-1');
    });
  });
});
