import { PrismaClient } from '../generated/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco admin...\n');

  // ============================================================
  // 1. CRIAR ADMIN USER (seu login no backoffice)
  // ============================================================
  console.log('👤 Criando usuário admin...');
  
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  const adminUser = await prisma.adminUser.upsert({
    where: { email: 'admin@grayskull.com.br' },
    update: {},
    create: {
      email: 'admin@grayskull.com.br',
      password: adminPassword,
      name: 'Administrador Grayskull',
      role: 'SUPER_ADMIN',
    },
  });
  
  console.log(`   ✅ Admin criado: ${adminUser.email}`);

  // ============================================================
  // 2. MÓDULOS DISPONÍVEIS (apenas o que está implementado)
  // ============================================================
  console.log('\n📦 Configurando módulos...');
  
  // Remove módulos não implementados (para manter somente o que existe)
  const modulesToRemove = ['hr', 'fleet', 'financial', 'stock', 'chat'];
  for (const code of modulesToRemove) {
    const mod = await prisma.module.findUnique({ where: { code } });
    if (mod) {
      await prisma.planModule.deleteMany({ where: { moduleId: mod.id } });
      await prisma.tenantModule.deleteMany({ where: { moduleId: mod.id } });
      await prisma.module.delete({ where: { id: mod.id } });
      console.log(`   🗑️ Removido: ${code}`);
    }
  }
  
  // Cria/atualiza apenas o Core (autenticação, empresa, funcionários, permissões)
  const coreModule = await prisma.module.upsert({
    where: { code: 'core' },
    update: { name: 'Core', description: 'Autenticação, usuários, empresa, permissões', isCore: true },
    create: {
      code: 'core',
      name: 'Core',
      description: 'Autenticação, usuários, empresa, permissões',
      isCore: true,
    },
  });
  console.log(`   ✅ Módulo: ${coreModule.name} (${coreModule.code})`);

  // ============================================================
  // 3. CRIAR PLANOS
  // ============================================================
  console.log('\n💰 Criando planos...');

  // Plano Básico
  const basicPlan = await prisma.plan.upsert({
    where: { code: 'basic' },
    update: {},
    create: {
      code: 'basic',
      name: 'Básico',
      description: 'Para pequenas empresas',
      price: 99.90,
      billingCycle: 'MONTHLY',
      maxUsers: 5,
      maxBranches: 1,
    },
  });
  
  await prisma.planModule.upsert({
    where: { planId_moduleId: { planId: basicPlan.id, moduleId: coreModule.id } },
    update: {},
    create: { planId: basicPlan.id, moduleId: coreModule.id },
  });
  
  console.log(`   ✅ Plano: ${basicPlan.name} - R$ ${basicPlan.price}/mês (core)`);

  // Plano Profissional
  const proPlan = await prisma.plan.upsert({
    where: { code: 'professional' },
    update: {},
    create: {
      code: 'professional',
      name: 'Profissional',
      description: 'Para médias empresas',
      price: 299.90,
      billingCycle: 'MONTHLY',
      maxUsers: 20,
      maxBranches: 3,
    },
  });
  
  await prisma.planModule.upsert({
    where: { planId_moduleId: { planId: proPlan.id, moduleId: coreModule.id } },
    update: {},
    create: { planId: proPlan.id, moduleId: coreModule.id },
  });
  
  console.log(`   ✅ Plano: ${proPlan.name} - R$ ${proPlan.price}/mês (core)`);

  // Plano Enterprise
  const enterprisePlan = await prisma.plan.upsert({
    where: { code: 'enterprise' },
    update: {},
    create: {
      code: 'enterprise',
      name: 'Enterprise',
      description: 'Para grandes empresas',
      price: 599.90,
      billingCycle: 'MONTHLY',
      maxUsers: 100,
      maxBranches: 10,
    },
  });
  
  const allModules = await prisma.module.findMany();
  for (const mod of allModules) {
    await prisma.planModule.upsert({
      where: { planId_moduleId: { planId: enterprisePlan.id, moduleId: mod.id } },
      update: {},
      create: { planId: enterprisePlan.id, moduleId: mod.id },
    });
  }
  
  console.log(`   ✅ Plano: ${enterprisePlan.name} - R$ ${enterprisePlan.price}/mês (${allModules.length} módulo(s))`);

  // ============================================================
  // RESUMO
  // ============================================================
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('✅ SEED CONCLUÍDO!');
  console.log('════════════════════════════════════════════════════════════════');
  console.log('\n📋 Credenciais do Admin:');
  console.log('   Email: admin@grayskull.com.br');
  console.log('   Senha: admin123');
  console.log('\n🎯 Próximos passos:');
  console.log('   1. Inicie a API: npm run dev');
  console.log('   2. Faça login: POST /api/admin/auth/login');
  console.log('   3. Cadastre um tenant: POST /api/admin/tenants');
  console.log('   4. Provisione o banco: POST /api/admin/provisioning/tenant/:id');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
