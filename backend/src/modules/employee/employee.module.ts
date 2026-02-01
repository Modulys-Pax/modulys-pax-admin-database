import { Module } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { EmployeeBenefitService } from './employee-benefit.service';
import { EmployeeBenefitController } from './employee-benefit.controller';
import { PrismaModule } from '../../shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    EmployeeBenefitController, // Deve vir antes para evitar conflito com @Get(':id')
    EmployeeController,
  ],
  providers: [EmployeeService, EmployeeBenefitService],
  exports: [EmployeeService, EmployeeBenefitService],
})
export class EmployeeModule {}
