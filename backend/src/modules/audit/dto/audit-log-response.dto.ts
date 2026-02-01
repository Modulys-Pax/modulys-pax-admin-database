import { ApiProperty } from '@nestjs/swagger';
import { AuditAction } from '@prisma/client';

export class AuditLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  entityType: string;

  @ApiProperty()
  entityId: string;

  @ApiProperty({ enum: AuditAction })
  action: AuditAction;

  @ApiProperty({ required: false })
  userId?: string;

  @ApiProperty({ required: false })
  userName?: string;

  @ApiProperty({ required: false })
  userEmail?: string;

  @ApiProperty({ required: false })
  companyId?: string;

  @ApiProperty({ required: false })
  branchId?: string;

  @ApiProperty({ required: false })
  oldValues?: any;

  @ApiProperty({ required: false })
  newValues?: any;

  @ApiProperty({ required: false })
  changes?: any;

  @ApiProperty({ required: false })
  ipAddress?: string;

  @ApiProperty({ required: false })
  userAgent?: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  createdAt: Date;
}

export class AuditLogListResponseDto {
  @ApiProperty({ type: [AuditLogResponseDto] })
  data: AuditLogResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
