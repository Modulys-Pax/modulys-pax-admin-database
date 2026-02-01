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
import { BenefitService } from './benefit.service';
import { CreateBenefitDto } from './dto/create-benefit.dto';
import { UpdateBenefitDto } from './dto/update-benefit.dto';
import { BenefitResponseDto } from './dto/benefit-response.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../../shared/guards/permission.guard';
import { RequirePermission } from '../../shared/decorators/require-permission.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@ApiTags('Benefits')
@Controller('benefits')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class BenefitController {
  constructor(private readonly benefitService: BenefitService) {}

  @Post()
  @RequirePermission('benefits.create')
  @ApiOperation({ summary: 'Criar novo benefício no catálogo' })
  @ApiResponse({
    status: 201,
    description: 'Benefício criado com sucesso',
    type: BenefitResponseDto,
  })
  create(
    @Body() createDto: CreateBenefitDto,
    @CurrentUser() user: any,
  ): Promise<BenefitResponseDto> {
    return this.benefitService.create(createDto, user?.sub, user);
  }

  @Get()
  @RequirePermission('benefits.view')
  @ApiOperation({ summary: 'Listar benefícios do catálogo (com paginação)' })
  @ApiQuery({
    name: 'branchId',
    required: false,
    type: String,
    description: 'Filtrar por filial',
  })
  @ApiQuery({
    name: 'active',
    required: false,
    type: Boolean,
    description: 'Filtrar por status ativo',
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
    description: 'Lista paginada de benefícios',
  })
  findAll(
    @Query('branchId') branchId?: string,
    @Query('active') active?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const activeBool = active === 'true' ? true : active === 'false' ? false : undefined;
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 15;
    return this.benefitService.findAll(branchId, activeBool, pageNum, limitNum);
  }

  @Get(':id')
  @RequirePermission('benefits.view')
  @ApiOperation({ summary: 'Obter benefício por ID' })
  @ApiResponse({
    status: 200,
    description: 'Dados do benefício',
    type: BenefitResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Benefício não encontrado' })
  findOne(@Param('id') id: string, @CurrentUser() user: any): Promise<BenefitResponseDto> {
    return this.benefitService.findOne(id, user);
  }

  @Patch(':id')
  @RequirePermission('benefits.update')
  @ApiOperation({ summary: 'Atualizar benefício' })
  @ApiResponse({
    status: 200,
    description: 'Benefício atualizado com sucesso',
    type: BenefitResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Benefício não encontrado' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateBenefitDto,
    @CurrentUser() user: any,
  ): Promise<BenefitResponseDto> {
    return this.benefitService.update(id, updateDto, user);
  }

  @Delete(':id')
  @RequirePermission('benefits.delete')
  @ApiOperation({ summary: 'Excluir benefício (soft delete)' })
  @ApiResponse({ status: 200, description: 'Benefício excluído com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Benefício não encontrado' })
  @ApiResponse({
    status: 409,
    description: 'Benefício está sendo usado por funcionários',
  })
  remove(@Param('id') id: string, @CurrentUser() user: any): Promise<void> {
    return this.benefitService.remove(id, user);
  }
}
