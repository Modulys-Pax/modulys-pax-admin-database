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
import { FinancialTransactionService } from './financial-transaction.service';
import { CreateFinancialTransactionDto } from './dto/create-financial-transaction.dto';
import { UpdateFinancialTransactionDto } from './dto/update-financial-transaction.dto';
import { FinancialTransactionResponseDto } from './dto/financial-transaction-response.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@ApiTags('Financial Transactions')
@Controller('financial-transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FinancialTransactionController {
  constructor(private readonly financialTransactionService: FinancialTransactionService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova transação financeira' })
  @ApiResponse({
    status: 201,
    description: 'Transação financeira criada com sucesso',
    type: FinancialTransactionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Empresa ou filial não encontrado' })
  create(
    @Body() createDto: CreateFinancialTransactionDto,
    @CurrentUser() user: any,
  ): Promise<FinancialTransactionResponseDto> {
    return this.financialTransactionService.create(createDto, user?.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as transações financeiras' })
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
    name: 'type',
    required: false,
    enum: ['INCOME', 'EXPENSE'],
    description: 'Filtrar por tipo',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Data inicial (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Data final (ISO string)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de transações financeiras',
    type: [FinancialTransactionResponseDto],
  })
  findAll(
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<FinancialTransactionResponseDto[]> {
    return this.financialTransactionService.findAll(companyId, branchId, type, startDate, endDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter transação financeira por ID' })
  @ApiResponse({
    status: 200,
    description: 'Dados da transação financeira',
    type: FinancialTransactionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Transação financeira não encontrada' })
  findOne(@Param('id') id: string): Promise<FinancialTransactionResponseDto> {
    return this.financialTransactionService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar transação financeira' })
  @ApiResponse({
    status: 200,
    description: 'Transação financeira atualizada com sucesso',
    type: FinancialTransactionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Transação financeira não encontrada' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateFinancialTransactionDto,
  ): Promise<FinancialTransactionResponseDto> {
    return this.financialTransactionService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir transação financeira' })
  @ApiResponse({
    status: 200,
    description: 'Transação financeira excluída com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Transação financeira não encontrada' })
  @ApiResponse({
    status: 400,
    description: 'Transação vinculada a conta a pagar ou receber',
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.financialTransactionService.remove(id);
  }
}
