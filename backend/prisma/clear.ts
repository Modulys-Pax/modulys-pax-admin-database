import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpando todos os dados do banco...\n');

  // Ordem de exclusão respeitando foreign keys
  
  // Auditoria
  await prisma.auditLog.deleteMany();
  
  // RH
  await prisma.expense.deleteMany();
  await prisma.vacation.deleteMany();
  await prisma.salary.deleteMany();
  await prisma.employeeBenefit.deleteMany();
  await prisma.benefit.deleteMany();
  
  // Financeiro
  await prisma.balanceAdjustment.deleteMany();
  await prisma.branchBalance.deleteMany();
  await prisma.accountReceivable.deleteMany();
  await prisma.accountPayable.deleteMany();
  await prisma.financialTransaction.deleteMany();
  
  // Estoque
  await prisma.stockMovement.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.warehouse.deleteMany();
  
  // Manutenção
  await prisma.maintenanceTimeline.deleteMany();
  await prisma.maintenanceMaterial.deleteMany();
  await prisma.maintenanceService.deleteMany();
  await prisma.maintenanceWorker.deleteMany();
  await prisma.maintenanceLabel.deleteMany();
  await prisma.maintenanceOrder.deleteMany();
  
  // Veículos
  await prisma.vehicleMarking.deleteMany();
  await prisma.vehicleDocument.deleteMany();
  await prisma.vehicleStatusHistory.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.vehicleModel.deleteMany();
  await prisma.vehicleBrand.deleteMany();
  
  // Pessoas e Produtos
  await prisma.employee.deleteMany();
  await prisma.product.deleteMany();
  await prisma.unitOfMeasurement.deleteMany();
  
  // Estrutura organizacional
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.company.deleteMany();
  
  // Permissões
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();

  console.log('✅ Todos os dados foram limpos com sucesso!\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao limpar dados:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
