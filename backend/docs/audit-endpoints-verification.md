# Verificação de Auditoria por Endpoint

Este documento mapeia **todos os endpoints** do backend e indica se **auditoria está sendo aplicada** (interceptor ou manual) ou **explicitamente ignorada**.

**Regra:** Toda ação que **não seja GET** (criar, atualizar, excluir, login, emitir relatório, etc.) deve ser registrada na auditoria, exceto exceções explícitas (ex.: `POST /audit`, `POST /auth/refresh`).

---

## 1. Endpoints excluídos da auditoria (não auditados de propósito)

| Método | Path | Motivo |
|--------|------|--------|
| POST | /audit | Evitar recursão ao criar log de auditoria |
| POST | /auth/refresh | Ruído; refresh de token não é ação de negócio |

---

## 2. Endpoints auditados pelo interceptor (POST / PATCH / PUT / DELETE)

### Auth
| Método | Path | Action | EntityType | Descrição |
|--------|------|--------|------------|-----------|
| POST | /auth/login | LOGIN | Auth | Login realizado |

### CRUD e ações de estado (por recurso)

| Método | Path | Action | EntityType | Descrição |
|--------|------|--------|------------|-----------|
| POST | /users | CREATE | User | User criado |
| PATCH | /users/:id | UPDATE | User | User atualizado |
| DELETE | /users/:id | DELETE | User | User excluído |
| POST | /companies | CREATE | Company | Company criado |
| PATCH | /companies/:id | UPDATE | Company | Company atualizado |
| DELETE | /companies/:id | DELETE | Company | Company excluído |
| POST | /branches | CREATE | Branch | Branch criado |
| PATCH | /branches/:id | UPDATE | Branch | Branch atualizado |
| DELETE | /branches/:id | DELETE | Branch | Branch excluído |
| POST | /products | CREATE | Product | Product criado |
| PATCH | /products/:id | UPDATE | Product | Product atualizado |
| DELETE | /products/:id | DELETE | Product | Product excluído |
| POST | /employees | CREATE | Employee | Employee criado |
| PATCH | /employees/:id | UPDATE | Employee | Employee atualizado |
| DELETE | /employees/:id | DELETE | Employee | Employee excluído |
| POST | /employees/benefits | CREATE | EmployeeBenefit | EmployeeBenefit criado |
| PATCH | /employees/benefits/:id | UPDATE | EmployeeBenefit | EmployeeBenefit atualizado |
| DELETE | /employees/benefits/:id | DELETE | EmployeeBenefit | EmployeeBenefit excluído |
| POST | /benefits | CREATE | Benefit | Benefit criado |
| PATCH | /benefits/:id | UPDATE | Benefit | Benefit atualizado |
| DELETE | /benefits/:id | DELETE | Benefit | Benefit excluído |
| POST | /vehicles | CREATE | Vehicle | Vehicle criado |
| PATCH | /vehicles/:id | UPDATE | Vehicle | Vehicle atualizado |
| PATCH | /vehicles/:id/km | UPDATE | Vehicle | Vehicle atualizado |
| PATCH | /vehicles/:id/status | UPDATE | Vehicle | Vehicle atualizado |
| DELETE | /vehicles/:id | DELETE | Vehicle | Vehicle excluído |
| POST | /maintenance | CREATE | Maintenance | Maintenance criado |
| PATCH | /maintenance/:id | UPDATE | Maintenance | Maintenance atualizado |
| POST | /maintenance/:id/start | UPDATE | Maintenance | Ordem de manutenção iniciada |
| POST | /maintenance/:id/pause | UPDATE | Maintenance | Ordem de manutenção pausada |
| POST | /maintenance/:id/complete | UPDATE | Maintenance | Ordem de manutenção concluída |
| POST | /maintenance/:id/cancel | UPDATE | Maintenance | Ordem de manutenção cancelada |
| DELETE | /maintenance/:id | DELETE | Maintenance | Maintenance excluído |
| POST | /stock/warehouses | CREATE | Warehouse | Warehouse criado |
| PATCH | /stock/warehouses/:id | UPDATE | Warehouse | Warehouse atualizado |
| DELETE | /stock/warehouses/:id | DELETE | Warehouse | Warehouse excluído |
| POST | /stock/movements | CREATE | StockMovement | StockMovement criado |
| POST | /financial-transactions | CREATE | FinancialTransaction | FinancialTransaction criado |
| PATCH | /financial-transactions/:id | UPDATE | FinancialTransaction | FinancialTransaction atualizado |
| DELETE | /financial-transactions/:id | DELETE | FinancialTransaction | FinancialTransaction excluído |
| POST | /accounts-payable | CREATE | AccountPayable | AccountPayable criado |
| PATCH | /accounts-payable/:id | UPDATE | AccountPayable | AccountPayable atualizado |
| PUT | /accounts-payable/:id/pay | UPDATE | AccountPayable | Conta a pagar paga |
| PUT | /accounts-payable/:id/cancel | UPDATE | AccountPayable | Conta a pagar cancelada |
| DELETE | /accounts-payable/:id | DELETE | AccountPayable | AccountPayable excluído |
| POST | /accounts-receivable | CREATE | AccountReceivable | AccountReceivable criado |
| PATCH | /accounts-receivable/:id | UPDATE | AccountReceivable | AccountReceivable atualizado |
| PUT | /accounts-receivable/:id/receive | UPDATE | AccountReceivable | Conta a receber recebida |
| PUT | /accounts-receivable/:id/cancel | UPDATE | AccountReceivable | Conta a receber cancelada |
| DELETE | /accounts-receivable/:id | DELETE | AccountReceivable | AccountReceivable excluído |
| POST | /salaries | CREATE | Salary | Salary criado |
| PATCH | /salaries/:id | UPDATE | Salary | Salary atualizado |
| PUT | /salaries/:id/pay | UPDATE | Salary | Salário pago |
| DELETE | /salaries/:id | DELETE | Salary | Salary excluído |
| POST | /vacations | CREATE | Vacation | Vacation criado |
| PATCH | /vacations/:id | UPDATE | Vacation | Vacation atualizado |
| DELETE | /vacations/:id | DELETE | Vacation | Vacation excluído |
| POST | /expenses | CREATE | Expense | Expense criado |
| PATCH | /expenses/:id | UPDATE | Expense | Expense atualizado |
| DELETE | /expenses/:id | DELETE | Expense | Expense excluído |
| POST | /roles | CREATE | Role | Role criado |
| PATCH | /roles/:id | UPDATE | Role | Role atualizado |
| DELETE | /roles/:id | DELETE | Role | Role excluído |
| POST | /units-of-measurement | CREATE | UnitOfMeasurement | UnitOfMeasurement criado |
| PATCH | /units-of-measurement/:id | UPDATE | UnitOfMeasurement | UnitOfMeasurement atualizado |
| DELETE | /units-of-measurement/:id | DELETE | UnitOfMeasurement | UnitOfMeasurement excluído |
| POST | /vehicle-brands | CREATE | VehicleBrand | VehicleBrand criado |
| PATCH | /vehicle-brands/:id | UPDATE | VehicleBrand | VehicleBrand atualizado |
| DELETE | /vehicle-brands/:id | DELETE | VehicleBrand | VehicleBrand excluído |
| POST | /vehicle-models | CREATE | VehicleModel | VehicleModel criado |
| PATCH | /vehicle-models/:id | UPDATE | VehicleModel | VehicleModel atualizado |
| DELETE | /vehicle-models/:id | DELETE | VehicleModel | VehicleModel excluído |

