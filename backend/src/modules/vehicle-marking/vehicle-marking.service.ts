import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateVehicleMarkingDto } from './dto/create-vehicle-marking.dto';
import { VehicleMarkingResponseDto } from './dto/vehicle-marking-response.dto';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto';
import { Prisma } from '@prisma/client';
import { DEFAULT_COMPANY_ID } from '../../shared/constants/company.constants';
import { getPrimaryPlate } from '../../shared/utils/vehicle-plate.util';
import { validateBranchAccess } from '../../shared/utils/branch-access.util';

@Injectable()
export class VehicleMarkingService {
  constructor(private prisma: PrismaService) {}

  async create(
    createVehicleMarkingDto: CreateVehicleMarkingDto,
    userId?: string,
    user?: any,
  ): Promise<VehicleMarkingResponseDto> {
    const companyId = DEFAULT_COMPANY_ID;

    // Validar acesso por filial
    if (user) {
      validateBranchAccess(user.branchId, user.role, createVehicleMarkingDto.branchId, undefined);
    }

    // Verificar se veículo existe
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id: createVehicleMarkingDto.vehicleId,
        companyId,
        deletedAt: null,
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado');
    }

    // Verificar se filial existe
    const branch = await this.prisma.branch.findFirst({
      where: {
        id: createVehicleMarkingDto.branchId,
        companyId,
        deletedAt: null,
      },
    });

    if (!branch) {
      throw new NotFoundException('Filial não encontrada');
    }

    // Criar marcação, replicar KM no veículo e registrar no histórico de status
    const marking = await this.prisma.$transaction(async (tx) => {
      const created = await tx.vehicleMarking.create({
        data: {
          vehicleId: createVehicleMarkingDto.vehicleId,
          km: createVehicleMarkingDto.km,
          companyId,
          branchId: createVehicleMarkingDto.branchId,
          createdBy: userId,
        },
        include: {
          vehicle: {
            include: {
              plates: true,
            },
          },
        },
      });

      await tx.vehicle.update({
        where: { id: createVehicleMarkingDto.vehicleId },
        data: { currentKm: createVehicleMarkingDto.km },
      });

      await tx.vehicleStatusHistory.create({
        data: {
          vehicleId: createVehicleMarkingDto.vehicleId,
          status: vehicle.status,
          km: createVehicleMarkingDto.km,
          notes: 'Quilometragem atualizada via marcação (chegada na filial)',
          createdBy: userId,
        },
      });

      return created;
    });

    return this.mapToResponse(marking);
  }

  async findAll(
    branchId?: string,
    startDate?: string,
    endDate?: string,
    page = 1,
    limit = 15,
  ): Promise<PaginatedResponseDto<VehicleMarkingResponseDto>> {
    const skip = (page - 1) * limit;
    const companyId = DEFAULT_COMPANY_ID;

    const where: Prisma.VehicleMarkingWhereInput = {
      companyId,
      ...(branchId ? { branchId } : {}),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate + 'T23:59:59.999Z') } : {}),
            },
          }
        : {}),
    };

    const [markings, total] = await Promise.all([
      this.prisma.vehicleMarking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          vehicle: {
            include: {
              plates: true,
            },
          },
        },
      }),
      this.prisma.vehicleMarking.count({ where }),
    ]);

    return {
      data: markings.map((marking) => this.mapToResponse(marking)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<VehicleMarkingResponseDto> {
    const companyId = DEFAULT_COMPANY_ID;

    const marking = await this.prisma.vehicleMarking.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        vehicle: {
          select: {
            plates: true,
          },
        },
      },
    });

    if (!marking) {
      throw new NotFoundException('Marcação não encontrada');
    }

    return this.mapToResponse(marking);
  }

  async delete(id: string, userId?: string): Promise<void> {
    const companyId = DEFAULT_COMPANY_ID;

    const marking = await this.prisma.vehicleMarking.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!marking) {
      throw new NotFoundException('Marcação não encontrada');
    }

    await this.prisma.vehicleMarking.delete({
      where: { id },
    });
  }

  private mapToResponse(marking: any): VehicleMarkingResponseDto {
    return {
      id: marking.id,
      vehicleId: marking.vehicleId,
      vehiclePlate: marking.vehicle ? getPrimaryPlate(marking.vehicle) : undefined,
      km: marking.km,
      companyId: marking.companyId,
      branchId: marking.branchId,
      createdAt: marking.createdAt,
      createdBy: marking.createdBy,
    };
  }
}
