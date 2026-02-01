import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Res,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { VehicleDocumentService } from './vehicle-document.service';
import { CreateVehicleDocumentDto } from './dto/create-vehicle-document.dto';
import { UpdateVehicleDocumentDto } from './dto/update-vehicle-document.dto';
import { VehicleDocumentResponseDto } from './dto/vehicle-document-response.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../../shared/guards/permission.guard';
import { RequirePermission } from '../../shared/decorators/require-permission.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Response } from 'express';

@ApiTags('Vehicle Documents')
@Controller('vehicles/:vehicleId/documents')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class VehicleDocumentController {
  constructor(private readonly vehicleDocumentService: VehicleDocumentService) {}

  @Post()
  @RequirePermission('vehicle-documents.create')
  @ApiOperation({ summary: 'Upload de documento do veículo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        type: {
          type: 'string',
          enum: ['CRVL', 'LICENSING'],
          description: 'Tipo do documento',
        },
        description: {
          type: 'string',
          description: 'Descrição opcional do documento',
        },
        expiryDate: {
          type: 'string',
          format: 'date',
          description: 'Data de validade (para licenciamentos)',
        },
      },
      required: ['file', 'type'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Documento enviado com sucesso',
    type: VehicleDocumentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Param('vehicleId') vehicleId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /(pdf|image\/.*)/ }),
        ],
      }),
    )
    file: any,
    @Body() createDto: CreateVehicleDocumentDto,
    @CurrentUser() user: any,
  ): Promise<VehicleDocumentResponseDto> {
    return this.vehicleDocumentService.uploadDocument(vehicleId, file, createDto, user?.sub);
  }

  @Get()
  @RequirePermission('vehicle-documents.view')
  @ApiOperation({ summary: 'Listar documentos de um veículo' })
  @ApiResponse({
    status: 200,
    description: 'Lista de documentos',
    type: [VehicleDocumentResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  async findAll(@Param('vehicleId') vehicleId: string): Promise<VehicleDocumentResponseDto[]> {
    return this.vehicleDocumentService.findByVehicle(vehicleId);
  }

  @Get(':id')
  @RequirePermission('vehicle-documents.view')
  @ApiOperation({ summary: 'Buscar documento por ID' })
  @ApiResponse({
    status: 200,
    description: 'Documento encontrado',
    type: VehicleDocumentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Documento não encontrado' })
  async findOne(@Param('id') id: string): Promise<VehicleDocumentResponseDto> {
    return this.vehicleDocumentService.findOne(id);
  }

  @Get(':id/download')
  @RequirePermission('vehicle-documents.download')
  @ApiOperation({ summary: 'Download de documento' })
  @ApiResponse({
    status: 200,
    description: 'Download do arquivo',
  })
  @ApiResponse({ status: 404, description: 'Documento não encontrado' })
  async download(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const { file, fileName, mimeType } = await this.vehicleDocumentService.downloadDocument(id);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.send(file);
  }

  @Patch(':id')
  @RequirePermission('vehicle-documents.update')
  @ApiOperation({ summary: 'Atualizar documento' })
  @ApiResponse({
    status: 200,
    description: 'Documento atualizado com sucesso',
    type: VehicleDocumentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Documento não encontrado' })
  async update(
    @Param('vehicleId') vehicleId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateVehicleDocumentDto,
  ): Promise<VehicleDocumentResponseDto> {
    return this.vehicleDocumentService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermission('vehicle-documents.delete')
  @ApiOperation({ summary: 'Excluir documento' })
  @ApiResponse({ status: 200, description: 'Documento excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Documento não encontrado' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.vehicleDocumentService.delete(id);
  }
}
