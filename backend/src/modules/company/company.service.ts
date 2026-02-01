import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyResponseDto } from './dto/company-response.dto';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  async create(createCompanyDto: CreateCompanyDto, userId?: string): Promise<CompanyResponseDto> {
    // Verificar se CNPJ já existe
    if (createCompanyDto.cnpj) {
      const existingCompany = await this.prisma.company.findUnique({
        where: { cnpj: createCompanyDto.cnpj },
      });

      if (existingCompany && !existingCompany.deletedAt) {
        throw new ConflictException('CNPJ já cadastrado');
      }
    }

    const company = await this.prisma.company.create({
      data: {
        ...createCompanyDto,
        createdBy: userId,
      },
    });

    return this.mapToResponse(company);
  }

  async findAll(includeDeleted = false): Promise<CompanyResponseDto[]> {
    const where = includeDeleted ? {} : { deletedAt: null };

    const companies = await this.prisma.company.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return companies.map((company) => this.mapToResponse(company));
  }

  async findOne(id: string): Promise<CompanyResponseDto> {
    const company = await this.prisma.company.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    return this.mapToResponse(company);
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto): Promise<CompanyResponseDto> {
    // Verificar se empresa existe
    const existingCompany = await this.prisma.company.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existingCompany) {
      throw new NotFoundException('Empresa não encontrada');
    }

    // Verificar se CNPJ já existe em outra empresa
    if (updateCompanyDto.cnpj && updateCompanyDto.cnpj !== existingCompany.cnpj) {
      const companyWithCnpj = await this.prisma.company.findUnique({
        where: { cnpj: updateCompanyDto.cnpj },
      });

      if (companyWithCnpj && companyWithCnpj.id !== id && !companyWithCnpj.deletedAt) {
        throw new ConflictException('CNPJ já cadastrado em outra empresa');
      }
    }

    const company = await this.prisma.company.update({
      where: { id },
      data: updateCompanyDto,
    });

    return this.mapToResponse(company);
  }

  async remove(id: string): Promise<void> {
    const company = await this.prisma.company.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    // Soft delete
    await this.prisma.company.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private mapToResponse(company: any): CompanyResponseDto {
    return {
      id: company.id,
      name: company.name,
      cnpj: company.cnpj,
      tradeName: company.tradeName,
      email: company.email,
      phone: company.phone,
      address: company.address,
      city: company.city,
      state: company.state,
      zipCode: company.zipCode,
      active: company.active,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      createdBy: company.createdBy,
      deletedAt: company.deletedAt,
    };
  }
}
