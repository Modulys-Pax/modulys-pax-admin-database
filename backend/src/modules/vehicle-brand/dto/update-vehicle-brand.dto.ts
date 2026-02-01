import { PartialType } from '@nestjs/swagger';
import { CreateVehicleBrandDto } from './create-vehicle-brand.dto';

export class UpdateVehicleBrandDto extends PartialType(CreateVehicleBrandDto) {}
