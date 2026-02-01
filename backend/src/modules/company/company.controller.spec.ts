import { Test, TestingModule } from '@nestjs/testing';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';

describe('CompanyController', () => {
  let controller: CompanyController;
  let companyService: CompanyService;

  const mockCompanyService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockCompany = { id: 'company-1', name: 'Empresa Teste', cnpj: '12345678901234' };
  const mockCurrentUser = { sub: 'user-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyController],
      providers: [{ provide: CompanyService, useValue: mockCompanyService }],
    }).compile();

    controller = module.get<CompanyController>(CompanyController);
    companyService = module.get<CompanyService>(CompanyService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('deve criar uma empresa', async () => {
      const createDto = { name: 'Nova Empresa', cnpj: '12345678901234' };
      mockCompanyService.create.mockResolvedValue(mockCompany);

      const result = await controller.create(createDto, mockCurrentUser);

      expect(result).toEqual(mockCompany);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista paginada', async () => {
      const response = { data: [mockCompany], meta: { page: 1, total: 1 } };
      mockCompanyService.findAll.mockResolvedValue(response);

      const result = await controller.findAll();

      expect(result).toEqual(response);
    });
  });

  describe('findOne', () => {
    it('deve retornar uma empresa', async () => {
      mockCompanyService.findOne.mockResolvedValue(mockCompany);

      const result = await controller.findOne('company-1');

      expect(result).toEqual(mockCompany);
    });
  });

  describe('update', () => {
    it('deve atualizar uma empresa', async () => {
      const updateDto = { name: 'Atualizada' };
      mockCompanyService.update.mockResolvedValue({ ...mockCompany, ...updateDto });

      const result = await controller.update('company-1', updateDto);

      expect(result.name).toBe('Atualizada');
    });
  });

  describe('remove', () => {
    it('deve remover uma empresa', async () => {
      mockCompanyService.remove.mockResolvedValue(undefined);

      await controller.remove('company-1');

      expect(companyService.remove).toHaveBeenCalledWith('company-1');
    });
  });
});
