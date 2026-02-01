/**
 * Utilitário de Compressão de Imagens no Cliente
 * 
 * VANTAGENS da compressão no cliente:
 * - Reduz uso de CPU/RAM do servidor
 * - Economiza banda de upload
 * - Melhora a experiência do usuário (upload mais rápido)
 * - Permite preview local antes do upload
 * 
 * FORMATOS SUPORTADOS:
 * - JPEG, PNG, GIF, WebP, BMP, AVIF, SVG, TIFF
 * - PDF (sem compressão, passa direto)
 */

import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  quality?: number;
  useWebWorker?: boolean;
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  wasCompressed: boolean;
}

const DEFAULT_IMAGE_OPTIONS: CompressionOptions = {
  maxSizeMB: 1, // Máximo 1MB após compressão
  maxWidthOrHeight: 1920, // Máximo 1920px em qualquer dimensão
  quality: 0.8, // 80% qualidade
  useWebWorker: true, // Usar Web Worker para não travar a UI
};

/**
 * Comprime uma imagem no cliente antes do upload
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const opts = { ...DEFAULT_IMAGE_OPTIONS, ...options };
  const originalSize = file.size;

  // Se a imagem já for menor que 200KB, não comprimir
  const minSizeToCompress = 200 * 1024; // 200KB
  if (originalSize < minSizeToCompress) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
      wasCompressed: false,
    };
  }

  try {
    const compressedFile = await imageCompression(file, {
      maxSizeMB: opts.maxSizeMB!,
      maxWidthOrHeight: opts.maxWidthOrHeight!,
      useWebWorker: opts.useWebWorker!,
      initialQuality: opts.quality,
      fileType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
    });

    const compressedSize = compressedFile.size;
    const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

    // Se a compressão não reduziu pelo menos 10%, manter original
    if (compressionRatio < 10) {
      return {
        file,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 0,
        wasCompressed: false,
      };
    }

    // Manter o nome original do arquivo
    const compressedWithName = new File([compressedFile], file.name, {
      type: compressedFile.type,
      lastModified: Date.now(),
    });

    return {
      file: compressedWithName,
      originalSize,
      compressedSize,
      compressionRatio,
      wasCompressed: true,
    };
  } catch (error) {
    console.error('Erro ao comprimir imagem:', error);
    // Em caso de erro, retornar arquivo original
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
      wasCompressed: false,
    };
  }
}

/**
 * Processa um arquivo (imagem ou PDF)
 */
export async function processMediaFile(
  file: File,
  options: CompressionOptions = {}
): Promise<{ file: File; error?: string; compressionInfo?: CompressionResult }> {
  const mimeType = file.type;

  // Imagens: comprimir (exceto SVG que é vetorial)
  if (mimeType.startsWith('image/') && mimeType !== 'image/svg+xml') {
    const result = await compressImage(file, options);
    return {
      file: result.file,
      compressionInfo: result,
    };
  }

  // SVG e PDFs: passar sem modificação
  return { file };
}

/**
 * Cria uma URL de preview para um arquivo de imagem
 */
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revoga uma URL de preview (liberar memória)
 */
export function revokeImagePreview(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Formata o tamanho do arquivo em formato legível
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Verifica se o arquivo é uma imagem
 */
export function isImage(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Verifica se o arquivo é um PDF
 */
export function isPDF(file: File): boolean {
  return file.type === 'application/pdf';
}
