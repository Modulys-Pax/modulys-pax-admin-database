import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface ProcessedFile {
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  originalSize: number;
  wasCompressed: boolean;
}

export interface FileProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxFileSizeMB?: number;
}

const DEFAULT_OPTIONS: FileProcessingOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 80,
  maxFileSizeMB: 5,
};

@Injectable()
export class FileProcessingService {
  private readonly logger = new Logger(FileProcessingService.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private sharp: any = null;
  private sharpLoadAttempted = false;

  /**
   * Carrega Sharp sob demanda (lazy loading)
   */
  private async loadSharp(): Promise<boolean> {
    if (this.sharp) return true;
    if (this.sharpLoadAttempted) return false;

    this.sharpLoadAttempted = true;
    try {
      const sharpModule = await import('sharp');
      this.sharp = sharpModule.default;
      this.logger.log('Sharp carregado com sucesso para compressão de imagens');
      return true;
    } catch (error) {
      this.logger.warn(`Sharp não pôde ser carregado: ${error.message}`);
      return false;
    }
  }

  /**
   * Processa e comprime um arquivo de imagem
   */
  async processImage(
    absoluteFilePath: string,
    relativePath: string,
    options: FileProcessingOptions = {},
  ): Promise<ProcessedFile> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const absolutePath = path.isAbsolute(absoluteFilePath)
      ? absoluteFilePath
      : path.join(process.cwd(), absoluteFilePath);

    const fileStats = fs.statSync(absolutePath);
    const originalSize = fileStats.size;
    const originalFileName = path.basename(absolutePath);
    const ext = path.extname(absolutePath).toLowerCase();
    const dir = path.dirname(absolutePath);

    // Tentar carregar sharp (lazy loading)
    const sharpAvailable = await this.loadSharp();
    if (!sharpAvailable) {
      this.logger.warn('Sharp não disponível, retornando arquivo original');
      return {
        fileName: originalFileName,
        filePath: relativePath,
        fileSize: originalSize,
        mimeType: this.getMimeType(ext),
        originalSize,
        wasCompressed: false,
      };
    }

    // Se o arquivo já for pequeno o suficiente (menor que 500KB), não comprimir
    const minSizeToCompress = 500 * 1024; // 500KB
    if (originalSize < minSizeToCompress) {
      this.logger.log(
        `Arquivo ${originalFileName} já é pequeno (${this.formatBytes(originalSize)}), pulando compressão`,
      );
      return {
        fileName: originalFileName,
        filePath: relativePath,
        fileSize: originalSize,
        mimeType: this.getMimeType(ext),
        originalSize,
        wasCompressed: false,
      };
    }

    try {
      // Ler metadados da imagem
      const metadata = await this.sharp(absolutePath).metadata();
      this.logger.log(
        `Processando imagem: ${originalFileName} (${metadata.width}x${metadata.height}, ${this.formatBytes(originalSize)})`,
      );

      // Garantir valores padrão
      const maxWidth = opts.maxWidth!;
      const maxHeight = opts.maxHeight!;

      // Calcular dimensões de redimensionamento mantendo proporção
      let width = metadata.width || maxWidth;
      let height = metadata.height || maxHeight;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Gerar nome do arquivo comprimido
      const compressedFileName = `compressed_${originalFileName}`;
      const compressedPath = path.join(dir, compressedFileName);

      // Processar imagem baseado no formato
      let sharpInstance = this.sharp(absolutePath).resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      });

      // Garantir qualidade padrão
      const quality = opts.quality!;

      // Aplicar compressão baseada no formato
      if (ext === '.jpg' || ext === '.jpeg') {
        sharpInstance = sharpInstance.jpeg({
          quality,
          mozjpeg: true,
        });
      } else if (ext === '.png') {
        sharpInstance = sharpInstance.png({
          quality,
          compressionLevel: 9,
        });
      } else if (ext === '.webp') {
        sharpInstance = sharpInstance.webp({
          quality,
        });
      } else if (ext === '.gif') {
        // GIF: converter para WebP para melhor compressão
        sharpInstance = sharpInstance.webp({
          quality,
        });
      }

      // Salvar arquivo comprimido
      await sharpInstance.toFile(compressedPath);

      // Verificar tamanho do arquivo comprimido
      const compressedStats = fs.statSync(compressedPath);
      const compressedSize = compressedStats.size;

      // Se a compressão não reduziu significativamente (menos de 10%), manter original
      const compressionRatio = (originalSize - compressedSize) / originalSize;
      if (compressionRatio < 0.1) {
        this.logger.log(
          `Compressão mínima (${(compressionRatio * 100).toFixed(1)}%), mantendo original`,
        );
        fs.unlinkSync(compressedPath);
        return {
          fileName: originalFileName,
          filePath: relativePath,
          fileSize: originalSize,
          mimeType: this.getMimeType(ext),
          originalSize,
          wasCompressed: false,
        };
      }

      // Remover arquivo original e renomear comprimido
      fs.unlinkSync(absolutePath);
      fs.renameSync(compressedPath, absolutePath);

      this.logger.log(
        `Imagem comprimida: ${this.formatBytes(originalSize)} -> ${this.formatBytes(compressedSize)} (${(compressionRatio * 100).toFixed(1)}% redução)`,
      );

      return {
        fileName: originalFileName,
        filePath: relativePath,
        fileSize: compressedSize,
        mimeType: this.getMimeType(ext),
        originalSize,
        wasCompressed: true,
      };
    } catch (error) {
      this.logger.error(`Erro ao processar imagem: ${error.message}`);
      // Em caso de erro, retornar arquivo original
      return {
        fileName: originalFileName,
        filePath: relativePath,
        fileSize: originalSize,
        mimeType: this.getMimeType(ext),
        originalSize,
        wasCompressed: false,
      };
    }
  }

  /**
   * Processa um arquivo (imagem ou PDF)
   */
  async processFile(
    file: Express.Multer.File,
    relativePath: string,
    options: FileProcessingOptions = {},
  ): Promise<ProcessedFile> {
    const mimeType = file.mimetype;
    const absolutePath = file.path;

    // Se for imagem (exceto SVG), aplicar compressão
    if (mimeType.startsWith('image/') && mimeType !== 'image/svg+xml') {
      return this.processImage(absolutePath, relativePath, options);
    }

    // Para SVG, PDF e outros tipos, retornar como está
    const fileStats = fs.statSync(absolutePath);

    return {
      fileName: file.originalname,
      filePath: relativePath,
      fileSize: fileStats.size,
      mimeType: mimeType,
      originalSize: fileStats.size,
      wasCompressed: false,
    };
  }

  /**
   * Obtém o MIME type baseado na extensão
   */
  private getMimeType(ext: string): string {
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.avif': 'image/avif',
      '.svg': 'image/svg+xml',
      '.tiff': 'image/tiff',
      '.tif': 'image/tiff',
      '.pdf': 'application/pdf',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Formata bytes para string legível
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
