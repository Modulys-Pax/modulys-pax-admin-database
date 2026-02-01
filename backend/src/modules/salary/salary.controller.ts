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
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SalaryService } from './salary.service';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';
import { PaySalaryDto } from './dto/pay-salary.dto';
import { SalaryResponseDto } from './dto/salary-response.dto';
import { ProcessSalariesDto, ProcessSalariesResultDto } from './dto/process-salaries.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../../shared/guards/permission.guard';
import { RequirePermission } from '../../shared/decorators/require-permission.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@ApiTags('Salaries')
@Controller('salaries')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class SalaryController {
  constructor(private readonly salaryService: SalaryService) {}

  @Post()
  @RequirePermission('payroll.view')
  @ApiOperation({ summary: 'Criar novo salário' })
  @ApiResponse({
    status: 201,
    description: 'Salário criado com sucesso',
    type: SalaryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Empresa, filial ou funcionário não encontrado' })
  @ApiResponse({ status: 409, description: 'Salário já existe para o mês/ano informado' })
  create(
    @Body() createSalaryDto: CreateSalaryDto,
    @CurrentUser() user: any,
  ): Promise<SalaryResponseDto> {
    return this.salaryService.create(createSalaryDto, user?.sub, user);
  }

  @Get()
  @RequirePermission('payroll.view')
  @ApiOperation({ summary: 'Listar todos os salários' })
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
    name: 'referenceMonth',
    required: false,
    type: Number,
    description: 'Filtrar por mês de referência (1-12)',
  })
  @ApiQuery({
    name: 'referenceYear',
    required: false,
    type: Number,
    description: 'Filtrar por ano de referência',
  })
  @ApiQuery({
    name: 'includeDeleted',
    required: false,
    type: Boolean,
    description: 'Incluir salários excluídos',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de salários',
    type: [SalaryResponseDto],
  })
  findAll(
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
    @Query('employeeId') employeeId?: string,
    @Query('referenceMonth') referenceMonth?: string,
    @Query('referenceYear') referenceYear?: string,
    @Query('includeDeleted') includeDeleted?: string,
  ): Promise<SalaryResponseDto[]> {
    const include = includeDeleted === 'true';
    const month = referenceMonth ? parseInt(referenceMonth, 10) : undefined;
    const year = referenceYear ? parseInt(referenceYear, 10) : undefined;
    return this.salaryService.findAll(companyId, branchId, employeeId, month, year, include);
  }

  @Get(':id')
  @RequirePermission('payroll.view')
  @ApiOperation({ summary: 'Obter salário por ID' })
  @ApiResponse({
    status: 200,
    description: 'Dados do salário',
    type: SalaryResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Salário não encontrado' })
  findOne(@Param('id') id: string, @CurrentUser() user: any): Promise<SalaryResponseDto> {
    return this.salaryService.findOne(id, user);
  }

  @Patch(':id')
  @RequirePermission('payroll.view')
  @ApiOperation({ summary: 'Atualizar salário' })
  @ApiResponse({
    status: 200,
    description: 'Salário atualizado com sucesso',
    type: SalaryResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Salário não encontrado' })
  @ApiResponse({ status: 400, description: 'Salário já foi pago' })
  update(
    @Param('id') id: string,
    @Body() updateSalaryDto: UpdateSalaryDto,
    @CurrentUser() user: any,
  ): Promise<SalaryResponseDto> {
    return this.salaryService.update(id, updateSalaryDto, user);
  }

  @Post('process')
  @RequirePermission('payroll.process')
  @ApiOperation({
    summary: 'Apurar salários de todos os funcionários para um mês/ano',
  })
  @ApiResponse({
    status: 201,
    description: 'Apuração realizada com sucesso',
    type: ProcessSalariesResultDto,
  })
  @ApiResponse({ status: 404, description: 'Filial não encontrada' })
  processSalaries(
    @Body() processDto: ProcessSalariesDto,
    @CurrentUser() user: any,
  ): Promise<ProcessSalariesResultDto> {
    return this.salaryService.processSalaries(processDto, user?.sub, user);
  }

  @Put(':id/pay')
  @RequirePermission('payroll.process')
  @ApiOperation({ summary: 'Pagar salário (gera transação financeira)' })
  @ApiResponse({
    status: 200,
    description: 'Salário pago com sucesso',
    type: SalaryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Salário não encontrado' })
  @ApiResponse({ status: 400, description: 'Salário já foi pago' })
  pay(
    @Param('id') id: string,
    @Body() paySalaryDto: PaySalaryDto,
    @CurrentUser() user: any,
  ): Promise<SalaryResponseDto> {
    return this.salaryService.pay(id, paySalaryDto, user?.sub);
  }

  @Delete(':id')
  @RequirePermission('payroll.view')
  @ApiOperation({ summary: 'Excluir salário (soft delete)' })
  @ApiResponse({ status: 200, description: 'Salário excluído com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Salário não encontrado' })
  @ApiResponse({ status: 400, description: 'Salário já foi pago' })
  remove(@Param('id') id: string, @CurrentUser() user: any): Promise<void> {
    return this.salaryService.remove(id, user);
  }
}
