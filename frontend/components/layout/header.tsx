'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { useSocket } from '@/lib/contexts/socket-context';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Menu,
  PanelLeft,
  PanelLeftClose,
  Bell,
  Settings,
  UserCircle,
  LogOut,
  MessageCircle,
} from 'lucide-react';
import { generateBreadcrumbs } from '@/lib/breadcrumb-utils';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick?: () => void;
  /** Desktop: sidebar está aberta? (para ícone do toggle) */
  desktopSidebarOpen?: boolean;
  /** Desktop: toggle abrir/fechar sidebar */
  onDesktopSidebarToggle?: () => void;
}

export function Header({
  onMenuClick,
  desktopSidebarOpen = true,
  onDesktopSidebarToggle,
}: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { unreadCount, clearUnreadCount } = useSocket();
  const breadcrumbs = generateBreadcrumbs(pathname);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  // Ao abrir o dropdown de notificações, marcar como lidas
  const handleNotificationsOpenChange = (open: boolean) => {
    setNotificationsOpen(open);
    if (open && unreadCount > 0) {
      // Não zera imediatamente - espera o usuário clicar para ir ao chat
    }
  };

  // Ao clicar na notificação, ir para o chat e zerar o contador
  const handleNotificationClick = () => {
    clearUnreadCount();
    setNotificationsOpen(false);
    router.push('/chat');
  };

  return (
    <header className="h-16 border-b border-border bg-background sticky top-0 z-30">
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        {/* Left Section: Mobile menu / Desktop sidebar toggle + Breadcrumb */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Mobile: Menu hamburger | Desktop: toggle sidebar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden flex-shrink-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
          {onDesktopSidebarToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDesktopSidebarToggle}
              className="hidden lg:flex flex-shrink-0"
              title={desktopSidebarOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {desktopSidebarOpen ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeft className="h-5 w-5" />
              )}
            </Button>
          )}

          {/* Breadcrumb */}
          <div className="flex-1 min-w-0">
            <Breadcrumb items={breadcrumbs} className="truncate" />
          </div>
        </div>

        {/* Right Section: Global Actions + User Menu */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Global Actions Menu */}
          <DropdownMenu open={notificationsOpen} onOpenChange={handleNotificationsOpenChange}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-[20px] rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {unreadCount > 0 ? (
                <>
                  <DropdownMenuItem
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={handleNotificationClick}
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Mensagens não lidas</p>
                      <p className="text-xs text-muted-foreground">
                        Você tem {unreadCount} {unreadCount === 1 ? 'mensagem não lida' : 'mensagens não lidas'}
                      </p>
                    </div>
                    <Badge variant="destructive" className="flex-shrink-0">
                      {unreadCount}
                    </Badge>
                  </DropdownMenuItem>
                </>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Nenhuma notificação
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 h-auto py-1.5 px-2"
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <UserCircle className="h-5 w-5 text-primary" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-foreground truncate max-w-[120px]">
                    {user?.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                    {user?.role.name}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.role.name}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
