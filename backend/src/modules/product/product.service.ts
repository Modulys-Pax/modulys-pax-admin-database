import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import {
  ProductSummaryResponseDto,
  ProductUsageStatDto,
  ProductSummaryPeriodDto,
} from './dto/product-summary-response.dto';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto';
import { Prisma } from '@prisma/client';
import { DEFAULT_COMPANY_ID } from '../../shared/constants/company.constants';
import { validateBranchAccess } from '../../shared/utils/branch-access.util';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async create(
    createProductDto: CreateProductDto,
    userId?: string,
    user?: any,
  ): Promise<ProductResponseDto> {
    // Usar DEFAULT_COMPANY_ID (single-tenant)
    const companyId = DEFAULT_COMPANY_ID;

    // Validar acesso por filial (não-admin só cria na própria filial)
    // O interceptor já força o branchId no body, mas validamos aqui também por segurança
    if (user) {
      validateBranchAccess(user.branchId, user.role, createProductDto.branchId, undefined);
    }

    // Verificar se empresa existe
    const company = await this.prisma.company.findFirst({
      where: {
        id: companyId,
        deletedAt: null,
      },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    const branch = await this.prisma.branch.findFirst({
      where: {
        id: createProductDto.branchId,
        companyId: companyId,
        deletedAt: null,
      },
    });

    if (!branch) {
      throw new NotFoundException('Filial não encontrada');
    }

    // Verificar se código já existe na empresa/filial
    if (createProductDto.code) {
      const existingProduct = await this.prisma.product.findFirst({
        where: {
          companyId: companyId,
          branchId: createProductDto.branchId,
          code: createProductDto.code,
          deletedAt: null,
        },
      });

      if (existingProduct) {
        throw new ConflictException('Código já cadastrado para esta empresa/filial');
      }
    }

    // Limpar unitOfMeasurementId se for string vazia ou null
    const cleanUnitOfMeasurementId =
      createProductDto.unitOfMeasurementId && createProductDto.unitOfMeasurementId.trim() !== ''
        ? createProductDto.unitOfMeasurementId
        : null;

    const product = await this.prisma.product.create({
      data: {
        ...createProductDto,
        unitOfMeasurementId: cleanUnitOfMeasurementId,
        companyId: companyId,
        createdBy: userId,
      },
    });

    return this.mapToResponse(product);
  }

  async findAll(
    branchId?: string,
    includeDeleted = false,
    page = 1,
    limit = 15,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    const skip = (page - 1) * limit;
    const companyId = DEFAULT_COMPANY_ID;

    const where: Prisma.ProductWhereInput = {
      companyId,
      ...(includeDeleted ? {} : { deletedAt: null }),
      ...(branchId ? { branchId } : {}),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          unitOfMeasurement: true,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    // Buscar stocks para todos os produtos de uma vez (apenas da filial de cada produto)
    const productIds = products.map((p) => p.id);
    const stocks = await this.prisma.stock.findMany({
      where: {
        productId: { in: productIds },
        ...(branchId ? { branchId } : {}),
      },
      select: {
        productId: true,
        branchId: true,
        quantity: true,
      },
    });

    // Agrupar stocks por produto e filial
    const stocksByProduct = new Map<string, number>();
    for (const stock of stocks) {
      const product = products.find((p) => p.id === stock.productId);
      if (product && stock.branchId === product.branchId) {
        const currentTotal = stocksByProduct.get(stock.productId) || 0;
        stocksByProduct.set(stock.productId, currentTotal + Number(stock.quantity || 0));
      }
    }

    return {
      data: products.map((product) => {
        const response = this.mapToResponse(product);
        const totalStock = stocksByProduct.get(product.id) || 0;
        return {
          ...response,
          totalStock,
        };
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, user?: any): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        unitOfMeasurement: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Validar acesso por filial (não-admin só acessa própria filial)
    if (user) {
      validateBranchAccess(user.branchId, user.role, undefined, product.branchId);
    }

    // Buscar stocks apenas da filial do produto
    const stocks = await this.prisma.stock.findMany({
      where: {
        productId: product.id,
        branchId: product.branchId,
      },
      select: {
        quantity: true,
      },
    });

    const response = this.mapToResponse(product);
    // Calcular quantidade total em estoque (apenas da filial do produto)
    const totalStock = stocks.reduce((sum: number, stock: any) => {
      return sum + Number(stock.quantity || 0);
    }, 0);
    return {
      ...response,
      totalStock,
    };
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    user?: any,
  ): Promise<ProductResponseDto> {
    const existingProduct = await this.prisma.product.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existingProduct) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Validar acesso por filial (não-admin só acessa própria filial)
    if (user) {
      validateBranchAccess(
        user.branchId,
        user.role,
        updateProductDto.branchId,
        existingProduct.branchId,
      );
    }

    // Verificar empresa e filial se estiverem sendo atualizadas
    if (updateProductDto.companyId || updateProductDto.branchId) {
      const companyId = updateProductDto.companyId || existingProduct.companyId;
      const branchId = updateProductDto.branchId || existingProduct.branchId;

      const company = await this.prisma.company.findFirst({
        where: {
          id: companyId,
          deletedAt: null,
        },
      });

      if (!company) {
        throw new NotFoundException('Empresa não encontrada');
      }

      const branch = await this.prisma.branch.findFirst({
        where: {
          id: branchId,
          companyId,
          deletedAt: null,
        },
      });

      if (!branch) {
        throw new NotFoundException('Filial não encontrada');
      }
    }

    // Verificar código duplicado
    if (updateProductDto.code && updateProductDto.code !== existingProduct.code) {
      const companyId = updateProductDto.companyId || existingProduct.companyId;
      const branchId = updateProductDto.branchId || existingProduct.branchId;

      const productWithCode = await this.prisma.product.findFirst({
        where: {
          companyId,
          branchId,
          code: updateProductDto.code,
          deletedAt: null,
        },
      });

      if (productWithCode && productWithCode.id !== id) {
        throw new ConflictException('Código já cadastrado para esta empresa/filial');
      }
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });

    return this.mapToResponse(product);
  }

  async remove(id: string, user?: any): Promise<void> {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Validar acesso por filial (não-admin só acessa própria filial)
    if (user) {
      validateBranchAccess(user.branchId, user.role, undefined, product.branchId);
    }

    // Soft delete
    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findLowStock(branchId?: string): Promise<ProductResponseDto[]> {
    const companyId = DEFAULT_COMPANY_ID;

    const where: Prisma.ProductWhereInput = {
      companyId,
      deletedAt: null,
      active: true,
      ...(branchId ? { branchId } : {}),
    };

    const products = await this.prisma.product.findMany({
      where,
      include: {
        unitOfMeasurement: true,
        stocks: {
          select: {
            quantity: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Filtrar produtos com estoque baixo ou crítico
    return products
      .map((product) => {
        const response = this.mapToResponse(product);
        const totalStock =
          product.stocks?.reduce((sum: number, stock: any) => {
            return sum + Number(stock.quantity || 0);
          }, 0) || 0;
        return {
          ...response,
          totalStock,
        };
      })
      .filter((product) => {
        const minQuantity = product.minQuantity || 0;
        return product.totalStock !== undefined && product.totalStock < minQuantity;
      });
  }

  /**
   * Obtém resumo estatístico de produtos usados em manutenções
   */
  async getProductSummary(
    branchId?: string,
    startDate?: string,
    endDate?: string,
    page = 1,
    limit = 15,
  ): Promise<ProductSummaryResponseDto> {
    const companyId = DEFAULT_COMPANY_ID;

    // Preparar filtro de data para manutenções (OPEN = materiais planejados; IN_PROGRESS/COMPLETED = usados)
    const maintenanceWhere: Prisma.MaintenanceOrderWhereInput = {
      companyId,
      deletedAt: null,
      status: {
        in: ['OPEN', 'IN_PROGRESS', 'COMPLETED'],
      },
      ...(branchId ? { branchId } : {}),
    };

    if (startDate || endDate) {
      maintenanceWhere.createdAt = {};
      if (startDate) {
        maintenanceWhere.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        maintenanceWhere.createdAt.lte = endDateTime;
      }
    }

    // Buscar todas as ordens de manutenção com materiais
    const orders = await this.prisma.maintenanceOrder.findMany({
      where: maintenanceWhere,
      include: {
        materials: {
          include: {
            product: {
              include: {
                unitOfMeasurement: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Agrupar estatísticas por produto
    const productStatsMap = new Map<
      string,
      {
        productId: string;
        productName: string;
        unit?: string;
        totalQuantity: number;
        totalCost: number;
        usageCount: number;
        periodQuantity: number;
        periodCost: number;
      }
    >();

    // Agrupar por período (YYYY-MM)
    const periodStatsMap = new Map<
      string,
      {
        period: string;
        totalCost: number;
        totalQuantity: number;
        totalQuantityByUnit: Map<string, number>;
        productsSet: Set<string>;
      }
    >();

    let totalCost = 0;
    const totalByUnitMap = new Map<string, number>();
    const productsSet = new Set<string>();
    let totalUsages = 0;

    for (const order of orders) {
      const orderDate = order.createdAt;
      const month = orderDate.getMonth() + 1;
      const periodKey = `${orderDate.getFullYear()}-${month.toString().padStart(2, '0')}`;

      // Inicializar período se não existir
      if (!periodStatsMap.has(periodKey)) {
        periodStatsMap.set(periodKey, {
          period: periodKey,
          totalCost: 0,
          totalQuantity: 0,
          totalQuantityByUnit: new Map(),
          productsSet: new Set(),
        });
      }

      const periodStat = periodStatsMap.get(periodKey)!;

      for (const material of order.materials || []) {
        const productId = material.productId;
        const product = material.product;
        const unitCode = product?.unitOfMeasurement?.code ?? product?.unit ?? '—';

        // Calcular custo do material
        const materialCost = material.totalCost
          ? typeof material.totalCost === 'object' && 'toNumber' in material.totalCost
            ? (material.totalCost as any).toNumber()
            : Number(material.totalCost)
          : material.unitCost && material.quantity
            ? Number(material.unitCost) * Number(material.quantity)
            : 0;

        const materialQuantity = material.quantity
          ? typeof material.quantity === 'object' && 'toNumber' in material.quantity
            ? (material.quantity as any).toNumber()
            : Number(material.quantity)
          : 0;

        // Atualizar estatísticas do produto
        if (!productStatsMap.has(productId)) {
          const unitFallback = product?.unit;
          productStatsMap.set(productId, {
            productId,
            productName: product?.name || 'Produto não encontrado',
            unit: product?.unitOfMeasurement?.code || (unitFallback ? unitFallback : undefined),
            totalQuantity: 0,
            totalCost: 0,
            usageCount: 0,
            periodQuantity: 0,
            periodCost: 0,
          });
        }

        const productStat = productStatsMap.get(productId)!;
        productStat.totalQuantity += materialQuantity;
        productStat.totalCost += materialCost;
        productStat.usageCount += 1;

        // Se tiver filtro de data, adicionar ao período
        if (startDate || endDate) {
          const start = startDate ? new Date(startDate) : null;
          const end = endDate ? new Date(endDate) : null;
          end?.setHours(23, 59, 59, 999);

          if ((!start || orderDate >= start) && (!end || orderDate <= end)) {
            productStat.periodQuantity += materialQuantity;
            productStat.periodCost += materialCost;
          }
        } else {
          productStat.periodQuantity += materialQuantity;
          productStat.periodCost += materialCost;
        }

        // Totais por unidade de medida (geral)
        totalByUnitMap.set(unitCode, (totalByUnitMap.get(unitCode) ?? 0) + materialQuantity);

        totalCost += materialCost;
        productsSet.add(productId);

        // Período: totais e por unidade
        periodStat.totalCost += materialCost;
        periodStat.totalQuantity += materialQuantity;
        periodStat.totalQuantityByUnit.set(
          unitCode,
          (periodStat.totalQuantityByUnit.get(unitCode) ?? 0) + materialQuantity,
        );
        periodStat.productsSet.add(productId);
      }

      if (order.materials && order.materials.length > 0) {
        totalUsages += 1;
      }
    }

    // Converter mapas para arrays
    const allProducts: ProductUsageStatDto[] = Array.from(productStatsMap.values()).map((stat) => ({
      productId: stat.productId,
      productName: stat.productName,
      unit: stat.unit,
      totalQuantityUsed: stat.totalQuantity,
      totalCost: stat.totalCost,
      averageUnitCost: stat.totalQuantity > 0 ? stat.totalCost / stat.totalQuantity : 0,
      usageCount: stat.usageCount,
      periodQuantityUsed: stat.periodQuantity,
      periodCost: stat.periodCost,
    }));

    // Ordenar produtos por custo total (decrescente)
    allProducts.sort((a, b) => b.totalCost - a.totalCost);

    // Aplicar paginação
    const totalProducts = allProducts.length;
    const skip = (page - 1) * limit;
    const products = allProducts.slice(skip, skip + limit);

    // Converter totais por unidade (geral)
    const totalQuantityByUnit = Array.from(totalByUnitMap.entries())
      .map(([unit, totalQuantity]) => ({ unit, totalQuantity }))
      .sort((a, b) => a.unit.localeCompare(b.unit));

    // Converter períodos para array
    const periods: ProductSummaryPeriodDto[] = Array.from(periodStatsMap.values())
      .map((stat) => ({
        period: stat.period,
        totalCost: stat.totalCost,
        totalQuantity: stat.totalQuantity,
        totalQuantityByUnit: Array.from(stat.totalQuantityByUnit.entries())
          .map(([unit, totalQuantity]) => ({ unit, totalQuantity }))
          .sort((a, b) => a.unit.localeCompare(b.unit)),
        productsCount: stat.productsSet.size,
      }))
      .sort((a, b) => b.period.localeCompare(a.period)); // Mais recente primeiro

    return {
      totalCost,
      totalQuantityByUnit,
      totalProducts: productsSet.size,
      totalUsages,
      products: {
        data: products,
        total: totalProducts,
        page,
        limit,
        totalPages: Math.ceil(totalProducts / limit),
      },
      periods,
    };
  }

  private mapToResponse(product: any): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      code: product.code,
      description: product.description,
      unitOfMeasurementId: product.unitOfMeasurementId,
      unit: product.unitOfMeasurement?.code || product.unit || undefined,
      unitPrice: product.unitPrice ? Number(product.unitPrice) : undefined,
      minQuantity: product.minQuantity ? Number(product.minQuantity) : undefined,
      companyId: product.companyId,
      branchId: product.branchId,
      active: product.active,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      createdBy: product.createdBy,
      deletedAt: product.deletedAt,
      totalStock: product.totalStock ? Number(product.totalStock) : undefined,
    };
  }
}