---

## 3. Endpoints auditados manualmente (ReportService + AuditHelperService)

Relatórios são **GET**; o interceptor não os captura. A emissão é auditada no `ReportService` após cada geração.

| Método | Path | Action | EntityType | entityId | Descrição |
|--------|------|--------|------------|----------|-----------|
| GET | /reports/financial | CREATE | Report | financial | Relatório financeiro emitido |
| GET | /reports/operational | CREATE | Report | operational | Relatório operacional emitido |
| GET | /reports/audit | CREATE | Report | audit | Relatório de auditoria emitido |

---

## 4. Endpoints apenas GET (não auditados; consultas)

- `/audit`, `/audit/entity/:entityType/:entityId`, `/audit/:id`
- `/reports/*` (emissão auditada manualmente; ver acima)
- `/users`, `/users/:id`
- `/companies`, `/companies/:id`
- `/branches`, `/branches/:id`
- `/products`, `/products/:id`, `/products/low-stock/list`
- `/employees`, `/employees/:id`, `/employees/benefits`, `/employees/:id/costs`, `/employees/costs/summary`
- `/benefits`, `/benefits/:id`
- `/vehicles`, `/vehicles/:id`, `/vehicles/:id/history`
- `/maintenance`, `/maintenance/:id`, `/maintenance/vehicle/:vehicleId`
- `/stock/warehouses`, `/stock/warehouses/:id`, `/stock/stocks`, `/stock/stocks/:id`, `/stock/movements`, `/stock/movements/:id`
- `/financial-transactions`, `/financial-transactions/:id`
- `/accounts-payable`, `/accounts-payable/:id`
- `/accounts-receivable`, `/accounts-receivable/:id`
- `/cash-flow`, `/cash-flow/by-period`
- `/salaries`, `/salaries/:id`
- `/vacations`, `/vacations/:id`
- `/expenses`, `/expenses/:id`
- `/roles`, `/roles/:id`
- `/units-of-measurement`, `/units-of-measurement/:id`
- `/vehicle-brands`, `/vehicle-brands/:id`
- `/vehicle-models`, `/vehicle-models/:id`
- `/auth/me`
- `/health`

---

## 5. Como validar

1. **Testes unitários:** `audit-path.helper.spec.ts` cobre `shouldSkip`, `shouldAuditByInterceptor`, `getEntityType`, `getSubRouteDescription` para os paths acima.
2. **Runtime:** Após uma mutação (ou emissão de relatório), consultar `GET /audit` (ou tabela `audit_logs`) e verificar que existe log com `entityType`, `action` e `description` esperados.

---

## 6. Ao adicionar novos endpoints

- **POST/PATCH/PUT/DELETE:** Garantir que o path não esteja em `shouldSkip`. Se for sub-rota de estado (ex.: `/recurso/:id/acao`), incluir `getSubRouteDescription` e `getEntityType` no `audit-path.helper.ts` se necessário.
- **GET que represente “ação”** (ex.: novo tipo de relatório): Auditar manualmente no service (como em `ReportService`) via `AuditHelperService.logAction`.
