import { PartialType } from '@nestjs/swagger';
import { CreateEmployeeBenefitDto } from './create-employee-benefit.dto';

export class UpdateEmployeeBenefitDto extends PartialType(CreateEmployeeBenefitDto) {}
