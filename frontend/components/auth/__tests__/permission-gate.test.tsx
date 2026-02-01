import { render, screen } from '@testing-library/react';
import { PermissionGate, Can } from '../permission-gate';

// Mock do contexto de permissões
const mockPermissions = {
  hasPermission: jest.fn(),
  hasAllPermissions: jest.fn(),
  hasAnyPermission: jest.fn(),
  canAccessModule: jest.fn(),
  permissions: [],
  isAdmin: false,
};

jest.mock('@/lib/contexts/permission-context', () => ({
  usePermissions: () => mockPermissions,
}));

describe('PermissionGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPermissions.hasPermission.mockReturnValue(true);
    mockPermissions.hasAllPermissions.mockReturnValue(true);
    mockPermissions.hasAnyPermission.mockReturnValue(true);
    mockPermissions.canAccessModule.mockReturnValue(true);
  });

  describe('permissão única', () => {
    it('deve renderizar children quando tem permissão', () => {
      mockPermissions.hasPermission.mockReturnValue(true);
      
      render(
        <PermissionGate permission="vehicles.create">
          <button>Novo Veículo</button>
        </PermissionGate>
      );
      
      expect(screen.getByRole('button', { name: 'Novo Veículo' })).toBeInTheDocument();
      expect(mockPermissions.hasPermission).toHaveBeenCalledWith('vehicles.create');
    });

    it('não deve renderizar children quando não tem permissão', () => {
      mockPermissions.hasPermission.mockReturnValue(false);
      
      render(
        <PermissionGate permission="vehicles.create">
          <button>Novo Veículo</button>
        </PermissionGate>
      );
      
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('deve renderizar fallback quando não tem permissão', () => {
      mockPermissions.hasPermission.mockReturnValue(false);
      
      render(
        <PermissionGate
          permission="vehicles.create"
          fallback={<span>Sem permissão</span>}
        >
          <button>Novo Veículo</button>
        </PermissionGate>
      );
      
      expect(screen.getByText('Sem permissão')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('múltiplas permissões (todas)', () => {
    it('deve renderizar quando tem todas as permissões', () => {
      mockPermissions.hasAllPermissions.mockReturnValue(true);
      
      render(
        <PermissionGate permissions={['vehicles.view', 'vehicles.update']}>
          <button>Editar</button>
        </PermissionGate>
      );
      
      expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
      expect(mockPermissions.hasAllPermissions).toHaveBeenCalledWith(['vehicles.view', 'vehicles.update']);
    });

    it('não deve renderizar quando falta alguma permissão', () => {
      mockPermissions.hasAllPermissions.mockReturnValue(false);
      
      render(
        <PermissionGate permissions={['vehicles.view', 'vehicles.update']}>
          <button>Editar</button>
        </PermissionGate>
      );
      
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('pelo menos uma permissão', () => {
    it('deve renderizar quando tem pelo menos uma permissão', () => {
      mockPermissions.hasAnyPermission.mockReturnValue(true);
      
      render(
        <PermissionGate anyPermission={['vehicles.delete', 'vehicles.update']}>
          <button>Menu de Ações</button>
        </PermissionGate>
      );
      
      expect(screen.getByRole('button', { name: 'Menu de Ações' })).toBeInTheDocument();
      expect(mockPermissions.hasAnyPermission).toHaveBeenCalledWith(['vehicles.delete', 'vehicles.update']);
    });

    it('não deve renderizar quando não tem nenhuma permissão', () => {
      mockPermissions.hasAnyPermission.mockReturnValue(false);
      
      render(
        <PermissionGate anyPermission={['vehicles.delete', 'vehicles.update']}>
          <button>Menu de Ações</button>
        </PermissionGate>
      );
      
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('acesso ao módulo', () => {
    it('deve renderizar quando pode acessar módulo', () => {
      mockPermissions.canAccessModule.mockReturnValue(true);
      
      render(
        <PermissionGate module="vehicles">
          <div>Seção de Veículos</div>
        </PermissionGate>
      );
      
      expect(screen.getByText('Seção de Veículos')).toBeInTheDocument();
      expect(mockPermissions.canAccessModule).toHaveBeenCalledWith('vehicles');
    });

    it('não deve renderizar quando não pode acessar módulo', () => {
      mockPermissions.canAccessModule.mockReturnValue(false);
      
      render(
        <PermissionGate module="vehicles">
          <div>Seção de Veículos</div>
        </PermissionGate>
      );
      
      expect(screen.queryByText('Seção de Veículos')).not.toBeInTheDocument();
    });
  });

  describe('combinação de verificações', () => {
    it('deve verificar todas as condições', () => {
      mockPermissions.hasPermission.mockReturnValue(true);
      mockPermissions.hasAllPermissions.mockReturnValue(true);
      mockPermissions.canAccessModule.mockReturnValue(true);
      
      render(
        <PermissionGate
          permission="vehicles.view"
          permissions={['vehicles.update']}
          module="vehicles"
        >
          <button>Ação Complexa</button>
        </PermissionGate>
      );
      
      expect(screen.getByRole('button', { name: 'Ação Complexa' })).toBeInTheDocument();
    });

    it('deve falhar se qualquer condição falhar', () => {
      mockPermissions.hasPermission.mockReturnValue(true);
      mockPermissions.hasAllPermissions.mockReturnValue(false); // Esta falha
      mockPermissions.canAccessModule.mockReturnValue(true);
      
      render(
        <PermissionGate
          permission="vehicles.view"
          permissions={['vehicles.update']}
          module="vehicles"
        >
          <button>Ação Complexa</button>
        </PermissionGate>
      );
      
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('sem verificação', () => {
    it('deve renderizar children quando nenhuma verificação é fornecida', () => {
      render(
        <PermissionGate>
          <button>Sempre Visível</button>
        </PermissionGate>
      );
      
      expect(screen.getByRole('button', { name: 'Sempre Visível' })).toBeInTheDocument();
    });
  });

  describe('alias Can', () => {
    it('deve funcionar igual a PermissionGate', () => {
      mockPermissions.hasPermission.mockReturnValue(true);
      
      render(
        <Can permission="vehicles.view">
          <button>Via Can</button>
        </Can>
      );
      
      expect(screen.getByRole('button', { name: 'Via Can' })).toBeInTheDocument();
    });
  });
});
