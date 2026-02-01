import { IsNotEmpty, IsNumber, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum AdjustmentType {
  MANUAL_ADJUSTMENT = 'MANUAL_ADJUSTMENT',
  INITIAL_BALANCE = 'INITIAL_BALANCE',
  CORRECTION = 'CORRECTION',
}

export class AdjustBalanceDto {
  @ApiProperty({
    description: 'Novo saldo da filial',
    example: 50000,
  })
  @IsNotEmpty({ message: 'O novo saldo é obrigatório' })
  @IsNumber({}, { message: 'O novo saldo deve ser um número' })
  newBalance: number;

  @ApiProperty({
    description: 'Tipo do ajuste',
    enum: AdjustmentType,
    example: AdjustmentType.MANUAL_ADJUSTMENT,
  })
  @IsNotEmpty({ message: 'O tipo de ajuste é obrigatório' })
  @IsEnum(AdjustmentType, { message: 'Tipo de ajuste inválido' })
  adjustmentType: AdjustmentType;

  @ApiProperty({
    description: 'Motivo do ajuste',
    example: 'Ajuste inicial do saldo da filial',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'O motivo deve ser uma string' })
  reason?: string;
}
