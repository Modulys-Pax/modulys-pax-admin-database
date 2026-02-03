# @grayskull/admin-database

Banco de dados master para o backoffice Grayskull. Gerencia tenants (clientes), planos, módulos e faturamento.

## Instalação

```bash
npm install github:seu-usuario/grayskull-admin-database
```

## Uso

```typescript
import { adminPrisma } from '@grayskull/admin-database';

// Listar todos os tenants ativos
const tenants = await adminPrisma.tenant.findMany({
  where: { status: 'ACTIVE' },
});
```

## Configuração

Defina a variável de ambiente `ADMIN_DATABASE_URL`:

```env
ADMIN_DATABASE_URL="postgresql://user:password@localhost:5432/grayskull_admin?schema=public"
```

## Modelos

### Gestão de Acesso
- `AdminUser` - Usuários do backoffice
- `AuditLog` - Log de auditoria

### Planos e Módulos
- `Plan` - Planos disponíveis (Basic, Pro, Enterprise)
- `Module` - Módulos do sistema (Core, HR, Fleet, etc)
- `PlanModule` - Módulos incluídos em cada plano

### Tenants (Clientes)
- `Tenant` - Empresas clientes
- `TenantContact` - Contatos do cliente
- `TenantModule` - Módulos habilitados para o cliente

### Financeiro
- `Subscription` - Assinaturas
- `Invoice` - Faturas
