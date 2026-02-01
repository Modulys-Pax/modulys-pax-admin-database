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
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseResponseDto } from './dto/expense-response.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../../shared/guards/permission.guard';
import { RequirePermission } from '../../shared/decorators/require-permission.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@ApiTags('Expenses')
@Controller('expenses')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  @RequirePermission('expenses.create')
  @ApiOperation({ summary: 'Criar nova despesa (gera transação financeira automaticamente)' })
  @ApiResponse({
    status: 201,
    description: 'Despesa criada com sucesso',
    type: ExpenseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Empresa, filial ou funcionário não encontrado' })
  create(
    @Body() createExpenseDto: CreateExpenseDto,
    @CurrentUser() user: any,
  ): Promise<ExpenseResponseDto> {
    return this.expenseService.create(createExpenseDto, user?.sub, user);
  }

  @Get()
  @RequirePermission('expenses.view')
  @ApiOperation({ summary: 'Listar todas as despesas' })
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
    name: 'type',
    required: false,
    type: String,
    description: 'Filtrar por tipo de despesa',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Data inicial (filtro por período)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Data final (filtro por período)',
  })
  @ApiQuery({
    name: 'includeDeleted',
    required: false,
    type: Boolean,
    description: 'Incluir despesas excluídas',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de despesas',
    type: [ExpenseResponseDto],
  })
  findAll(
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
    @Query('employeeId') employeeId?: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('includeDeleted') includeDeleted?: string,
  ): Promise<ExpenseResponseDto[]> {
    const include = includeDeleted === 'true';
    return this.expenseService.findAll(
      companyId,
      branchId,
      employeeId,
      type,
      startDate,
      endDate,
      include,
    );
  }

  @Get(':id')
  @RequirePermission('expenses.view')
  @ApiOperation({ summary: 'Obter despesa por ID' })
  @ApiResponse({
    status: 200,
    description: 'Dados da despesa',
    type: ExpenseResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Despesa não encontrada' })
  findOne(@Param('id') id: string, @CurrentUser() user: any): Promise<ExpenseResponseDto> {
    return this.expenseService.findOne(id, user);
  }

  @Patch(':id')
  @RequirePermission('expenses.update')
  @ApiOperation({ summary: 'Atualizar despesa' })
  @ApiResponse({
    status: 200,
    description: 'Despesa atualizada com sucesso',
    type: ExpenseResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Despesa não encontrada' })
  @ApiResponse({ status: 400, description: 'Despesa já foi processada financeiramente' })
  update(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @CurrentUser() user: any,
  ): Promise<ExpenseResponseDto> {
    return this.expenseService.update(id, updateExpenseDto, user);
  }

  @Delete(':id')
  @RequirePermission('expenses.delete')
  @ApiOperation({ summary: 'Excluir despesa (soft delete)' })
  @ApiResponse({ status: 200, description: 'Despesa excluída com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Despesa não encontrada' })
  @ApiResponse({ status: 400, description: 'Despesa já foi processada financeiramente' })
  remove(@Param('id') id: string, @CurrentUser() user: any): Promise<void> {
    return this.expenseService.remove(id, user);
  }
}
