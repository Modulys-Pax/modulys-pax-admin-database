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
import { EmployeeBenefitService } from './employee-benefit.service';
import { CreateEmployeeBenefitDto } from './dto/create-employee-benefit.dto';
import { UpdateEmployeeBenefitDto } from './dto/update-employee-benefit.dto';
import { EmployeeBenefitResponseDto } from './dto/employee-benefit-response.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionGuard } from '../../shared/guards/permission.guard';
import { RequirePermission } from '../../shared/decorators/require-permission.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@ApiTags('Employee Benefits')
@Controller('employees/benefits')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class EmployeeBenefitController {
  constructor(private readonly benefitService: EmployeeBenefitService) {}

  @Post()
  @RequirePermission('employee-benefits.manage')
  @ApiOperation({ summary: 'Criar novo benefício para funcionário' })
  @ApiResponse({
    status: 201,
    description: 'Benefício criado com sucesso',
    type: EmployeeBenefitResponseDto,
  })
  create(
    @Body() createDto: CreateEmployeeBenefitDto,
    @CurrentUser() user: any,
  ): Promise<EmployeeBenefitResponseDto> {
    return this.benefitService.create(createDto, user?.sub);
  }

  @Get()
  @RequirePermission('employee-benefits.view')
  @ApiOperation({ summary: 'Listar benefícios' })
  @ApiQuery({
    name: 'employeeId',
    required: false,
    type: String,
    description: 'Filtrar por funcionário',
  })
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
  findAll(
    @Query('employeeId') employeeId?: string,
    @Query('branchId') branchId?: string,
    @Query('active') active?: string,
  ): Promise<EmployeeBenefitResponseDto[]> {
    return this.benefitService.findAll(
      employeeId,
      branchId,
      active === 'true' ? true : active === 'false' ? false : undefined,
    );
  }

  @Get(':id')
  @RequirePermission('employee-benefits.view')
  @ApiOperation({ summary: 'Obter benefício por ID' })
  @ApiResponse({
    status: 200,
    description: 'Dados do benefício',
    type: EmployeeBenefitResponseDto,
  })
  findOne(@Param('id') id: string): Promise<EmployeeBenefitResponseDto> {
    return this.benefitService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('employee-benefits.manage')
  @ApiOperation({ summary: 'Atualizar benefício' })
  @ApiResponse({
    status: 200,
    description: 'Benefício atualizado com sucesso',
    type: EmployeeBenefitResponseDto,
  })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateEmployeeBenefitDto,
  ): Promise<EmployeeBenefitResponseDto> {
    return this.benefitService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermission('employee-benefits.manage')
  @ApiOperation({ summary: 'Excluir benefício (soft delete)' })
  @ApiResponse({ status: 200, description: 'Benefício excluído com sucesso' })
  remove(@Param('id') id: string): Promise<void> {
    return this.benefitService.remove(id);
  }
}
