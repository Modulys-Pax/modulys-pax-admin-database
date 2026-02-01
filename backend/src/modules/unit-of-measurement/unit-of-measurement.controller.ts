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
import { UnitOfMeasurementService } from './unit-of-measurement.service';
import { UnitOfMeasurementResponseDto } from './dto/unit-of-measurement-response.dto';
import { CreateUnitOfMeasurementDto } from './dto/create-unit-of-measurement.dto';
import { UpdateUnitOfMeasurementDto } from './dto/update-unit-of-measurement.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../../shared/guards/permission.guard';
import { RequirePermission } from '../../shared/decorators/require-permission.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@ApiTags('Units of Measurement')
@Controller('units-of-measurement')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class UnitOfMeasurementController {
  constructor(private readonly unitOfMeasurementService: UnitOfMeasurementService) {}

  @Get()
  @RequirePermission('units.view')
  @ApiOperation({ summary: 'Listar todas as unidades de medida' })
  @ApiResponse({
    status: 200,
    description: 'Lista de unidades de medida',
    type: [UnitOfMeasurementResponseDto],
  })
  findAll(
    @Query('includeInactive') includeInactive?: string,
  ): Promise<UnitOfMeasurementResponseDto[]> {
    const include = includeInactive === 'true';
    return this.unitOfMeasurementService.findAll(include);
  }

  @Get(':id')
  @RequirePermission('units.view')
  @ApiOperation({ summary: 'Obter unidade de medida por ID' })
  @ApiResponse({
    status: 200,
    description: 'Unidade de medida encontrada',
    type: UnitOfMeasurementResponseDto,
  })
  findOne(@Param('id') id: string): Promise<UnitOfMeasurementResponseDto> {
    return this.unitOfMeasurementService.findOne(id);
  }

  @Post()
  @RequirePermission('units.create')
  @ApiOperation({ summary: 'Criar nova unidade de medida' })
  @ApiResponse({
    status: 201,
    description: 'Unidade de medida criada com sucesso',
    type: UnitOfMeasurementResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Código da unidade de medida já cadastrado' })
  create(
    @Body() createUnitOfMeasurementDto: CreateUnitOfMeasurementDto,
    @CurrentUser() user: any,
  ): Promise<UnitOfMeasurementResponseDto> {
    return this.unitOfMeasurementService.create(createUnitOfMeasurementDto, user?.sub);
  }

  @Patch(':id')
  @RequirePermission('units.update')
  @ApiOperation({ summary: 'Atualizar unidade de medida' })
  @ApiResponse({
    status: 200,
    description: 'Unidade de medida atualizada com sucesso',
    type: UnitOfMeasurementResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Unidade de medida não encontrada' })
  @ApiResponse({ status: 409, description: 'Código da unidade de medida já cadastrado' })
  update(
    @Param('id') id: string,
    @Body() updateUnitOfMeasurementDto: UpdateUnitOfMeasurementDto,
    @CurrentUser() user: any,
  ): Promise<UnitOfMeasurementResponseDto> {
    return this.unitOfMeasurementService.update(id, updateUnitOfMeasurementDto, user?.sub);
  }

  @Delete(':id')
  @RequirePermission('units.delete')
  @ApiOperation({ summary: 'Excluir unidade de medida' })
  @ApiResponse({
    status: 200,
    description: 'Unidade de medida excluída com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Unidade de medida não encontrada' })
  @ApiResponse({
    status: 409,
    description: 'Não é possível excluir unidade de medida em uso',
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.unitOfMeasurementService.remove(id);
  }
}
