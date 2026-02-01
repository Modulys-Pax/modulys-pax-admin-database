import { BreadcrumbItem } from '@/components/ui/breadcrumb';

// Mapeamento de rotas para labels legíveis
const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  companies: 'Empresas',
  branches: 'Filiais',
  users: 'Usuários',
  products: 'Produtos',
  employees: 'Funcionários',
  vehicles: 'Veículos',
  maintenance: 'Manutenção',
  audit: 'Auditoria',
  stock: 'Estoque',
  warehouses: 'Depósitos',
  'accounts-payable': 'Contas a Pagar',
  'accounts-receivable': 'Contas a Receber',
  costs: 'Gastos com Veículos',
  summary: 'Resumo de Produtos',
  new: 'Novo',
};

/**
 * Gera breadcrumbs baseado na rota atual
 */
export function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  // Remove query params e hash
  const cleanPath = pathname.split('?')[0].split('#')[0];
  
  // Sempre começa com Dashboard
  const items: BreadcrumbItem[] = [
    { label: 'Dashboard', href: '/dashboard' },
  ];

  // Dashboard → Início: breadcrumb "Dashboard > Início"
  if (cleanPath === '/dashboard' || cleanPath === '/') {
    items.push({ label: 'Início' });
    return items;
  }

  // Divide o path em segmentos
  const segments = cleanPath.split('/').filter(Boolean);

  // Remove 'dashboard' se for o primeiro segmento
  const filteredSegments = segments.filter((seg) => seg !== 'dashboard');

  // Constrói breadcrumbs incrementalmente
  let currentPath = '/dashboard';
  
  filteredSegments.forEach((segment, index) => {
    const isLast = index === filteredSegments.length - 1;
    const label = routeLabels[segment] || formatSegmentLabel(segment);
    
    // Se não for o último, adiciona href
    if (!isLast) {
      currentPath += `/${segment}`;
      items.push({
        label,
        href: currentPath,
      });
    } else {
      // Último item não tem href (página atual)
      items.push({
        label,
      });
    }
  });

  return items;
}

/**
 * Formata um segmento de rota para label legível
 */
function formatSegmentLabel(segment: string): string {
  // Se for um ID (UUID ou número), tenta inferir do contexto
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
    return 'Detalhes';
  }
  
  if (/^\d+$/.test(segment)) {
    return 'Detalhes';
  }

  // Capitaliza e substitui hífens por espaços
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
