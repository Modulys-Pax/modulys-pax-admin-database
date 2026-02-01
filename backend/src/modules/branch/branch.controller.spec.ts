import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BranchController } from './branch.controller';
import { BranchService } from './branch.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

describe('BranchController', () => {
  let controller: BranchController;
  let branchService: BranchService;

  const mockBranchService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockBranch = {
    id: 'branch-1',
    name: 'Filial SP',
    address: 'Rua Teste, 123',
    phone: '11999999999',
    companyId: 'company-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    sub: 'user-1',
    email: 'admin@test.com',
    role: 'ADMIN',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BranchController],
      providers: [
        {
          provide: BranchService,
          useValue: mockBranchService,
        },
      ],
    }).compile();

    controller = module.get<BranchController>(BranchController);
    branchService = module.get<BranchService>(BranchService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar uma nova filial', async () => {
      const createDto: CreateBranchDto = {
        name: 'Filial SP',
        address: 'Rua Teste, 123',
        phone: '11999999999',
        companyId: 'company-1',
      };

      mockBranchService.create.mockResolvedValue(mockBranch);

      const result = await controller.create(createDto, mockUser);

      expect(result).toEqual(mockBranch);
      expect(branchService.create).toHaveBeenCalledWith(createDto, mockUser.sub);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista paginada de filiais', async () => {
      const paginatedResult = {
        data: [mockBranch],
        meta: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1,
        },
      };

      mockBranchService.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.findAll('false', '1', '50');

      expect(result).toEqual(paginatedResult);
      expect(branchService.findAll).toHaveBeenCalledWith(false, 1, 50);
    });

    it('deve incluir filiais excluídas quando solicitado', async () => {
      mockBranchService.findAll.mockResolvedValue({ data: [], meta: {} });

      await controller.findAll('true', '1', '10');

      expect(branchService.findAll).toHaveBeenCalledWith(true, 1, 10);
    });
  });

  describe('findOne', () => {
    it('deve retornar uma filial por ID', async () => {
      mockBranchService.findOne.mockResolvedValue(mockBranch);

      const result = await controller.findOne('branch-1');

      expect(result).toEqual(mockBranch);
      expect(branchService.findOne).toHaveBeenCalledWith('branch-1');
    });

    it('deve propagar erro quando filial não encontrada', async () => {
      mockBranchService.findOne.mockRejectedValue(new NotFoundException('Filial não encontrada'));

      await expect(controller.findOne('branch-999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('deve atualizar uma filial', async () => {
      const updateDto: UpdateBranchDto = {
        name: 'Filial SP Atualizada',
      };

      const updatedBranch = { ...mockBranch, ...updateDto };
      mockBranchService.update.mockResolvedValue(updatedBranch);

      const result = await controller.update('branch-1', updateDto);

      expect(result).toEqual(updatedBranch);
      expect(branchService.update).toHaveBeenCalledWith('branch-1', updateDto);
    });
  });

  describe('remove', () => {
    it('deve remover uma filial', async () => {
      mockBranchService.remove.mockResolvedValue(undefined);

      await controller.remove('branch-1');

      expect(branchService.remove).toHaveBeenCalledWith('branch-1');
    });
  });
});
