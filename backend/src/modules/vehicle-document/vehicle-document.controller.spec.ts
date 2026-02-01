import { Test, TestingModule } from '@nestjs/testing';
import { VehicleDocumentController } from './vehicle-document.controller';
import { VehicleDocumentService } from './vehicle-document.service';

describe('VehicleDocumentController', () => {
  let controller: VehicleDocumentController;
  let service: VehicleDocumentService;

  const mockService = {
    uploadDocument: jest.fn(),
    findByVehicle: jest.fn(),
    findOne: jest.fn(),
    downloadDocument: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockDocument = {
    id: 'doc-1',
    vehicleId: 'vehicle-1',
    type: 'CRVL',
    fileName: 'crvl.pdf',
  };

  const mockCurrentUser = { sub: 'user-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehicleDocumentController],
      providers: [{ provide: VehicleDocumentService, useValue: mockService }],
    }).compile();

    controller = module.get<VehicleDocumentController>(VehicleDocumentController);
    service = module.get<VehicleDocumentService>(VehicleDocumentService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('upload', () => {
    it('deve fazer upload de um documento', async () => {
      const file = { originalname: 'crvl.pdf', buffer: Buffer.from('test') };
      const createDto = { type: 'CRVL' as any };
      mockService.uploadDocument.mockResolvedValue(mockDocument);

      const result = await controller.upload('vehicle-1', file, createDto, mockCurrentUser);

      expect(result).toEqual(mockDocument);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de documentos do veículo', async () => {
      mockService.findByVehicle.mockResolvedValue([mockDocument]);

      const result = await controller.findAll('vehicle-1');

      expect(result).toEqual([mockDocument]);
    });
  });

  describe('findOne', () => {
    it('deve retornar um documento', async () => {
      mockService.findOne.mockResolvedValue(mockDocument);

      const result = await controller.findOne('doc-1');

      expect(result).toEqual(mockDocument);
    });
  });

  describe('update', () => {
    it('deve atualizar um documento', async () => {
      const updateDto = { description: 'CRVL atualizado' };
      mockService.update.mockResolvedValue({ ...mockDocument, ...updateDto });

      const result = await controller.update('vehicle-1', 'doc-1', updateDto);

      expect(result.description).toBe('CRVL atualizado');
    });
  });

  describe('remove', () => {
    it('deve remover um documento', async () => {
      mockService.delete.mockResolvedValue(undefined);

      await controller.remove('doc-1');

      expect(service.delete).toHaveBeenCalledWith('doc-1');
    });
  });
});
