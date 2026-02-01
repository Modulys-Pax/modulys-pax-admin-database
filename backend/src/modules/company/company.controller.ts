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
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyResponseDto } from './dto/company-response.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@ApiTags('Companies')
@Controller('companies')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova empresa' })
  @ApiResponse({
    status: 201,
    description: 'Empresa criada com sucesso',
    type: CompanyResponseDto,
  })
  @ApiResponse({ status: 409, description: 'CNPJ já cadastrado' })
  create(
    @Body() createCompanyDto: CreateCompanyDto,
    @CurrentUser() user: any,
  ): Promise<CompanyResponseDto> {
    return this.companyService.create(createCompanyDto, user?.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as empresas' })
  @ApiQuery({
    name: 'includeDeleted',
    required: false,
    type: Boolean,
    description: 'Incluir empresas excluídas',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de empresas',
    type: [CompanyResponseDto],
  })
  findAll(@Query('includeDeleted') includeDeleted?: string): Promise<CompanyResponseDto[]> {
    const include = includeDeleted === 'true';
    return this.companyService.findAll(include);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter empresa por ID' })
  @ApiResponse({
    status: 200,
    description: 'Dados da empresa',
    type: CompanyResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  findOne(@Param('id') id: string): Promise<CompanyResponseDto> {
    return this.companyService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar empresa' })
  @ApiResponse({
    status: 200,
    description: 'Empresa atualizada com sucesso',
    type: CompanyResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  @ApiResponse({ status: 409, description: 'CNPJ já cadastrado' })
  update(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ): Promise<CompanyResponseDto> {
    return this.companyService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir empresa (soft delete)' })
  @ApiResponse({ status: 200, description: 'Empresa excluída com sucesso' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  remove(@Param('id') id: string): Promise<void> {
    return this.companyService.remove(id);
  }
}
