import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../shared/dto/paginated-response.dto';
import { AccountPayableDetailDto } from './financial-accounts-summary-response.dto';

export class AccountPayableSummaryDto {
  @ApiProperty({ example: 50000.0, description: 'Total de contas a pagar pendentes' })
  totalPayablePending: number;

  @ApiProperty({ example: 30000.0, description: 'Total de contas a pagar pagas' })
  totalPayablePaid: number;

  @ApiProperty({ example: 5000.0, description: 'Total de contas a pagar canceladas' })
  totalPayableCancelled: number;

  @ApiProperty({ example: 85000.0, description: 'Total geral de contas a pagar' })
  totalPayable: number;

  @ApiProperty({ example: 25, description: 'Quantidade de contas a pagar pendentes' })
  countPayablePending: number;

  @ApiProperty({ example: 15, description: 'Quantidade de contas a pagar pagas' })
  countPayablePaid: number;

  @ApiProperty({ example: 2, description: 'Quantidade de contas a pagar canceladas' })
  countPayableCancelled: number;
}

export class AccountPayableSummaryResponseDto {
  @ApiProperty({ type: AccountPayableSummaryDto })
  summary: AccountPayableSummaryDto;

  @ApiProperty({ type: PaginatedResponseDto })
  accountsPayable: PaginatedResponseDto<AccountPayableDetailDto>;
}
