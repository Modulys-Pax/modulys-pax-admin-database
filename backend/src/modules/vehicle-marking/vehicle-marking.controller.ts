import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VehicleMarkingService } from './vehicle-marking.service';
import { CreateVehicleMarkingDto } from './dto/create-vehicle-marking.dto';
import { VehicleMarkingResponseDto } from './dto/vehicle-marking-response.dto';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../../shared/guards/permission.guard';
import { RequirePermission } from '../../shared/decorators/require-permission.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@ApiTags('Vehicle Markings')
@Controller('vehicle-markings')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class VehicleMarkingController {
  constructor(private readonly vehicleMarkingService: VehicleMarkingService) {}

  @Post()
  @RequirePermission('vehicle-markings.create')
  @ApiOperation({ summary: 'Criar nova marcação de veículo' })
  @ApiResponse({
    status: 201,
    description: 'Marcação criada com sucesso',
    type: VehicleMarkingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Veículo ou filial não encontrado' })
  create(
    @Body() createVehicleMarkingDto: CreateVehicleMarkingDto,
    @CurrentUser() user: any,
  ): Promise<VehicleMarkingResponseDto> {
    return this.vehicleMarkingService.create(createVehicleMarkingDto, user?.sub, user);
  }

  @Get()
  @RequirePermission('vehicle-markings.view')
  @ApiOperation({ summary: 'Listar todas as marcações (com paginação e filtros)' })
  @ApiQuery({
    name: 'branchId',
    required: false,
    type: String,
    description: 'Filtrar por filial',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Data inicial (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Data final (YYYY-MM-DD)',
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
    description: 'Lista de marcações',
    type: PaginatedResponseDto<VehicleMarkingResponseDto>,
  })
  findAll(
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedResponseDto<VehicleMarkingResponseDto>> {
    return this.vehicleMarkingService.findAll(
      branchId,
      startDate,
      endDate,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 15,
    );
  }

  @Get(':id')
  @RequirePermission('vehicle-markings.view')
  @ApiOperation({ summary: 'Buscar marcação por ID' })
  @ApiResponse({
    status: 200,
    description: 'Marcação encontrada',
    type: VehicleMarkingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Marcação não encontrada' })
  findOne(@Param('id') id: string): Promise<VehicleMarkingResponseDto> {
    return this.vehicleMarkingService.findById(id);
  }

  @Delete(':id')
  @RequirePermission('vehicle-markings.delete')
  @ApiOperation({ summary: 'Excluir marcação' })
  @ApiResponse({ status: 200, description: 'Marcação excluída com sucesso' })
  @ApiResponse({ status: 404, description: 'Marcação não encontrada' })
  remove(@Param('id') id: string, @CurrentUser() user: any): Promise<void> {
    return this.vehicleMarkingService.delete(id, user?.sub);
  }
}
