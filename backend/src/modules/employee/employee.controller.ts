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
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeResponseDto } from './dto/employee-response.dto';
import { EmployeeCostsResponseDto } from './dto/employee-costs-response.dto';
import { EmployeeDetailCostsResponseDto } from './dto/employee-detail-costs-response.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../../shared/guards/permission.guard';
import { RequirePermission } from '../../shared/decorators/require-permission.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@ApiTags('Employees')
@Controller('employees')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  @RequirePermission('employees.create')
  @ApiOperation({ summary: 'Criar novo funcionário' })
  @ApiResponse({
    status: 201,
    description: 'Funcionário criado com sucesso',
    type: EmployeeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Empresa ou filial não encontrada' })
  create(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @CurrentUser() user: any,
  ): Promise<EmployeeResponseDto> {
    return this.employeeService.create(createEmployeeDto, user?.sub, user);
  }

  @Get()
  @RequirePermission('employees.view')
  @ApiOperation({ summary: 'Listar todos os funcionários (com paginação)' })
  @ApiQuery({
    name: 'branchId',
    required: false,
    type: String,
    description: 'Filtrar por filial',
  })
  @ApiQuery({
    name: 'includeDeleted',
    required: false,
    type: Boolean,
    description: 'Incluir funcionários excluídos',
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
    description: 'Itens por página (padrão: 50)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de funcionários',
  })
  findAll(
    @Query('branchId') branchId?: string,
    @Query('includeDeleted') includeDeleted?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const include = includeDeleted === 'true';
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.employeeService.findAll(branchId, include, pageNum, limitNum);
  }

  @Get('costs/summary')
  @RequirePermission('employees.view-costs')
  @ApiOperation({ summary: 'Obter dashboard de custos com funcionários' })
  @ApiQuery({
    name: 'branchId',
    required: false,
    type: String,
    description: 'Filtrar por filial',
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
    description: 'Dashboard de custos com funcionários',
    type: EmployeeCostsResponseDto,
  })
  getCosts(
    @Query('branchId') branchId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<EmployeeCostsResponseDto> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 15;
    return this.employeeService.getEmployeeCosts(branchId, pageNum, limitNum);
  }

  // Rota específica para evitar que /employees/benefits seja capturado por @Get(':id')
  // Esta rota deve vir ANTES de @Get(':id') para ter prioridade
  @Get('benefits')
  @ApiOperation({ summary: 'Rota reservada - use EmployeeBenefitController' })
  getBenefitsPlaceholder() {
    // Esta rota existe apenas para evitar conflito de roteamento
    // A implementação real está no EmployeeBenefitController
    // Se chegou aqui, significa que o EmployeeBenefitController não foi processado
    // Isso não deveria acontecer, mas mantemos esta rota como fallback
    throw new NotFoundException('Endpoint não encontrado. Use o EmployeeBenefitController.');
  }

  @Get(':id/costs')
  @RequirePermission('employees.view-costs')
  @ApiOperation({ summary: 'Obter detalhes de custos de um funcionário' })
  @ApiResponse({
    status: 200,
    description: 'Detalhes de custos do funcionário',
    type: EmployeeDetailCostsResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Funcionário não encontrado' })
  getDetailCosts(@Param('id') id: string): Promise<EmployeeDetailCostsResponseDto> {
    return this.employeeService.getEmployeeDetailCosts(id);
  }

  @Get(':id')
  @RequirePermission('employees.view')
  @ApiOperation({ summary: 'Obter funcionário por ID' })
  @ApiResponse({
    status: 200,
    description: 'Dados do funcionário',
    type: EmployeeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Funcionário não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  findOne(@Param('id') id: string, @CurrentUser() user: any): Promise<EmployeeResponseDto> {
    return this.employeeService.findOne(id, user);
  }

  @Patch(':id')
  @RequirePermission('employees.update')
  @ApiOperation({ summary: 'Atualizar funcionário' })
  @ApiResponse({
    status: 200,
    description: 'Funcionário atualizado com sucesso',
    type: EmployeeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Funcionário não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @CurrentUser() user: any,
  ): Promise<EmployeeResponseDto> {
    return this.employeeService.update(id, updateEmployeeDto, user);
  }

  @Delete(':id')
  @RequirePermission('employees.delete')
  @ApiOperation({ summary: 'Excluir funcionário (soft delete)' })
  @ApiResponse({ status: 200, description: 'Funcionário excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Funcionário não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  remove(@Param('id') id: string, @CurrentUser() user: any): Promise<void> {
    return this.employeeService.remove(id, user);
  }
}
