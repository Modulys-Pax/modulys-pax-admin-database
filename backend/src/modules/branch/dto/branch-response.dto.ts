import { ApiProperty } from '@nestjs/swagger';

export class BranchResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Filial São Paulo' })
  name: string;

  @ApiProperty({ example: 'SP-001', required: false })
  code?: string;

  @ApiProperty({ example: 'uuid' })
  companyId: string;

  @ApiProperty({ example: 'sp@transportesabc.com.br', required: false })
  email?: string;

  @ApiProperty({ example: '(11) 98765-4321', required: false })
  phone?: string;

  @ApiProperty({ example: 'Rua das Flores, 123', required: false })
  address?: string;

  @ApiProperty({ example: 'São Paulo', required: false })
  city?: string;

  @ApiProperty({ example: 'SP', required: false })
  state?: string;

  @ApiProperty({ example: '01234-567', required: false })
  zipCode?: string;

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
