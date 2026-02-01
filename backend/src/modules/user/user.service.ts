import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto';
import { Prisma } from '@prisma/client';
import { DEFAULT_COMPANY_ID } from '../../shared/constants/company.constants';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto, userId?: string): Promise<UserResponseDto> {
    // Verificar se email já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser && !existingUser.deletedAt) {
      throw new ConflictException('Email já cadastrado');
    }

    // Verificar se role existe
    const role = await this.prisma.role.findFirst({
      where: {
        id: createUserDto.roleId,
        active: true,
      },
    });

    if (!role) {
      throw new NotFoundException('Cargo não encontrado ou inativo');
    }

    // Usar DEFAULT_COMPANY_ID (single-tenant)
    const companyId = DEFAULT_COMPANY_ID;

    // Verificar empresa
    const company = await this.prisma.company.findFirst({
      where: {
        id: companyId,
        deletedAt: null,
      },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    // Verificar filial se fornecida
    if (createUserDto.branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: {
          id: createUserDto.branchId,
          companyId: companyId,
          deletedAt: null,
        },
      });

      if (!branch) {
        throw new NotFoundException('Filial não encontrada');
      }
    }

    // Verificar funcionário vinculado, se fornecido
    if (createUserDto.employeeId) {
      const employee = await this.prisma.employee.findFirst({
        where: {
          id: createUserDto.employeeId,
          deletedAt: null,
        },
      });

      if (!employee) {
        throw new NotFoundException('Funcionário não encontrado');
      }

      // Garantir que funcionário pertence à mesma empresa
      if (employee.companyId !== companyId) {
        throw new ConflictException('Funcionário não pertence à mesma empresa do usuário');
      }

      // Se branchId foi informado no usuário, garantir consistência com o funcionário
      if (createUserDto.branchId && employee.branchId !== createUserDto.branchId) {
        throw new ConflictException(
          'Filial do funcionário é diferente da filial informada para o usuário',
        );
      }

      // Garantir unicidade de vínculo (1-1)
      const userWithEmployee = await this.prisma.user.findFirst({
        where: {
          employeeId: createUserDto.employeeId,
          deletedAt: null,
        },
      });

      if (userWithEmployee) {
        throw new ConflictException('Já existe um usuário vinculado a este funcionário');
      }
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        companyId: companyId,
        password: hashedPassword,
        createdBy: userId,
      },
      include: {
        role: true,
      },
    });

    return this.mapToResponse(user);
  }

  async findAll(
    branchId?: string,
    includeDeleted = false,
    page = 1,
    limit = 15,
    employeeId?: string,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    const skip = (page - 1) * limit;
    const companyId = DEFAULT_COMPANY_ID;

    const where: Prisma.UserWhereInput = {
      companyId,
      ...(includeDeleted ? {} : { deletedAt: null }),
      ...(branchId ? { branchId } : {}),
      ...(employeeId ? { employeeId } : {}),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          role: true,
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((user) => this.mapToResponse(user)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return this.mapToResponse(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existingUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se email já existe em outro usuário
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const userWithEmail = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (userWithEmail && userWithEmail.id !== id && !userWithEmail.deletedAt) {
        throw new ConflictException('Email já cadastrado');
      }
    }

    // Verificar role se estiver sendo atualizada
    if (updateUserDto.roleId) {
      const role = await this.prisma.role.findFirst({
        where: {
          id: updateUserDto.roleId,
          active: true,
        },
      });

      if (!role) {
        throw new NotFoundException('Cargo não encontrado ou inativo');
      }
    }

    // Verificar empresa e filial se estiverem sendo atualizadas
    if (updateUserDto.companyId) {
      const company = await this.prisma.company.findFirst({
        where: {
          id: updateUserDto.companyId,
          deletedAt: null,
        },
      });

      if (!company) {
        throw new NotFoundException('Empresa não encontrada');
      }
    }

    if (updateUserDto.branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: {
          id: updateUserDto.branchId,
          deletedAt: null,
        },
      });

      if (!branch) {
        throw new NotFoundException('Filial não encontrada');
      }

      const companyId = updateUserDto.companyId || existingUser.companyId;
      if (companyId && branch.companyId !== companyId) {
        throw new ConflictException('Filial não pertence à empresa informada');
      }
    }

    // Verificar funcionário vinculado se estiver sendo atualizado
    if (updateUserDto.employeeId) {
      const employee = await this.prisma.employee.findFirst({
        where: {
          id: updateUserDto.employeeId,
          deletedAt: null,
        },
      });

      if (!employee) {
        throw new NotFoundException('Funcionário não encontrado');
      }

      const companyId = updateUserDto.companyId || existingUser.companyId;
      if (companyId && employee.companyId !== companyId) {
        throw new ConflictException('Funcionário não pertence à mesma empresa do usuário');
      }

      const branchId = updateUserDto.branchId || existingUser.branchId;
      if (branchId && employee.branchId !== branchId) {
        throw new ConflictException('Filial do funcionário é diferente da filial do usuário');
      }

      const userWithEmployee = await this.prisma.user.findFirst({
        where: {
          employeeId: updateUserDto.employeeId,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (userWithEmployee) {
        throw new ConflictException('Já existe um usuário vinculado a este funcionário');
      }
    }

    // Preparar dados de atualização
    const updateData: any = { ...updateUserDto };

    // Hash da nova senha se fornecida
    if (updateUserDto.newPassword) {
      updateData.password = await bcrypt.hash(updateUserDto.newPassword, 10);
    }

    // Remover newPassword do objeto
    delete updateData.newPassword;

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        role: true,
      },
    });

    return this.mapToResponse(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Soft delete
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private mapToResponse(user: any): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      companyId: user.companyId,
      employeeId: user.employeeId,
      branchId: user.branchId,
      role: {
        id: user.role.id,
        name: user.role.name,
        description: user.role.description,
      },
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      createdBy: user.createdBy,
      deletedAt: user.deletedAt,
    };
  }
}
