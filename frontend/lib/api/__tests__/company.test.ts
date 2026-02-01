import { companyApi, Company, CreateCompanyDto } from '../company';
import api from '../../axios';

jest.mock('../../axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('companyApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockCompany: Company = {
    id: 'company-123',
    name: 'Transportadora ABC',
    cnpj: '12.345.678/0001-90',
    tradeName: 'ABC Transportes',
    email: 'contato@abc.com',
    phone: '(11) 99999-9999',
    city: 'São Paulo',
    state: 'SP',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('getAll', () => {
    it('deve buscar todas as empresas', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [mockCompany] });

      const result = await companyApi.getAll();

      expect(mockApi.get).toHaveBeenCalledWith('/companies', {
        params: { includeDeleted: undefined },
      });
      expect(result).toEqual([mockCompany]);
    });

    it('deve incluir deletados quando solicitado', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [] });

      await companyApi.getAll(true);

      expect(mockApi.get).toHaveBeenCalledWith('/companies', {
        params: { includeDeleted: true },
      });
    });
  });

  describe('getById', () => {
    it('deve buscar empresa por ID', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockCompany });

      const result = await companyApi.getById('company-123');

      expect(mockApi.get).toHaveBeenCalledWith('/companies/company-123');
      expect(result).toEqual(mockCompany);
    });
  });

  describe('create', () => {
    it('deve criar empresa', async () => {
      const createDto: CreateCompanyDto = {
        name: 'Nova Empresa',
        cnpj: '98.765.432/0001-10',
        tradeName: 'Nova Empresa LTDA',
        email: 'contato@nova.com',
      };
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockCompany });

      const result = await companyApi.create(createDto);

      expect(mockApi.post).toHaveBeenCalledWith('/companies', createDto);
      expect(result).toEqual(mockCompany);
    });
  });

  describe('update', () => {
    it('deve atualizar empresa', async () => {
      const updateData = { name: 'ABC Transportes Atualizada' };
      (mockApi.patch as jest.Mock).mockResolvedValueOnce({
        data: { ...mockCompany, name: 'ABC Transportes Atualizada' },
      });

      const result = await companyApi.update('company-123', updateData);

      expect(mockApi.patch).toHaveBeenCalledWith('/companies/company-123', updateData);
      expect(result.name).toBe('ABC Transportes Atualizada');
    });

    it('deve desativar empresa', async () => {
      const updateData = { active: false };
      (mockApi.patch as jest.Mock).mockResolvedValueOnce({
        data: { ...mockCompany, active: false },
      });

      const result = await companyApi.update('company-123', updateData);

      expect(mockApi.patch).toHaveBeenCalledWith('/companies/company-123', updateData);
      expect(result.active).toBe(false);
    });
  });

  describe('delete', () => {
    it('deve deletar empresa', async () => {
      (mockApi.delete as jest.Mock).mockResolvedValueOnce({});

      await companyApi.delete('company-123');

      expect(mockApi.delete).toHaveBeenCalledWith('/companies/company-123');
    });
  });
});
