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
import { BranchService } from './branch.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { BranchResponseDto } from './dto/branch-response.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../../shared/guards/permission.guard';
import { RequirePermission } from '../../shared/decorators/require-permission.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@ApiTags('Branches')
@Controller('branches')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Post()
  @RequirePermission('branches.create')
  @ApiOperation({ summary: 'Criar nova filial' })
  @ApiResponse({
    status: 201,
    description: 'Filial criada com sucesso',
    type: BranchResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  @ApiResponse({ status: 409, description: 'Código já cadastrado' })
  create(
    @Body() createBranchDto: CreateBranchDto,
    @CurrentUser() user: any,
  ): Promise<BranchResponseDto> {
    return this.branchService.create(createBranchDto, user?.sub);
  }

  @Get()
  @RequirePermission('branches.view')
  @ApiOperation({ summary: 'Listar todas as filiais (com paginação)' })
  @ApiQuery({
    name: 'includeDeleted',
    required: false,
    type: Boolean,
    description: 'Incluir filiais excluídas',
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
    description: 'Lista paginada de filiais',
  })
  findAll(
    @Query('includeDeleted') includeDeleted?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const include = includeDeleted === 'true';
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.branchService.findAll(include, pageNum, limitNum);
  }

  @Get(':id')
  @RequirePermission('branches.view')
  @ApiOperation({ summary: 'Obter filial por ID' })
  @ApiResponse({
    status: 200,
    description: 'Dados da filial',
    type: BranchResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Filial não encontrada' })
  findOne(@Param('id') id: string): Promise<BranchResponseDto> {
    return this.branchService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('branches.update')
  @ApiOperation({ summary: 'Atualizar filial' })
  @ApiResponse({
    status: 200,
    description: 'Filial atualizada com sucesso',
    type: BranchResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Filial não encontrada' })
  @ApiResponse({ status: 409, description: 'Código já cadastrado' })
  update(
    @Param('id') id: string,
    @Body() updateBranchDto: UpdateBranchDto,
  ): Promise<BranchResponseDto> {
    return this.branchService.update(id, updateBranchDto);
  }

  @Delete(':id')
  @RequirePermission('branches.delete')
  @ApiOperation({ summary: 'Excluir filial (soft delete)' })
  @ApiResponse({ status: 200, description: 'Filial excluída com sucesso' })
  @ApiResponse({ status: 404, description: 'Filial não encontrada' })
  remove(@Param('id') id: string): Promise<void> {
    return this.branchService.remove(id);
  }
}
