import { PartialType } from '@nestjs/swagger';
import { CreateVacationDto } from './create-vacation.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum VacationStatus {
  PLANNED = 'PLANNED',
  APPROVED = 'APPROVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class UpdateVacationDto extends PartialType(CreateVacationDto) {
  @ApiProperty({
    description: 'Status da férias',
    enum: VacationStatus,
    example: VacationStatus.APPROVED,
    required: false,
  })
  @IsEnum(VacationStatus, { message: 'Status inválido' })
  @IsOptional()
  status?: VacationStatus;
}
