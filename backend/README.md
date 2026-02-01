# Backend - ERP Transporte & Logística

## Setup

1. Instalar dependências:
```bash
npm install
```

2. Configurar variáveis de ambiente:
```bash
cp .env.example .env
# Editar .env com suas configurações
```

3. Configurar banco de dados:
```bash
# Gerar Prisma Client
npm run prisma:generate

# Criar migrations (você executará manualmente)
# npm run prisma:migrate
```

4. Iniciar servidor:
```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod
```

## Endpoints

- Health Check: `GET /health`
- Swagger: `GET /docs`

## Estrutura

```
src/
├── modules/          # Módulos de negócio
├── shared/           # Código compartilhado
│   ├── prisma/       # Prisma Service
│   ├── config/       # Configurações
│   ├── guards/       # Guards (JWT, etc)
│   ├── decorators/   # Decorators customizados
│   └── interceptors/ # Interceptors
├── main.ts           # Entry point
└── app.module.ts     # Módulo raiz
```
