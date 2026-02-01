import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEmail, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBranchDto {
  @ApiProperty({ description: 'Nome da filial', example: 'Filial São Paulo' })
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @ApiProperty({
    description: 'Código da filial',
    example: 'SP-001',
    required: false,
  })
  @IsString({ message: 'Código deve ser uma string' })
  @IsOptional()
  code?: string;

  @ApiProperty({
    description: 'ID da empresa',
    example: 'uuid',
  })
  @IsUUID('4', { message: 'ID da empresa deve ser um UUID válido' })
  @IsNotEmpty({ message: 'ID da empresa é obrigatório' })
  companyId: string;

  @ApiProperty({
    description: 'Email da filial',
    example: 'sp@transportesabc.com.br',
    required: false,
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Telefone da filial',
    example: '(11) 98765-4321',
    required: false,
  })
  @IsString({ message: 'Telefone deve ser uma string' })
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Endereço',
    example: 'Rua das Flores, 123',
    required: false,
  })
  @IsString({ message: 'Endereço deve ser uma string' })
  @IsOptional()
  address?: string;

  @ApiProperty({
    description: 'Cidade',
    example: 'São Paulo',
    required: false,
  })
  @IsString({ message: 'Cidade deve ser uma string' })
  @IsOptional()
  city?: string;

  @ApiProperty({
    description: 'Estado (UF)',
    example: 'SP',
    required: false,
  })
  @IsString({ message: 'Estado deve ser uma string' })
  @IsOptional()
  state?: string;

  @ApiProperty({
    description: 'CEP',
    example: '01234-567',
    required: false,
  })
  @IsString({ message: 'CEP deve ser uma string' })
  @IsOptional()
  zipCode?: string;

  @ApiProperty({
    description: 'Filial ativa',
    example: true,
    required: false,
    default: true,
  })
  @IsBoolean({ message: 'Ativo deve ser um booleano' })
  @IsOptional()
  active?: boolean;
}
