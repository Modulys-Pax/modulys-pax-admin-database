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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VehicleBrandService } from './vehicle-brand.service';
import { VehicleBrandResponseDto } from './dto/vehicle-brand-response.dto';
import { CreateVehicleBrandDto } from './dto/create-vehicle-brand.dto';
import { UpdateVehicleBrandDto } from './dto/update-vehicle-brand.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../../shared/guards/permission.guard';
import { RequirePermission } from '../../shared/decorators/require-permission.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@ApiTags('Vehicle Brands')
@Controller('vehicle-brands')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class VehicleBrandController {
  constructor(private readonly vehicleBrandService: VehicleBrandService) {}

  @Get()
  @RequirePermission('vehicle-brands.view')
  @ApiOperation({ summary: 'Listar todas as marcas de veículos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de marcas de veículos',
    type: [VehicleBrandResponseDto],
  })
  findAll(@Query('includeInactive') includeInactive?: string): Promise<VehicleBrandResponseDto[]> {
    const include = includeInactive === 'true';
    return this.vehicleBrandService.findAll(include);
  }

  @Get(':id')
  @RequirePermission('vehicle-brands.view')
  @ApiOperation({ summary: 'Obter marca por ID' })
  @ApiResponse({
    status: 200,
    description: 'Marca encontrada',
    type: VehicleBrandResponseDto,
  })
  findOne(@Param('id') id: string): Promise<VehicleBrandResponseDto> {
    return this.vehicleBrandService.findOne(id);
  }

  @Post()
  @RequirePermission('vehicle-brands.create')
  @ApiOperation({ summary: 'Criar nova marca de veículo' })
  @ApiResponse({
    status: 201,
    description: 'Marca criada com sucesso',
    type: VehicleBrandResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Marca já cadastrada' })
  create(
    @Body() createVehicleBrandDto: CreateVehicleBrandDto,
    @CurrentUser() user: any,
  ): Promise<VehicleBrandResponseDto> {
    return this.vehicleBrandService.create(createVehicleBrandDto);
  }

  @Patch(':id')
  @RequirePermission('vehicle-brands.update')
  @ApiOperation({ summary: 'Atualizar marca de veículo' })
  @ApiResponse({
    status: 200,
    description: 'Marca atualizada com sucesso',
    type: VehicleBrandResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Marca não encontrada' })
  @ApiResponse({ status: 409, description: 'Marca já cadastrada' })
  update(
    @Param('id') id: string,
    @Body() updateVehicleBrandDto: UpdateVehicleBrandDto,
    @CurrentUser() user: any,
  ): Promise<VehicleBrandResponseDto> {
    return this.vehicleBrandService.update(id, updateVehicleBrandDto);
  }

  @Delete(':id')
  @RequirePermission('vehicle-brands.delete')
  @ApiOperation({ summary: 'Excluir marca de veículo' })
  @ApiResponse({
    status: 200,
    description: 'Marca excluída com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Marca não encontrada' })
  @ApiResponse({
    status: 409,
    description: 'Não é possível excluir marca em uso',
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.vehicleBrandService.remove(id);
  }
}
