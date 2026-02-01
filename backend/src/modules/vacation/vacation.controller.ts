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
import { VacationService } from './vacation.service';
import { CreateVacationDto } from './dto/create-vacation.dto';
import { UpdateVacationDto } from './dto/update-vacation.dto';
import { VacationResponseDto } from './dto/vacation-response.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../../shared/guards/permission.guard';
import { RequirePermission } from '../../shared/decorators/require-permission.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@ApiTags('Vacations')
@Controller('vacations')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class VacationController {
  constructor(private readonly vacationService: VacationService) {}

  @Post()
  @RequirePermission('vacations.create')
  @ApiOperation({ summary: 'Criar nova férias' })
  @ApiResponse({
    status: 201,
    description: 'Férias criada com sucesso',
    type: VacationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Empresa, filial ou funcionário não encontrado' })
  @ApiResponse({ status: 400, description: 'Período inválido ou sobreposição de férias' })
  create(
    @Body() createVacationDto: CreateVacationDto,
    @CurrentUser() user: any,
  ): Promise<VacationResponseDto> {
    return this.vacationService.create(createVacationDto, user?.sub);
  }

  @Get()
  @RequirePermission('vacations.view')
  @ApiOperation({ summary: 'Listar todas as férias' })
  @ApiQuery({
    name: 'companyId',
    required: false,
    type: String,
    description: 'Filtrar por empresa',
  })
  @ApiQuery({
    name: 'branchId',
    required: false,
    type: String,
    description: 'Filtrar por filial',
  })
  @ApiQuery({
    name: 'employeeId',
    required: false,
    type: String,
    description: 'Filtrar por funcionário',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filtrar por status',
  })
  @ApiQuery({
    name: 'includeDeleted',
    required: false,
    type: Boolean,
    description: 'Incluir férias excluídas',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de férias',
    type: [VacationResponseDto],
  })
  findAll(
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: string,
    @Query('includeDeleted') includeDeleted?: string,
  ): Promise<VacationResponseDto[]> {
    const include = includeDeleted === 'true';
    return this.vacationService.findAll(companyId, branchId, employeeId, status, include);
  }

  @Get(':id')
  @RequirePermission('vacations.view')
  @ApiOperation({ summary: 'Obter férias por ID' })
  @ApiResponse({
    status: 200,
    description: 'Dados da férias',
    type: VacationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Férias não encontrada' })
  findOne(@Param('id') id: string): Promise<VacationResponseDto> {
    return this.vacationService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('vacations.update')
  @ApiOperation({ summary: 'Atualizar férias' })
  @ApiResponse({
    status: 200,
    description: 'Férias atualizada com sucesso',
    type: VacationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Férias não encontrada' })
  @ApiResponse({ status: 400, description: 'Férias já concluída ou cancelada' })
  update(
    @Param('id') id: string,
    @Body() updateVacationDto: UpdateVacationDto,
  ): Promise<VacationResponseDto> {
    return this.vacationService.update(id, updateVacationDto);
  }

  @Delete(':id')
  @RequirePermission('vacations.delete')
  @ApiOperation({ summary: 'Excluir férias (soft delete)' })
  @ApiResponse({ status: 200, description: 'Férias excluída com sucesso' })
  @ApiResponse({ status: 404, description: 'Férias não encontrada' })
  @ApiResponse({ status: 400, description: 'Férias em andamento ou concluída' })
  remove(@Param('id') id: string): Promise<void> {
    return this.vacationService.remove(id);
  }
}
