import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MaintenanceLabelService } from './maintenance-label.service';
import { CreateMaintenanceLabelDto } from './dto/create-maintenance-label.dto';
import { RegisterProductChangeDto } from './dto/register-product-change.dto';
import { MaintenanceLabelResponseDto } from './dto/maintenance-label-response.dto';
import { MaintenanceDueByVehicleDto } from './dto/maintenance-due-by-vehicle.dto';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../../shared/guards/permission.guard';
import { RequirePermission } from '../../shared/decorators/require-permission.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@ApiTags('Maintenance Labels')
@Controller('maintenance-labels')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class MaintenanceLabelController {
  constructor(private readonly maintenanceLabelService: MaintenanceLabelService) {}

  @Post()
  @RequirePermission('maintenance-labels.create')
  @ApiOperation({ summary: 'Criar nova etiqueta de manutenção' })
  @ApiResponse({
    status: 201,
    description: 'Etiqueta criada com sucesso',
    type: MaintenanceLabelResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Veículo, filial ou produto não encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Produto sem "Troca em KM" definido',
  })
  create(
    @Body() createMaintenanceLabelDto: CreateMaintenanceLabelDto,
    @CurrentUser() user: any,
  ): Promise<MaintenanceLabelResponseDto> {
    return this.maintenanceLabelService.create(createMaintenanceLabelDto, user?.sub, user);
  }

  @Get()
  @RequirePermission('maintenance-labels.view')
  @ApiOperation({
    summary: 'Listar todas as etiquetas (com paginação e filtros)',
  })
  @ApiQuery({
    name: 'branchId',
    required: false,
    type: String,
    description: 'Filtrar por filial',
  })
  @ApiQuery({
    name: 'vehicleId',
    required: false,
    type: String,
    description: 'Filtrar por veículo',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Página (padrão: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Itens por página (padrão: 15)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de etiquetas',
    type: PaginatedResponseDto<MaintenanceLabelResponseDto>,
  })
  findAll(
    @Query('branchId') branchId?: string,
    @Query('vehicleId') vehicleId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedResponseDto<MaintenanceLabelResponseDto>> {
    return this.maintenanceLabelService.findAll(
      branchId,
      vehicleId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 15,
    );
  }

  @Get('due-by-vehicle')
  @RequirePermission('maintenance-labels.view')
  @ApiOperation({
    summary: 'Próximas trocas por veículo (status ok/warning/due conforme KM de referência)',
  })
  @ApiQuery({
    name: 'vehicleId',
    required: true,
    type: String,
    description: 'ID do veículo',
  })
  @ApiQuery({
    name: 'branchId',
    required: false,
    type: String,
    description: 'Filtrar marcação por filial',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de produtos com próxima troca e status',
    type: MaintenanceDueByVehicleDto,
  })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  getDueByVehicle(
    @Query('vehicleId') vehicleId: string,
    @Query('branchId') branchId?: string,
  ): Promise<MaintenanceDueByVehicleDto> {
    return this.maintenanceLabelService.getMaintenanceDueByVehicle(vehicleId, branchId);
  }

  @Get(':id')
  @RequirePermission('maintenance-labels.view')
  @ApiOperation({ summary: 'Buscar etiqueta por ID (para impressão)' })
  @ApiResponse({
    status: 200,
    description: 'Etiqueta encontrada',
    type: MaintenanceLabelResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Etiqueta não encontrada' })
  findOne(@Param('id') id: string): Promise<MaintenanceLabelResponseDto> {
    return this.maintenanceLabelService.findById(id);
  }

  @Delete(':id')
  @RequirePermission('maintenance-labels.delete')
  @ApiOperation({ summary: 'Excluir etiqueta' })
  @ApiResponse({ status: 200, description: 'Etiqueta excluída com sucesso' })
  @ApiResponse({ status: 404, description: 'Etiqueta não encontrada' })
  remove(@Param('id') id: string): Promise<void> {
    return this.maintenanceLabelService.delete(id);
  }

  @Post('register-change')
  @RequirePermission('maintenance-labels.register-change')
  @ApiOperation({
    summary: 'Registrar troca de produto realizada na estrada',
  })
  @ApiResponse({
    status: 201,
    description: 'Troca registrada com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Veículo, filial ou produto não encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Produto sem "Troca em KM" definido',
  })
  registerProductChange(
    @Body() registerProductChangeDto: RegisterProductChangeDto,
    @CurrentUser() user: any,
  ): Promise<{ orderId: string }> {
    return this.maintenanceLabelService.registerProductChange(
      registerProductChangeDto,
      user?.sub,
      user,
    );
  }
}
