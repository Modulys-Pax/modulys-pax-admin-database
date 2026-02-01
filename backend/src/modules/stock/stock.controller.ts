import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StockService } from './stock.service';
import { CreateStockMovementDto, StockMovementType } from './dto/create-stock-movement.dto';
import { StockMovementResponseDto } from './dto/stock-movement-response.dto';
import { StockResponseDto } from './dto/stock-response.dto';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../../shared/guards/permission.guard';
import { RequirePermission } from '../../shared/decorators/require-permission.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@ApiTags('Stock')
@Controller('stock')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class StockController {
  constructor(private readonly stockService: StockService) {}

  // ============================================
  // WAREHOUSE ENDPOINTS (Apenas leitura - almoxarifado único da empresa)
  // ============================================

  @Get('warehouses')
  @RequirePermission('stock.view')
  @ApiOperation({ summary: 'Listar almoxarifados da empresa (apenas leitura)' })
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
    name: 'includeDeleted',
    required: false,
    type: Boolean,
    description: 'Incluir almoxarifados excluídos',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de almoxarifados (empresa usa um único almoxarifado)',
  })
  findAllWarehouses(
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    const include = includeDeleted === 'true';
    return this.stockService.findAllWarehouses(companyId, branchId, include);
  }

  // ============================================
  // STOCK ENDPOINTS
  // ============================================

  @Get('stocks')
  @RequirePermission('stock.view')
  @ApiOperation({ summary: 'Listar estoques (com paginação)' })
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
    name: 'warehouseId',
    required: false,
    type: String,
    description: 'Filtrar por almoxarifado',
  })
  @ApiQuery({
    name: 'productId',
    required: false,
    type: String,
    description: 'Filtrar por produto',
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
    description: 'Itens por página (padrão: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de estoques',
  })
  findAllStocks(
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('productId') productId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.stockService.findAllStocks(
      companyId,
      branchId,
      warehouseId,
      productId,
      pageNum,
      limitNum,
    );
  }

  @Get('stocks/:id')
  @RequirePermission('stock.view')
  @ApiOperation({ summary: 'Obter estoque por ID' })
  @ApiResponse({
    status: 200,
    description: 'Dados do estoque',
    type: StockResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Estoque não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  findOneStock(@Param('id') id: string, @CurrentUser() user: any): Promise<StockResponseDto> {
    return this.stockService.findOneStock(id, user);
  }

  // ============================================
  // STOCK MOVEMENT ENDPOINTS
  // ============================================

  @Post('movements')
  @RequirePermission('stock.create-movement')
  @ApiOperation({ summary: 'Criar movimentação de estoque' })
  @ApiResponse({
    status: 201,
    description: 'Movimentação criada com sucesso',
    type: StockMovementResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou estoque insuficiente' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Recurso não encontrado' })
  createStockMovement(
    @Body() createDto: CreateStockMovementDto,
    @CurrentUser() user: any,
  ): Promise<StockMovementResponseDto> {
    return this.stockService.createStockMovement(createDto, user?.sub, user);
  }

  @Get('movements')
  @RequirePermission('stock.view')
  @ApiOperation({ summary: 'Listar movimentações de estoque' })
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
    name: 'productId',
    required: false,
    type: String,
    description: 'Filtrar por produto',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Data inicial (formato: YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Data final (formato: YYYY-MM-DD)',
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
    description: 'Itens por página (padrão: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de movimentações',
    type: PaginatedResponseDto,
  })
  findAllStockMovements(
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
    @Query('productId') productId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedResponseDto<StockMovementResponseDto>> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.stockService.findAllStockMovements(
      companyId,
      branchId,
      productId,
      startDate,
      endDate,
      pageNum,
      limitNum,
    );
  }

  @Get('movements/:id')
  @RequirePermission('stock.view')
  @ApiOperation({ summary: 'Obter movimentação por ID' })
  @ApiResponse({
    status: 200,
    description: 'Dados da movimentação',
    type: StockMovementResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Movimentação não encontrada' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  findOneStockMovement(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<StockMovementResponseDto> {
    return this.stockService.findOneStockMovement(id, user);
  }
}
