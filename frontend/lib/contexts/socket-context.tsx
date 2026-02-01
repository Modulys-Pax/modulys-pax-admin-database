'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../auth/auth-context';
import { chatApi, UserStatus } from '../api/chat';

// Tipos de eventos
interface NewMessageEvent {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  type: string;
  content?: string;
  attachments: Array<{
    id: string;
    fileName: string;
    filePath: string;
    fileSize?: number;
    mimeType?: string;
  }>;
  createdAt: string;
}

interface MessageNotificationEvent {
  conversationId: string;
  message: {
    id: string;
    senderId: string;
    senderName: string;
    content?: string;
    type: string;
    createdAt: string;
  };
}

interface ConversationNewEvent {
  id: string;
  name?: string;
  isGroup: boolean;
  createdAt: string;
}

interface UnreadUpdateEvent {
  count: number;
}

interface ConversationReadEvent {
  conversationId: string;
  userId: string;
  readAt: string;
}

interface UserStatusEvent {
  userId: string;
  status: UserStatus;
  userName?: string;
  timestamp: string;
}

// Tipo do contexto
interface SocketContextType {
  isConnected: boolean;
  unreadCount: number;
  userStatuses: Record<string, UserStatus>;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  markAsRead: (conversationId: string) => void;
  clearUnreadCount: () => void;
  refreshUnreadCount: () => Promise<void>;
  reportActivity: () => void;
  setUserAway: () => void;
  setUserOnline: () => void;
  getUserStatus: (userId: string) => UserStatus;
  onNewMessage: (callback: (message: NewMessageEvent) => void) => () => void;
  onMessageNotification: (callback: (notification: MessageNotificationEvent) => void) => () => void;
  onNewConversation: (callback: (conversation: ConversationNewEvent) => void) => () => void;
  onUnreadUpdate: (callback: (data: UnreadUpdateEvent) => void) => () => void;
  onConversationRead: (callback: (data: ConversationReadEvent) => void) => () => void;
  onUserStatusChange: (callback: (data: UserStatusEvent) => void) => () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const pathname = usePathname();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userStatuses, setUserStatuses] = useState<Record<string, UserStatus>>({});
  const socketRef = useRef<Socket | null>(null);
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Conectar ao WebSocket quando autenticado
  useEffect(() => {
    if (!user || !token) {
      // Desconectar se não autenticado
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Se já tem socket conectado, não reconectar
    if (socketRef.current?.connected) {
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const socketUrl = apiUrl.replace('/api', '');

    const newSocket = io(`${socketUrl}/chat`, {
      auth: {
        token,
      },
      query: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Conectado ao servidor de chat');
      setIsConnected(true);
      
      // Buscar contagem inicial de mensagens não lidas
      chatApi.getUnreadCount()
        .then((data) => setUnreadCount(data.count))
        .catch(() => {});

      // Buscar status inicial dos usuários online
      chatApi.getOnlineUsers()
        .then((users) => {
          const statuses: Record<string, UserStatus> = {};
          users.forEach(u => {
            statuses[u.userId] = u.status;
          });
          setUserStatuses(statuses);
        })
        .catch(() => {});
    });

    // Escutar mudanças de status de usuários
    newSocket.on('user:status', (data: UserStatusEvent) => {
      setUserStatuses(prev => ({
        ...prev,
        [data.userId]: data.status,
      }));
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[Socket] Desconectado:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('[Socket] Erro de conexão:', error.message);
      setIsConnected(false);
    });

    // Atualização de contagem de não lidas
    newSocket.on('unread:update', (data: UnreadUpdateEvent) => {
      setUnreadCount(data.count);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [user, token]);

  // Buscar contagem de não lidas periodicamente se não estiver conectado via WebSocket
  useEffect(() => {
    if (!user || isConnected) return;

    // Busca inicial
    chatApi.getUnreadCount()
      .then((data) => setUnreadCount(data.count))
      .catch(() => {});

    // Polling a cada 30 segundos se não conectado
    const interval = setInterval(() => {
      chatApi.getUnreadCount()
        .then((data) => setUnreadCount(data.count))
        .catch(() => {});
    }, 30000);

    return () => clearInterval(interval);
  }, [user, isConnected]);

  // Entrar em uma conversa
  const joinConversation = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join:conversation', conversationId);
    }
  }, []);

  // Sair de uma conversa
  const leaveConversation = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave:conversation', conversationId);
    }
  }, []);

  // Marcar conversa como lida
  const markAsRead = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('mark:read', conversationId);
    }
  }, []);

  // Reportar atividade do usuário (resetar status "away")
  const reportActivity = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('user:activity');
    }
  }, []);

  // Definir status como ausente
  const setUserAway = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('user:setAway');
    }
  }, []);

  // Definir status como online
  const setUserOnline = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('user:setOnline');
    }
  }, []);

  // Obter status de um usuário
  const getUserStatus = useCallback((userId: string): UserStatus => {
    return userStatuses[userId] || 'offline';
  }, [userStatuses]);

  // Zerar contador de não lidas localmente
  const clearUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  // Atualizar contador de não lidas do servidor
  const refreshUnreadCount = useCallback(async () => {
    try {
      const data = await chatApi.getUnreadCount();
      setUnreadCount(data.count);
    } catch {
      // Ignorar erros
    }
  }, []);

  // Registrar listener para novas mensagens
  const onNewMessage = useCallback((callback: (message: NewMessageEvent) => void) => {
    if (!socketRef.current) return () => {};
    
    socketRef.current.on('message:new', callback);
    return () => {
      socketRef.current?.off('message:new', callback);
    };
  }, [socket]);

  // Registrar listener para notificações de mensagem
  const onMessageNotification = useCallback((callback: (notification: MessageNotificationEvent) => void) => {
    if (!socketRef.current) return () => {};
    
    socketRef.current.on('notification:message', callback);
    return () => {
      socketRef.current?.off('notification:message', callback);
    };
  }, [socket]);

  // Registrar listener para nova conversa
  const onNewConversation = useCallback((callback: (conversation: ConversationNewEvent) => void) => {
    if (!socketRef.current) return () => {};
    
    socketRef.current.on('conversation:new', callback);
    return () => {
      socketRef.current?.off('conversation:new', callback);
    };
  }, [socket]);

  // Registrar listener para atualização de não lidas
  const onUnreadUpdate = useCallback((callback: (data: UnreadUpdateEvent) => void) => {
    if (!socketRef.current) return () => {};
    
    socketRef.current.on('unread:update', callback);
    return () => {
      socketRef.current?.off('unread:update', callback);
    };
  }, [socket]);

  // Registrar listener para conversa lida
  const onConversationRead = useCallback((callback: (data: ConversationReadEvent) => void) => {
    if (!socketRef.current) return () => {};
    
    socketRef.current.on('conversation:read', callback);
    return () => {
      socketRef.current?.off('conversation:read', callback);
    };
  }, [socket]);

  // Registrar listener para mudança de status de usuário
  const onUserStatusChange = useCallback((callback: (data: UserStatusEvent) => void) => {
    if (!socketRef.current) return () => {};
    
    socketRef.current.on('user:status', callback);
    return () => {
      socketRef.current?.off('user:status', callback);
    };
  }, [socket]);

  // Detectar inatividade do usuário e definir como ausente
  useEffect(() => {
    if (!isConnected) return;

    const INACTIVITY_TIMEOUT = 3 * 60 * 1000; // 3 minutos sem atividade = ausente
    let lastActivityTime = Date.now();
    let isCurrentlyAway = false;

    const resetActivityTimer = () => {
      lastActivityTime = Date.now();
      
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      
      // Se estava ausente, voltar para online
      if (isCurrentlyAway) {
        isCurrentlyAway = false;
        reportActivity();
      }
      
      // Definir timer para marcar como ausente
      activityTimeoutRef.current = setTimeout(() => {
        isCurrentlyAway = true;
        setUserAway();
      }, INACTIVITY_TIMEOUT);
    };

    // Throttle para eventos frequentes (mousemove)
    let throttleTimer: NodeJS.Timeout | null = null;
    const throttledResetActivity = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        throttleTimer = null;
        resetActivityTimer();
      }, 1000); // Máximo 1 vez por segundo
    };

    // Handler para visibilidade da página
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resetActivityTimer();
      }
    };

    // Escutar eventos de interação do usuário
    const immediateEvents = ['mousedown', 'keydown', 'touchstart', 'click'];
    const throttledEvents = ['mousemove', 'scroll'];
    
    immediateEvents.forEach(event => {
      window.addEventListener(event, resetActivityTimer, { passive: true });
    });
    
    throttledEvents.forEach(event => {
      window.addEventListener(event, throttledResetActivity, { passive: true });
    });

    // Visibilidade e foco
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', resetActivityTimer);

    // Iniciar timer
    resetActivityTimer();

    return () => {
      immediateEvents.forEach(event => {
        window.removeEventListener(event, resetActivityTimer);
      });
      throttledEvents.forEach(event => {
        window.removeEventListener(event, throttledResetActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', resetActivityTimer);
      
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
    };
  }, [isConnected, reportActivity, setUserAway]);

  // Detectar navegação entre páginas como atividade
  useEffect(() => {
    if (isConnected && pathname) {
      reportActivity();
    }
  }, [pathname, isConnected, reportActivity]);

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        unreadCount,
        userStatuses,
        joinConversation,
        leaveConversation,
        markAsRead,
        clearUnreadCount,
        refreshUnreadCount,
        reportActivity,
        setUserAway,
        setUserOnline,
        getUserStatus,
        onNewMessage,
        onMessageNotification,
        onNewConversation,
        onUnreadUpdate,
        onConversationRead,
        onUserStatusChange,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
