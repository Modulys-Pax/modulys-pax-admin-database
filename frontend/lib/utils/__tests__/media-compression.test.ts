import {
  compressImage,
  processMediaFile,
  createImagePreview,
  revokeImagePreview,
  formatFileSize,
  isImage,
  isPDF,
} from '../media-compression';

// Mock do browser-image-compression
jest.mock('browser-image-compression', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock do URL
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();

Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  },
  writable: true,
});

describe('media-compression', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateObjectURL.mockReturnValue('blob:http://localhost/mock-url');
  });

  describe('formatFileSize', () => {
    it('deve formatar 0 bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
    });

    it('deve formatar bytes', () => {
      expect(formatFileSize(500)).toBe('500 Bytes');
    });

    it('deve formatar KB', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(2048)).toBe('2 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('deve formatar MB', () => {
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(2097152)).toBe('2 MB');
      expect(formatFileSize(5242880)).toBe('5 MB');
    });

    it('deve formatar GB', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB');
      expect(formatFileSize(2147483648)).toBe('2 GB');
    });

    it('deve formatar com decimais corretos', () => {
      expect(formatFileSize(1500000)).toBe('1.43 MB');
      expect(formatFileSize(256000)).toBe('250 KB');
    });
  });

  describe('isImage', () => {
    it('deve retornar true para imagens', () => {
      const jpegFile = new File([''], 'image.jpg', { type: 'image/jpeg' });
      const pngFile = new File([''], 'image.png', { type: 'image/png' });
      const gifFile = new File([''], 'image.gif', { type: 'image/gif' });
      const webpFile = new File([''], 'image.webp', { type: 'image/webp' });

      expect(isImage(jpegFile)).toBe(true);
      expect(isImage(pngFile)).toBe(true);
      expect(isImage(gifFile)).toBe(true);
      expect(isImage(webpFile)).toBe(true);
    });

    it('deve retornar false para não-imagens', () => {
      const pdfFile = new File([''], 'document.pdf', { type: 'application/pdf' });
      const textFile = new File([''], 'text.txt', { type: 'text/plain' });

      expect(isImage(pdfFile)).toBe(false);
      expect(isImage(textFile)).toBe(false);
    });
  });

  describe('isPDF', () => {
    it('deve retornar true para PDFs', () => {
      const pdfFile = new File([''], 'document.pdf', { type: 'application/pdf' });
      expect(isPDF(pdfFile)).toBe(true);
    });

    it('deve retornar false para não-PDFs', () => {
      const imageFile = new File([''], 'image.jpg', { type: 'image/jpeg' });
      const textFile = new File([''], 'text.txt', { type: 'text/plain' });

      expect(isPDF(imageFile)).toBe(false);
      expect(isPDF(textFile)).toBe(false);
    });
  });

  describe('createImagePreview', () => {
    it('deve criar URL de preview', () => {
      const file = new File(['content'], 'image.jpg', { type: 'image/jpeg' });
      
      const result = createImagePreview(file);

      expect(mockCreateObjectURL).toHaveBeenCalledWith(file);
      expect(result).toBe('blob:http://localhost/mock-url');
    });
  });

  describe('revokeImagePreview', () => {
    it('deve revogar URL de preview', () => {
      const url = 'blob:http://localhost/mock-url';
      
      revokeImagePreview(url);

      expect(mockRevokeObjectURL).toHaveBeenCalledWith(url);
    });
  });

  describe('compressImage', () => {
    const imageCompression = require('browser-image-compression').default;

    it('deve retornar arquivo original se menor que 200KB', async () => {
      const smallFile = new File(['small content'], 'small.jpg', { type: 'image/jpeg' });
      Object.defineProperty(smallFile, 'size', { value: 100 * 1024 }); // 100KB

      const result = await compressImage(smallFile);

      expect(result.wasCompressed).toBe(false);
      expect(result.file).toBe(smallFile);
      expect(result.originalSize).toBe(100 * 1024);
      expect(result.compressedSize).toBe(100 * 1024);
      expect(result.compressionRatio).toBe(0);
      expect(imageCompression).not.toHaveBeenCalled();
    });

    it('deve comprimir imagem maior que 200KB', async () => {
      const largeFile = new File(['large content'], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(largeFile, 'size', { value: 500 * 1024 }); // 500KB

      const compressedBlob = new Blob(['compressed']);
      Object.defineProperty(compressedBlob, 'size', { value: 250 * 1024 }); // 250KB
      Object.defineProperty(compressedBlob, 'type', { value: 'image/jpeg' });

      imageCompression.mockResolvedValueOnce(compressedBlob);

      const result = await compressImage(largeFile);

      expect(imageCompression).toHaveBeenCalledWith(largeFile, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: 0.8,
        fileType: 'image/jpeg',
      });
      expect(result.wasCompressed).toBe(true);
      expect(result.originalSize).toBe(500 * 1024);
      expect(result.compressedSize).toBe(250 * 1024);
      expect(result.compressionRatio).toBe(50);
    });

    it('deve retornar original se compressão for menor que 10%', async () => {
      const file = new File(['content'], 'image.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 500 * 1024 }); // 500KB

      const compressedBlob = new Blob(['slightly compressed']);
      Object.defineProperty(compressedBlob, 'size', { value: 480 * 1024 }); // 480KB (4% reduction)
      Object.defineProperty(compressedBlob, 'type', { value: 'image/jpeg' });

      imageCompression.mockResolvedValueOnce(compressedBlob);

      const result = await compressImage(file);

      expect(result.wasCompressed).toBe(false);
      expect(result.file).toBe(file);
      expect(result.compressionRatio).toBe(0);
    });

    it('deve retornar arquivo original em caso de erro', async () => {
      const file = new File(['content'], 'image.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 500 * 1024 });

      imageCompression.mockRejectedValueOnce(new Error('Compression failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await compressImage(file);

      expect(result.wasCompressed).toBe(false);
      expect(result.file).toBe(file);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('deve usar opções customizadas', async () => {
      const file = new File(['content'], 'image.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 500 * 1024 });

      const compressedBlob = new Blob(['compressed']);
      Object.defineProperty(compressedBlob, 'size', { value: 200 * 1024 });
      Object.defineProperty(compressedBlob, 'type', { value: 'image/png' });

      imageCompression.mockResolvedValueOnce(compressedBlob);

      await compressImage(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1280,
        quality: 0.7,
      });

      expect(imageCompression).toHaveBeenCalledWith(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
        initialQuality: 0.7,
        fileType: 'image/png',
      });
    });
  });

  describe('processMediaFile', () => {
    const imageCompression = require('browser-image-compression').default;

    beforeEach(() => {
      imageCompression.mockReset();
    });

    it('deve processar imagem e comprimir', async () => {
      const imageFile = new File(['content'], 'image.jpg', { type: 'image/jpeg' });
      Object.defineProperty(imageFile, 'size', { value: 500 * 1024 });

      const compressedBlob = new Blob(['compressed']);
      Object.defineProperty(compressedBlob, 'size', { value: 250 * 1024 });
      Object.defineProperty(compressedBlob, 'type', { value: 'image/jpeg' });

      imageCompression.mockResolvedValueOnce(compressedBlob);

      const result = await processMediaFile(imageFile);

      expect(result.compressionInfo).toBeDefined();
      expect(result.compressionInfo?.wasCompressed).toBe(true);
    });

    it('deve passar PDF sem modificação', async () => {
      const pdfFile = new File(['pdf content'], 'document.pdf', { type: 'application/pdf' });

      const result = await processMediaFile(pdfFile);

      expect(result.file).toBe(pdfFile);
      expect(result.compressionInfo).toBeUndefined();
      expect(imageCompression).not.toHaveBeenCalled();
    });

    it('deve passar SVG sem modificação', async () => {
      const svgFile = new File(['<svg></svg>'], 'image.svg', { type: 'image/svg+xml' });

      const result = await processMediaFile(svgFile);

      expect(result.file).toBe(svgFile);
      expect(result.compressionInfo).toBeUndefined();
      expect(imageCompression).not.toHaveBeenCalled();
    });

    it('deve processar diferentes tipos de imagem', async () => {
      const pngFile = new File(['content'], 'image.png', { type: 'image/png' });
      Object.defineProperty(pngFile, 'size', { value: 500 * 1024 });

      const compressedBlob = new Blob(['compressed']);
      Object.defineProperty(compressedBlob, 'size', { value: 250 * 1024 });
      Object.defineProperty(compressedBlob, 'type', { value: 'image/png' });

      imageCompression.mockResolvedValueOnce(compressedBlob);

      const result = await processMediaFile(pngFile);

      expect(result.compressionInfo).toBeDefined();
    });

    it('deve usar opções customizadas na compressão', async () => {
      const imageFile = new File(['content'], 'image.jpg', { type: 'image/jpeg' });
      Object.defineProperty(imageFile, 'size', { value: 500 * 1024 });

      const compressedBlob = new Blob(['compressed']);
      Object.defineProperty(compressedBlob, 'size', { value: 250 * 1024 });
      Object.defineProperty(compressedBlob, 'type', { value: 'image/jpeg' });

      imageCompression.mockResolvedValueOnce(compressedBlob);

      await processMediaFile(imageFile, { maxSizeMB: 0.5 });

      expect(imageCompression).toHaveBeenCalledWith(imageFile, expect.objectContaining({
        maxSizeMB: 0.5,
      }));
    });

    it('deve processar imagem pequena sem comprimir', async () => {
      const smallImage = new File(['small'], 'small.jpg', { type: 'image/jpeg' });
      Object.defineProperty(smallImage, 'size', { value: 100 * 1024 }); // 100KB

      const result = await processMediaFile(smallImage);

      expect(result.compressionInfo).toBeDefined();
      expect(result.compressionInfo?.wasCompressed).toBe(false);
      expect(imageCompression).not.toHaveBeenCalled();
    });
  });
});
