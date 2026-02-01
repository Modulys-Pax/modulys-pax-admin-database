import { roleApi, Role, CreateRoleDto, PermissionModule } from '../role';
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

describe('roleApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockRole: Role = {
    id: 'role-123',
    name: 'Gerente',
    description: 'Gerente de filial',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    permissions: [
      { id: 'perm-1', name: 'vehicles.view', description: 'Ver veículos', module: 'vehicles', action: 'view' },
    ],
  };

  describe('getAll', () => {
    it('deve buscar todas as roles', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [mockRole] });

      const result = await roleApi.getAll();

      expect(mockApi.get).toHaveBeenCalledWith('/roles', {
        params: { includeInactive: undefined },
      });
      expect(result).toEqual([mockRole]);
    });

    it('deve incluir inativos quando solicitado', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [] });

      await roleApi.getAll(true);

      expect(mockApi.get).toHaveBeenCalledWith('/roles', {
        params: { includeInactive: true },
      });
    });
  });

  describe('getById', () => {
    it('deve buscar role por ID', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockRole });

      const result = await roleApi.getById('role-123');

      expect(mockApi.get).toHaveBeenCalledWith('/roles/role-123');
      expect(result).toEqual(mockRole);
    });
  });

  describe('create', () => {
    it('deve criar role', async () => {
      const createDto: CreateRoleDto = {
        name: 'Operador',
        description: 'Operador de sistema',
        permissions: ['vehicles.view', 'products.view'],
      };
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockRole });

      const result = await roleApi.create(createDto);

      expect(mockApi.post).toHaveBeenCalledWith('/roles', createDto);
      expect(result).toEqual(mockRole);
    });
  });

  describe('update', () => {
    it('deve atualizar role', async () => {
      const updateData = { name: 'Gerente Senior', permissions: ['vehicles.view', 'vehicles.create'] };
      (mockApi.patch as jest.Mock).mockResolvedValueOnce({
        data: { ...mockRole, name: 'Gerente Senior' },
      });

      const result = await roleApi.update('role-123', updateData);

      expect(mockApi.patch).toHaveBeenCalledWith('/roles/role-123', updateData);
      expect(result.name).toBe('Gerente Senior');
    });
  });

  describe('delete', () => {
    it('deve deletar role', async () => {
      (mockApi.delete as jest.Mock).mockResolvedValueOnce({});

      await roleApi.delete('role-123');

      expect(mockApi.delete).toHaveBeenCalledWith('/roles/role-123');
    });
  });

  describe('getAllPermissions', () => {
    it('deve buscar todas as permissões agrupadas', async () => {
      const mockPermissions: PermissionModule[] = [
        {
          module: 'vehicles',
          moduleName: 'Veículos',
          permissions: [
            { name: 'vehicles.view', description: 'Ver veículos', module: 'vehicles', action: 'view' },
            { name: 'vehicles.create', description: 'Criar veículos', module: 'vehicles', action: 'create' },
          ],
        },
      ];
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockPermissions });

      const result = await roleApi.getAllPermissions();

      expect(mockApi.get).toHaveBeenCalledWith('/roles/permissions');
      expect(result).toEqual(mockPermissions);
    });
  });

  describe('syncPermissions', () => {
    it('deve sincronizar permissões', async () => {
      const mockResponse = { message: 'Permissões sincronizadas com sucesso' };
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const result = await roleApi.syncPermissions();

      expect(mockApi.post).toHaveBeenCalledWith('/roles/sync-permissions');
      expect(result.message).toBe('Permissões sincronizadas com sucesso');
    });
  });
});
