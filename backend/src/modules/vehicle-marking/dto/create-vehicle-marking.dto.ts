import { IsString, IsNotEmpty, IsUUID, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVehicleMarkingDto {
  @ApiProperty({
    description: 'ID do veículo',
    example: 'uuid',
  })
  @IsUUID('4', { message: 'ID do veículo deve ser um UUID válido' })
  @IsNotEmpty({ message: 'ID do veículo é obrigatório' })
  vehicleId: string;

  @ApiProperty({
    description: 'Quilometragem quando o veículo chegou',
    example: 50000,
  })
  @IsInt({ message: 'Quilometragem deve ser um número inteiro' })
  @Min(0, { message: 'Quilometragem não pode ser negativa' })
  @IsNotEmpty({ message: 'Quilometragem é obrigatória' })
  km: number;

  @ApiProperty({
    description: 'ID da empresa',
    example: 'uuid',
  })
  @IsUUID('4', { message: 'ID da empresa deve ser um UUID válido' })
  @IsNotEmpty({ message: 'ID da empresa é obrigatório' })
  companyId: string;

  @ApiProperty({
    description: 'ID da filial',
    example: 'uuid',
  })
  @IsUUID('4', { message: 'ID da filial deve ser um UUID válido' })
  @IsNotEmpty({ message: 'ID da filial é obrigatório' })
  branchId: string;
}
