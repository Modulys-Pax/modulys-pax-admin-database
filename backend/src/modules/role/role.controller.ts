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
import { RoleService } from './role.service';
import { RoleResponseDto } from './dto/role-response.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../../shared/guards/permission.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { RequirePermission } from '../../shared/decorators/require-permission.decorator';
import { PermissionModule } from '../../shared/constants/permissions.constants';

@ApiTags('Roles')
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get('permissions')
  @ApiOperation({ summary: 'Listar todas as permissões disponíveis no sistema' })
  @ApiResponse({
    status: 200,
    description: 'Lista de permissões agrupadas por módulo',
  })
  @RequirePermission('roles.view')
  getAllPermissions(): Promise<PermissionModule[]> {
    return this.roleService.getAllPermissions();
  }

  @Post('sync-permissions')
  @ApiOperation({ summary: 'Sincronizar permissões do sistema com o banco de dados' })
  @ApiResponse({
    status: 200,
    description: 'Permissões sincronizadas com sucesso',
  })
  @RequirePermission('roles.update')
  async syncPermissions(): Promise<{ message: string }> {
    await this.roleService.syncPermissions();
    return { message: 'Permissões sincronizadas com sucesso' };
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os cargos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de cargos',
    type: [RoleResponseDto],
  })
  @RequirePermission('roles.view')
  findAll(@Query('includeInactive') includeInactive?: string): Promise<RoleResponseDto[]> {
    const include = includeInactive === 'true';
    return this.roleService.findAll(include);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter cargo por ID' })
  @ApiResponse({
    status: 200,
    description: 'Cargo encontrado',
    type: RoleResponseDto,
  })
  @RequirePermission('roles.view')
  findOne(@Param('id') id: string): Promise<RoleResponseDto> {
    return this.roleService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo cargo' })
  @ApiResponse({
    status: 201,
    description: 'Cargo criado com sucesso',
    type: RoleResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Nome do cargo já cadastrado' })
  @RequirePermission('roles.create')
  create(@Body() createRoleDto: CreateRoleDto, @CurrentUser() user: any): Promise<RoleResponseDto> {
    return this.roleService.create(createRoleDto, user?.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar cargo' })
  @ApiResponse({
    status: 200,
    description: 'Cargo atualizado com sucesso',
    type: RoleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Cargo não encontrado' })
  @ApiResponse({ status: 409, description: 'Nome do cargo já cadastrado' })
  @RequirePermission('roles.update')
  update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @CurrentUser() user: any,
  ): Promise<RoleResponseDto> {
    return this.roleService.update(id, updateRoleDto, user?.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir cargo' })
  @ApiResponse({
    status: 200,
    description: 'Cargo excluído com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Cargo não encontrado' })
  @ApiResponse({
    status: 409,
    description: 'Não é possível excluir cargo em uso',
  })
  @RequirePermission('roles.delete')
  remove(@Param('id') id: string): Promise<void> {
    return this.roleService.remove(id);
  }
}
