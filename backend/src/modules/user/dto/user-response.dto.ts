import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'joao.silva@transportesabc.com.br' })
  email: string;

  @ApiProperty({ example: 'João Silva' })
  name: string;

  @ApiProperty({ example: 'uuid', required: false })
  companyId?: string;

  @ApiProperty({ example: 'uuid', required: false })
  employeeId?: string;

  @ApiProperty({ example: 'uuid', required: false })
  branchId?: string;

  @ApiProperty({
    description: 'Cargo do usuário',
    example: { id: 'uuid', name: 'Admin', description: 'Administrador' },
  })
  role: {
    id: string;
    name: string;
    description: string | null;
  };

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  createdBy?: string;

  @ApiProperty({ required: false })
  deletedAt?: Date;
}
