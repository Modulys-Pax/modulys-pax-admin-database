import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../shared/dto/paginated-response.dto';
import { AccountReceivableDetailDto } from '../../account-payable/dto/financial-accounts-summary-response.dto';

export class AccountReceivableSummaryDto {
  @ApiProperty({ example: 80000.0, description: 'Total de contas a receber pendentes' })
  totalReceivablePending: number;

  @ApiProperty({ example: 60000.0, description: 'Total de contas a receber recebidas' })
  totalReceivableReceived: number;

  @ApiProperty({ example: 3000.0, description: 'Total de contas a receber canceladas' })
  totalReceivableCancelled: number;

  @ApiProperty({ example: 143000.0, description: 'Total geral de contas a receber' })
  totalReceivable: number;

  @ApiProperty({ example: 20, description: 'Quantidade de contas a receber pendentes' })
  countReceivablePending: number;

  @ApiProperty({ example: 18, description: 'Quantidade de contas a receber recebidas' })
  countReceivableReceived: number;

  @ApiProperty({ example: 1, description: 'Quantidade de contas a receber canceladas' })
  countReceivableCancelled: number;
}

export class AccountReceivableSummaryResponseDto {
  @ApiProperty({ type: AccountReceivableSummaryDto })
  summary: AccountReceivableSummaryDto;

  @ApiProperty({ type: PaginatedResponseDto })
  accountsReceivable: PaginatedResponseDto<AccountReceivableDetailDto>;
}
