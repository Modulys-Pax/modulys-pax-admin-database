import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ description: 'ID do usuário' })
  id: string;

  @ApiProperty({ description: 'Email do usuário' })
  email: string;

  @ApiProperty({ description: 'Nome do usuário' })
  name: string;

  @ApiProperty({ description: 'ID da empresa', nullable: true })
  companyId: string | null;

  @ApiProperty({ description: 'ID da filial', nullable: true })
  branchId: string | null;

  @ApiProperty({ description: 'Cargo do usuário' })
  role: {
    id: string;
    name: string;
    description: string | null;
  };

  @ApiProperty({
    description: 'Lista de permissões do usuário',
    example: ['vehicles.view', 'vehicles.create', 'employees.view'],
    type: [String],
    required: false,
  })
  permissions?: string[];
}
