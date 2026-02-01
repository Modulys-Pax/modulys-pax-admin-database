import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MaintenanceActionDto {
  @ApiProperty({
    description: 'Observações sobre a ação',
    example: 'Ordem iniciada pelo mecânico responsável',
    required: false,
  })
  @IsString({ message: 'Observações devem ser uma string' })
  @IsOptional()
  notes?: string;
}
