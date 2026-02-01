import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { AuditLogFilterDto } from './dto/audit-log-filter.dto';
import { AuditLogResponseDto, AuditLogListResponseDto } from './dto/audit-log-response.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../../shared/guards/permission.guard';
import { RequirePermission } from '../../shared/decorators/require-permission.decorator';

@ApiTags('Audit')
@Controller('audit')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post()
  @RequirePermission('audit.view')
  @ApiOperation({ summary: 'Criar log de auditoria' })
  @ApiResponse({
    status: 201,
    description: 'Log de auditoria criado com sucesso',
    type: AuditLogResponseDto,
  })
  create(@Body() createAuditLogDto: CreateAuditLogDto): Promise<AuditLogResponseDto> {
    return this.auditService.create(createAuditLogDto);
  }

  @Get()
  @RequirePermission('audit.view')
  @ApiOperation({ summary: 'Listar logs de auditoria com filtros' })
  @ApiResponse({
    status: 200,
    description: 'Lista de logs de auditoria',
    type: AuditLogListResponseDto,
  })
  findAll(@Query() filter: AuditLogFilterDto): Promise<AuditLogListResponseDto> {
    return this.auditService.findAll(filter);
  }

  @Get('entity/:entityType/:entityId')
  @RequirePermission('audit.view')
  @ApiOperation({ summary: 'Obter histórico de auditoria de uma entidade específica' })
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
    description: 'Histórico de auditoria da entidade',
    type: AuditLogListResponseDto,
  })
  findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<AuditLogListResponseDto> {
    return this.auditService.findByEntity(
      entityType,
      entityId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get(':id')
  @RequirePermission('audit.view')
  @ApiOperation({ summary: 'Obter log de auditoria por ID' })
  @ApiResponse({
    status: 200,
    description: 'Log de auditoria',
    type: AuditLogResponseDto,
  })
  findOne(@Param('id') id: string): Promise<AuditLogResponseDto> {
    return this.auditService.findOne(id);
  }
}
