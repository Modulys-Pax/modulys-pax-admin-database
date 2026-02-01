# Frontend - ERP Transporte & Logística

## Setup

1. Instalar dependências:
```bash
npm install
```

2. Configurar variáveis de ambiente:
```bash
cp env.example .env.local
# Editar .env.local com suas configurações
```

3. Iniciar servidor de desenvolvimento:
```bash
npm run dev
```

4. Acessar:
- Aplicação: http://localhost:3000
- Teste de API: http://localhost:3000/api-test

## Estrutura

```
app/
├── (auth)/          # Rotas de autenticação (futuro)
├── (dashboard)/     # Rotas do dashboard (futuro)
├── api-test/        # Página de teste de integração
├── layout.tsx       # Layout raiz
├── page.tsx         # Página inicial
└── providers.tsx    # Providers globais (TanStack Query)

components/
└── ui/              # Componentes shadcn/ui

lib/
├── api/             # Clientes de API
├── axios.ts         # Configuração do Axios
└── utils.ts         # Utilitários
```
