import { ApiProperty } from '@nestjs/swagger';

export class CompanyResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Transportes ABC Ltda' })
  name: string;

  @ApiProperty({ example: '12.345.678/0001-90', required: false })
  cnpj?: string;

  @ApiProperty({ example: 'Transportes ABC', required: false })
  tradeName?: string;

  @ApiProperty({ example: 'contato@transportesabc.com.br', required: false })
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
