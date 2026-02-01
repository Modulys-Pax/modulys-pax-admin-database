import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEmail,
  IsUUID,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'Nome do usuário', example: 'João Silva' })
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'joao.silva@transportesabc.com.br',
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'senha123',
    minLength: 6,
  })
  @IsString({ message: 'Senha deve ser uma string' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  password: string;

  @ApiProperty({
    description: 'ID da empresa',
    example: 'uuid',
    required: false,
  })
  @IsUUID('4', { message: 'ID da empresa deve ser um UUID válido' })
  @IsOptional()
  companyId?: string;

  @ApiProperty({
    description: 'ID da filial',
    example: 'uuid',
    required: false,
  })
  @IsUUID('4', { message: 'ID da filial deve ser um UUID válido' })
  @IsOptional()
  branchId?: string;

  @ApiProperty({
    description: 'ID do funcionário vinculado (opcional)',
    example: 'uuid',
    required: false,
  })
  @IsUUID('4', { message: 'ID do funcionário deve ser um UUID válido' })
  @IsOptional()
  employeeId?: string;

  @ApiProperty({
    description: 'ID do cargo (role)',
    example: 'uuid',
  })
  @IsUUID('4', { message: 'ID do cargo deve ser um UUID válido' })
  @IsNotEmpty({ message: 'ID do cargo é obrigatório' })
  roleId: string;

  @ApiProperty({
    description: 'Usuário ativo',
    example: true,
    required: false,
    default: true,
  })
  @IsBoolean({ message: 'Ativo deve ser um booleano' })
  @IsOptional()
  active?: boolean;
}
