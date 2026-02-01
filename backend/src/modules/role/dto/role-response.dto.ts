import { ApiProperty } from '@nestjs/swagger';

export class PermissionResponseDto {
  @ApiProperty({ description: 'ID da permissão', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Nome da permissão', example: 'vehicles.view' })
  name: string;

  @ApiProperty({ description: 'Descrição da permissão', example: 'Visualizar veículos' })
  description: string | null;

  @ApiProperty({ description: 'Módulo da permissão', example: 'vehicles' })
  module: string;

  @ApiProperty({ description: 'Ação da permissão', example: 'view' })
  action: string;
}

export class RoleResponseDto {
  @ApiProperty({ description: 'ID do cargo', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Nome do cargo', example: 'admin' })
  name: string;

  @ApiProperty({
    description: 'Descrição do cargo',
    example: 'Administrador do sistema',
    required: false,
  })
  description: string | null;

  @ApiProperty({ description: 'Cargo ativo', example: true })
  active: boolean;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;

  @ApiProperty({
    description: 'Lista de permissões do cargo',
    type: [PermissionResponseDto],
    required: false,
  })
  permissions?: PermissionResponseDto[];
}
