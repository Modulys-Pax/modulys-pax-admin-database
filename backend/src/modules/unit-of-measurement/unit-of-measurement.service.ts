import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { UnitOfMeasurementResponseDto } from './dto/unit-of-measurement-response.dto';
import { CreateUnitOfMeasurementDto } from './dto/create-unit-of-measurement.dto';
import { UpdateUnitOfMeasurementDto } from './dto/update-unit-of-measurement.dto';

@Injectable()
export class UnitOfMeasurementService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(includeInactive = false): Promise<UnitOfMeasurementResponseDto[]> {
    const units = await this.prisma.unitOfMeasurement.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: {
        code: 'asc',
      },
    });

    return units.map((unit) => ({
      id: unit.id,
      code: unit.code,
      name: unit.name,
      description: unit.description,
      active: unit.active,
      createdAt: unit.createdAt,
      updatedAt: unit.updatedAt,
    }));
  }

  async findOne(id: string): Promise<UnitOfMeasurementResponseDto> {
    const unit = await this.prisma.unitOfMeasurement.findFirst({
      where: {
        id,
      },
    });

    if (!unit) {
      throw new NotFoundException('Unidade de medida não encontrada');
    }

    return {
      id: unit.id,
      code: unit.code,
      name: unit.name,
      description: unit.description,
      active: unit.active,
      createdAt: unit.createdAt,
      updatedAt: unit.updatedAt,
    };
  }

  async create(
    createUnitOfMeasurementDto: CreateUnitOfMeasurementDto,
    userId?: string,
  ): Promise<UnitOfMeasurementResponseDto> {
    // Verificar se código já existe
    const existingUnit = await this.prisma.unitOfMeasurement.findFirst({
      where: {
        code: createUnitOfMeasurementDto.code,
      },
    });

    if (existingUnit) {
      throw new ConflictException('Código da unidade de medida já cadastrado');
    }

    const unit = await this.prisma.unitOfMeasurement.create({
      data: {
        ...createUnitOfMeasurementDto,
        active: createUnitOfMeasurementDto.active ?? true,
        createdBy: userId,
      },
    });

    return {
      id: unit.id,
      code: unit.code,
      name: unit.name,
      description: unit.description,
      active: unit.active,
      createdAt: unit.createdAt,
      updatedAt: unit.updatedAt,
    };
  }

  async update(
    id: string,
    updateUnitOfMeasurementDto: UpdateUnitOfMeasurementDto,
    userId?: string,
  ): Promise<UnitOfMeasurementResponseDto> {
    const unit = await this.prisma.unitOfMeasurement.findFirst({
      where: { id },
    });

    if (!unit) {
      throw new NotFoundException('Unidade de medida não encontrada');
    }

    // Se estiver atualizando o código, verificar se já existe outro com o mesmo código
    if (updateUnitOfMeasurementDto.code && updateUnitOfMeasurementDto.code !== unit.code) {
      const existingUnit = await this.prisma.unitOfMeasurement.findFirst({
        where: {
          code: updateUnitOfMeasurementDto.code,
          id: { not: id },
        },
      });

      if (existingUnit) {
        throw new ConflictException('Código da unidade de medida já cadastrado');
      }
    }

    const updatedUnit = await this.prisma.unitOfMeasurement.update({
      where: { id },
      data: {
        ...updateUnitOfMeasurementDto,
        updatedAt: new Date(),
      },
    });

    return {
      id: updatedUnit.id,
      code: updatedUnit.code,
      name: updatedUnit.name,
      description: updatedUnit.description,
      active: updatedUnit.active,
      createdAt: updatedUnit.createdAt,
      updatedAt: updatedUnit.updatedAt,
    };
  }

  async remove(id: string): Promise<void> {
    const unit = await this.prisma.unitOfMeasurement.findFirst({
      where: { id },
    });

    if (!unit) {
      throw new NotFoundException('Unidade de medida não encontrada');
    }

    // Verificar se há produtos usando esta unidade de medida
    const productsWithUnit = await this.prisma.product.count({
      where: {
        unitOfMeasurementId: id,
        deletedAt: null,
      },
    });

    if (productsWithUnit > 0) {
      throw new ConflictException(
        'Não é possível excluir unidade de medida que está em uso por produtos',
      );
    }

    await this.prisma.unitOfMeasurement.delete({
      where: { id },
    });
  }
}
