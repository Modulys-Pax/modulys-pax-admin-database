import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { VehicleBrandResponseDto } from './dto/vehicle-brand-response.dto';
import { CreateVehicleBrandDto } from './dto/create-vehicle-brand.dto';
import { UpdateVehicleBrandDto } from './dto/update-vehicle-brand.dto';

@Injectable()
export class VehicleBrandService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(includeInactive = false): Promise<VehicleBrandResponseDto[]> {
    const brands = await this.prisma.vehicleBrand.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: {
        name: 'asc',
      },
    });

    return brands.map((brand) => ({
      id: brand.id,
      name: brand.name,
      active: brand.active,
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
    }));
  }

  async findOne(id: string): Promise<VehicleBrandResponseDto> {
    const brand = await this.prisma.vehicleBrand.findFirst({
      where: {
        id,
      },
    });

    if (!brand) {
      throw new NotFoundException('Marca não encontrada');
    }

    return {
      id: brand.id,
      name: brand.name,
      active: brand.active,
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
    };
  }

  async create(createVehicleBrandDto: CreateVehicleBrandDto): Promise<VehicleBrandResponseDto> {
    // Verificar se nome já existe
    const existingBrand = await this.prisma.vehicleBrand.findFirst({
      where: {
        name: createVehicleBrandDto.name,
      },
    });

    if (existingBrand) {
      throw new ConflictException('Marca já cadastrada');
    }

    const brand = await this.prisma.vehicleBrand.create({
      data: {
        ...createVehicleBrandDto,
        active: createVehicleBrandDto.active ?? true,
      },
    });

    return {
      id: brand.id,
      name: brand.name,
      active: brand.active,
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
    };
  }

  async update(
    id: string,
    updateVehicleBrandDto: UpdateVehicleBrandDto,
  ): Promise<VehicleBrandResponseDto> {
    const brand = await this.prisma.vehicleBrand.findFirst({
      where: { id },
    });

    if (!brand) {
      throw new NotFoundException('Marca não encontrada');
    }

    // Se estiver atualizando o nome, verificar se já existe outro com o mesmo nome
    if (updateVehicleBrandDto.name && updateVehicleBrandDto.name !== brand.name) {
      const existingBrand = await this.prisma.vehicleBrand.findFirst({
        where: {
          name: updateVehicleBrandDto.name,
          id: { not: id },
        },
      });

      if (existingBrand) {
        throw new ConflictException('Marca já cadastrada');
      }
    }

    const updatedBrand = await this.prisma.vehicleBrand.update({
      where: { id },
      data: {
        ...updateVehicleBrandDto,
        updatedAt: new Date(),
      },
    });

    return {
      id: updatedBrand.id,
      name: updatedBrand.name,
      active: updatedBrand.active,
      createdAt: updatedBrand.createdAt,
      updatedAt: updatedBrand.updatedAt,
    };
  }

  async remove(id: string): Promise<void> {
    const brand = await this.prisma.vehicleBrand.findFirst({
      where: { id },
    });

    if (!brand) {
      throw new NotFoundException('Marca não encontrada');
    }

    // Verificar se há veículos usando esta marca
    const vehiclesWithBrand = await this.prisma.vehicle.count({
      where: {
        brandId: id,
        deletedAt: null,
      },
    });

    if (vehiclesWithBrand > 0) {
      throw new ConflictException('Não é possível excluir marca que está em uso por veículos');
    }

    await this.prisma.vehicleBrand.delete({
      where: { id },
    });
  }
}
