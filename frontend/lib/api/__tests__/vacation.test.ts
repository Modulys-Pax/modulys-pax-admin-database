import { vacationApi, Vacation, CreateVacationDto, VacationStatus } from '../vacation';
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

describe('vacationApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockVacation: Vacation = {
    id: 'vacation-123',
    employeeId: 'employee-123',
    employeeName: 'João Silva',
    startDate: '2024-07-01',
    endDate: '2024-07-30',
    days: 30,
    soldDays: 10,
    advance13thSalary: true,
    status: VacationStatus.APPROVED,
    monthlySalary: 3000,
    grossTotal: 5000,
    netTotal: 4500,
    companyId: 'company-123',
    branchId: 'branch-123',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  describe('getAll', () => {
    it('deve buscar todas as férias', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [mockVacation] });

      const result = await vacationApi.getAll();

      expect(mockApi.get).toHaveBeenCalledWith('/vacations?');
      expect(result).toEqual([mockVacation]);
    });

    it('deve filtrar por branchId', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [] });

      await vacationApi.getAll('branch-123');

      expect(mockApi.get).toHaveBeenCalledWith('/vacations?branchId=branch-123');
    });

    it('deve filtrar por employeeId', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [] });

      await vacationApi.getAll(undefined, 'employee-123');

      expect(mockApi.get).toHaveBeenCalledWith('/vacations?employeeId=employee-123');
    });

    it('deve filtrar por status', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [] });

      await vacationApi.getAll(undefined, undefined, 'APPROVED');

      expect(mockApi.get).toHaveBeenCalledWith('/vacations?status=APPROVED');
    });

    it('deve incluir deletados', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [] });

      await vacationApi.getAll(undefined, undefined, undefined, true);

      expect(mockApi.get).toHaveBeenCalledWith('/vacations?includeDeleted=true');
    });
  });

  describe('getById', () => {
    it('deve buscar férias por ID', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockVacation });

      const result = await vacationApi.getById('vacation-123');

      expect(mockApi.get).toHaveBeenCalledWith('/vacations/vacation-123');
      expect(result).toEqual(mockVacation);
    });
  });

  describe('create', () => {
    it('deve criar férias', async () => {
      const createDto: CreateVacationDto = {
        employeeId: 'employee-123',
        startDate: '2024-07-01',
        endDate: '2024-07-30',
        days: 30,
        soldDays: 10,
        advance13thSalary: true,
        companyId: 'company-123',
        branchId: 'branch-123',
      };
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockVacation });

      const result = await vacationApi.create(createDto);

      expect(mockApi.post).toHaveBeenCalledWith('/vacations', createDto);
      expect(result).toEqual(mockVacation);
    });
  });

  describe('update', () => {
    it('deve atualizar férias', async () => {
      const updateData = { status: VacationStatus.IN_PROGRESS };
      (mockApi.patch as jest.Mock).mockResolvedValueOnce({
        data: { ...mockVacation, status: VacationStatus.IN_PROGRESS },
      });

      const result = await vacationApi.update('vacation-123', updateData);

      expect(mockApi.patch).toHaveBeenCalledWith('/vacations/vacation-123', updateData);
      expect(result.status).toBe(VacationStatus.IN_PROGRESS);
    });
  });

  describe('delete', () => {
    it('deve deletar férias', async () => {
      (mockApi.delete as jest.Mock).mockResolvedValueOnce({});

      await vacationApi.delete('vacation-123');

      expect(mockApi.delete).toHaveBeenCalledWith('/vacations/vacation-123');
    });
  });
});
