import { Test, TestingModule } from '@nestjs/testing';
import { FileProcessingService } from './file-processing.service';

// Mock do módulo fs
jest.mock('fs', () => ({
  statSync: jest.fn(),
  unlinkSync: jest.fn(),
  renameSync: jest.fn(),
}));

// Mock do módulo path
jest.mock('path', () => ({
  isAbsolute: jest.fn((p) => p.startsWith('/')),
  join: jest.fn((...args) => args.join('/')),
  basename: jest.fn((p) => p.split('/').pop()),
  extname: jest.fn((p) => {
    const parts = p.split('.');
    return parts.length > 1 ? '.' + parts.pop() : '';
  }),
  dirname: jest.fn((p) => {
    const parts = p.split('/');
    parts.pop();
    return parts.join('/');
  }),
}));

import * as fs from 'fs';

describe('FileProcessingService', () => {
  let service: FileProcessingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileProcessingService],
    }).compile();

    service = module.get<FileProcessingService>(FileProcessingService);
    jest.clearAllMocks();
  });

  describe('processImage', () => {
    it('deve retornar arquivo original quando sharp não está disponível', async () => {
      (fs.statSync as jest.Mock).mockReturnValue({ size: 1000000 });

      const result = await service.processImage('/uploads/test.jpg', 'uploads/test.jpg');

      expect(result).toEqual({
        fileName: 'test.jpg',
        filePath: 'uploads/test.jpg',
        fileSize: 1000000,
        mimeType: 'image/jpeg',
        originalSize: 1000000,
        wasCompressed: false,
      });
    });

    it('deve retornar arquivo original quando menor que 500KB', async () => {
      (fs.statSync as jest.Mock).mockReturnValue({ size: 400000 }); // 400KB

      const result = await service.processImage('/uploads/small.jpg', 'uploads/small.jpg');

      expect(result).toEqual({
        fileName: 'small.jpg',
        filePath: 'uploads/small.jpg',
        fileSize: 400000,
        mimeType: 'image/jpeg',
        originalSize: 400000,
        wasCompressed: false,
      });
    });
  });

  describe('processFile', () => {
    it('deve processar arquivo de imagem chamando processImage', async () => {
      (fs.statSync as jest.Mock).mockReturnValue({ size: 300000 });

      const mockFile = {
        mimetype: 'image/jpeg',
        path: '/uploads/photo.jpg',
        originalname: 'photo.jpg',
      } as Express.Multer.File;

      const result = await service.processFile(mockFile, 'uploads/photo.jpg');

      expect(result.mimeType).toBe('image/jpeg');
    });

    it('deve retornar PDF sem compressão', async () => {
      (fs.statSync as jest.Mock).mockReturnValue({ size: 500000 });

      const mockFile = {
        mimetype: 'application/pdf',
        path: '/uploads/document.pdf',
        originalname: 'document.pdf',
      } as Express.Multer.File;

      const result = await service.processFile(mockFile, 'uploads/document.pdf');

      expect(result).toEqual({
        fileName: 'document.pdf',
        filePath: 'uploads/document.pdf',
        fileSize: 500000,
        mimeType: 'application/pdf',
        originalSize: 500000,
        wasCompressed: false,
      });
    });

    it('deve retornar SVG sem compressão', async () => {
      (fs.statSync as jest.Mock).mockReturnValue({ size: 100000 });

      const mockFile = {
        mimetype: 'image/svg+xml',
        path: '/uploads/icon.svg',
        originalname: 'icon.svg',
      } as Express.Multer.File;

      const result = await service.processFile(mockFile, 'uploads/icon.svg');

      expect(result).toEqual({
        fileName: 'icon.svg',
        filePath: 'uploads/icon.svg',
        fileSize: 100000,
        mimeType: 'image/svg+xml',
        originalSize: 100000,
        wasCompressed: false,
      });
    });
  });

  describe('getMimeType (via processImage)', () => {
    beforeEach(() => {
      (fs.statSync as jest.Mock).mockReturnValue({ size: 100 });
    });

    it('deve retornar image/jpeg para .jpg', async () => {
      const result = await service.processImage('/test.jpg', 'test.jpg');
      expect(result.mimeType).toBe('image/jpeg');
    });

    it('deve retornar image/jpeg para .jpeg', async () => {
      const result = await service.processImage('/test.jpeg', 'test.jpeg');
      expect(result.mimeType).toBe('image/jpeg');
    });

    it('deve retornar image/png para .png', async () => {
      const result = await service.processImage('/test.png', 'test.png');
      expect(result.mimeType).toBe('image/png');
    });

    it('deve retornar image/gif para .gif', async () => {
      const result = await service.processImage('/test.gif', 'test.gif');
      expect(result.mimeType).toBe('image/gif');
    });

    it('deve retornar image/webp para .webp', async () => {
      const result = await service.processImage('/test.webp', 'test.webp');
      expect(result.mimeType).toBe('image/webp');
    });

    it('deve retornar application/octet-stream para extensão desconhecida', async () => {
      const result = await service.processImage('/test.xyz', 'test.xyz');
      expect(result.mimeType).toBe('application/octet-stream');
    });
  });
});
