import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { VehicleModelResponseDto } from './dto/vehicle-model-response.dto';
import { CreateVehicleModelDto } from './dto/create-vehicle-model.dto';
import { UpdateVehicleModelDto } from './dto/update-vehicle-model.dto';

@Injectable()
export class VehicleModelService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(brandId?: string, includeInactive = false): Promise<VehicleModelResponseDto[]> {
    const where: any = {};

    if (brandId) {
      where.brandId = brandId;
    }

    if (!includeInactive) {
      where.active = true;
    }

    const models = await this.prisma.vehicleModel.findMany({
      where,
      include: {
        brand: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return models.map((model) => ({
      id: model.id,
      brandId: model.brandId,
      brand: {
        id: model.brand.id,
        name: model.brand.name,
        active: model.brand.active,
        createdAt: model.brand.createdAt,
        updatedAt: model.brand.updatedAt,
      },
      name: model.name,
      active: model.active,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    }));
  }

  async findOne(id: string): Promise<VehicleModelResponseDto> {
    const model = await this.prisma.vehicleModel.findFirst({
      where: {
        id,
      },
      include: {
        brand: true,
      },
    });

    if (!model) {
      throw new NotFoundException('Modelo não encontrado');
    }

    return {
      id: model.id,
      brandId: model.brandId,
      brand: {
        id: model.brand.id,
        name: model.brand.name,
        active: model.brand.active,
        createdAt: model.brand.createdAt,
        updatedAt: model.brand.updatedAt,
      },
      name: model.name,
      active: model.active,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }

  async create(createVehicleModelDto: CreateVehicleModelDto): Promise<VehicleModelResponseDto> {
    // Verificar se marca existe
    const brand = await this.prisma.vehicleBrand.findFirst({
      where: {
        id: createVehicleModelDto.brandId,
      },
    });

    if (!brand) {
      throw new NotFoundException('Marca não encontrada');
    }

    // Verificar se modelo já existe para esta marca
    const existingModel = await this.prisma.vehicleModel.findFirst({
      where: {
        brandId: createVehicleModelDto.brandId,
        name: createVehicleModelDto.name,
      },
    });

    if (existingModel) {
      throw new ConflictException('Modelo já cadastrado para esta marca');
    }

    const model = await this.prisma.vehicleModel.create({
      data: {
        ...createVehicleModelDto,
        active: createVehicleModelDto.active ?? true,
      },
      include: {
        brand: true,
      },
    });

    return {
      id: model.id,
      brandId: model.brandId,
      brand: {
        id: model.brand.id,
        name: model.brand.name,
        active: model.brand.active,
        createdAt: model.brand.createdAt,
        updatedAt: model.brand.updatedAt,
      },
      name: model.name,
      active: model.active,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }

  async update(
    id: string,
    updateVehicleModelDto: UpdateVehicleModelDto,
  ): Promise<VehicleModelResponseDto> {
    const model = await this.prisma.vehicleModel.findFirst({
      where: { id },
      include: {
        brand: true,
      },
    });

    if (!model) {
      throw new NotFoundException('Modelo não encontrado');
    }

    // Se estiver atualizando a marca, verificar se existe
    if (updateVehicleModelDto.brandId && updateVehicleModelDto.brandId !== model.brandId) {
      const brand = await this.prisma.vehicleBrand.findFirst({
        where: {
          id: updateVehicleModelDto.brandId,
        },
      });

      if (!brand) {
        throw new NotFoundException('Marca não encontrada');
      }
    }

    // Se estiver atualizando o nome, verificar se já existe outro modelo com o mesmo nome na mesma marca
    const brandIdToCheck = updateVehicleModelDto.brandId || model.brandId;
    const nameToCheck = updateVehicleModelDto.name || model.name;

    if (
      (updateVehicleModelDto.name && updateVehicleModelDto.name !== model.name) ||
      (updateVehicleModelDto.brandId && updateVehicleModelDto.brandId !== model.brandId)
    ) {
      const existingModel = await this.prisma.vehicleModel.findFirst({
        where: {
          brandId: brandIdToCheck,
          name: nameToCheck,
          id: { not: id },
        },
      });

      if (existingModel) {
        throw new ConflictException('Modelo já cadastrado para esta marca');
      }
    }

    const updatedModel = await this.prisma.vehicleModel.update({
      where: { id },
      data: {
        ...updateVehicleModelDto,
        updatedAt: new Date(),
      },
      include: {
        brand: true,
      },
    });

    return {
      id: updatedModel.id,
      brandId: updatedModel.brandId,
      brand: {
        id: updatedModel.brand.id,
        name: updatedModel.brand.name,
        active: updatedModel.brand.active,
        createdAt: updatedModel.brand.createdAt,
        updatedAt: updatedModel.brand.updatedAt,
      },
      name: updatedModel.name,
      active: updatedModel.active,
      createdAt: updatedModel.createdAt,
      updatedAt: updatedModel.updatedAt,
    };
  }

  async remove(id: string): Promise<void> {
    const model = await this.prisma.vehicleModel.findFirst({
      where: { id },
    });

    if (!model) {
      throw new NotFoundException('Modelo não encontrado');
    }

    // Verificar se há veículos usando este modelo
    const vehiclesWithModel = await this.prisma.vehicle.count({
      where: {
        modelId: id,
        deletedAt: null,
      },
    });

    if (vehiclesWithModel > 0) {
      throw new ConflictException('Não é possível excluir modelo que está em uso por veículos');
    }

    await this.prisma.vehicleModel.delete({
      where: { id },
    });
  }
}
