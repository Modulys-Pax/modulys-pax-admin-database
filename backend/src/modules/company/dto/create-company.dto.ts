import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({ description: 'Nome da empresa', example: 'Transportes ABC Ltda' })
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @ApiProperty({
    description: 'CNPJ da empresa',
    example: '12.345.678/0001-90',
    required: false,
  })
  @IsString({ message: 'CNPJ deve ser uma string' })
  @IsOptional()
  cnpj?: string;

  @ApiProperty({
    description: 'Nome fantasia',
    example: 'Transportes ABC',
    required: false,
  })
  @IsString({ message: 'Nome fantasia deve ser uma string' })
  @IsOptional()
  tradeName?: string;

  @ApiProperty({
    description: 'Email da empresa',
    example: 'contato@transportesabc.com.br',
    required: false,
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Telefone da empresa',
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
    description: 'Empresa ativa',
    example: true,
    required: false,
    default: true,
  })
  @IsBoolean({ message: 'Ativo deve ser um booleano' })
  @IsOptional()
  active?: boolean;
}
