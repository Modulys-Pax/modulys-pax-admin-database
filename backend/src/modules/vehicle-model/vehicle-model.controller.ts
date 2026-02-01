import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VehicleModelService } from './vehicle-model.service';
import { VehicleModelResponseDto } from './dto/vehicle-model-response.dto';
import { CreateVehicleModelDto } from './dto/create-vehicle-model.dto';
import { UpdateVehicleModelDto } from './dto/update-vehicle-model.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../../shared/guards/permission.guard';
import { RequirePermission } from '../../shared/decorators/require-permission.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@ApiTags('Vehicle Models')
@Controller('vehicle-models')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class VehicleModelController {
  constructor(private readonly vehicleModelService: VehicleModelService) {}

  @Get()
  @RequirePermission('vehicle-models.view')
  @ApiOperation({ summary: 'Listar todos os modelos de veículos' })
  @ApiQuery({
    name: 'brandId',
    required: false,
    type: String,
    description: 'Filtrar por marca',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Incluir modelos inativos',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de modelos de veículos',
    type: [VehicleModelResponseDto],
  })
  findAll(
    @Query('brandId') brandId?: string,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<VehicleModelResponseDto[]> {
    const include = includeInactive === 'true';
    return this.vehicleModelService.findAll(brandId, include);
  }

  @Get(':id')
  @RequirePermission('vehicle-models.view')
  @ApiOperation({ summary: 'Obter modelo por ID' })
  @ApiResponse({
    status: 200,
    description: 'Modelo encontrado',
    type: VehicleModelResponseDto,
  })
  findOne(@Param('id') id: string): Promise<VehicleModelResponseDto> {
    return this.vehicleModelService.findOne(id);
  }

  @Post()
  @RequirePermission('vehicle-models.create')
  @ApiOperation({ summary: 'Criar novo modelo de veículo' })
  @ApiResponse({
    status: 201,
    description: 'Modelo criado com sucesso',
    type: VehicleModelResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Marca não encontrada' })
  @ApiResponse({ status: 409, description: 'Modelo já cadastrado para esta marca' })
  create(
    @Body() createVehicleModelDto: CreateVehicleModelDto,
    @CurrentUser() user: any,
  ): Promise<VehicleModelResponseDto> {
    return this.vehicleModelService.create(createVehicleModelDto);
  }

  @Patch(':id')
  @RequirePermission('vehicle-models.update')
  @ApiOperation({ summary: 'Atualizar modelo de veículo' })
  @ApiResponse({
    status: 200,
    description: 'Modelo atualizado com sucesso',
    type: VehicleModelResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Modelo não encontrado' })
  @ApiResponse({ status: 409, description: 'Modelo já cadastrado para esta marca' })
  update(
    @Param('id') id: string,
    @Body() updateVehicleModelDto: UpdateVehicleModelDto,
    @CurrentUser() user: any,
  ): Promise<VehicleModelResponseDto> {
    return this.vehicleModelService.update(id, updateVehicleModelDto);
  }

  @Delete(':id')
  @RequirePermission('vehicle-models.delete')
  @ApiOperation({ summary: 'Excluir modelo de veículo' })
  @ApiResponse({
    status: 200,
    description: 'Modelo excluído com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Modelo não encontrado' })
  @ApiResponse({
    status: 409,
    description: 'Não é possível excluir modelo em uso',
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.vehicleModelService.remove(id);
  }
}
