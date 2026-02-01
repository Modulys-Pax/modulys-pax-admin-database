import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  CreateMaintenanceWorkerDto,
  CreateMaintenanceServiceDto,
  CreateMaintenanceMaterialDto,
} from './create-maintenance-order.dto';

export class UpdateMaintenanceOrderDto {
  @ApiProperty({
    description: 'Descrição do problema/serviço',
    example: 'Troca de óleo preventiva',
    required: false,
  })
  @IsString({ message: 'Descrição deve ser uma string' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Observações gerais',
    example: 'Veículo apresentou ruído no motor',
    required: false,
  })
  @IsString({ message: 'Observações devem ser uma string' })
  @IsOptional()
  observations?: string;

  @ApiProperty({
    description: 'Funcionários alocados na ordem',
    type: [CreateMaintenanceWorkerDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMaintenanceWorkerDto)
  @IsOptional()
  workers?: CreateMaintenanceWorkerDto[];

  @ApiProperty({
    description: 'Serviços a serem realizados',
    type: [CreateMaintenanceServiceDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMaintenanceServiceDto)
  @IsOptional()
  services?: CreateMaintenanceServiceDto[];

  @ApiProperty({
    description: 'Materiais a serem consumidos',
    type: [CreateMaintenanceMaterialDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMaintenanceMaterialDto)
  @IsOptional()
  materials?: CreateMaintenanceMaterialDto[];
}
