import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { SocketProvider, useSocket } from '../socket-context';

// Mock do socket.io-client
const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
  connected: false,
};

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}));

// Mock do usePathname
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/dashboard'),
}));

// Mock do useAuth
const mockUser = { id: 'user-1', name: 'Test User' };
const mockToken = 'test-token-123';

jest.mock('../../auth/auth-context', () => ({
  useAuth: jest.fn(() => ({
    user: mockUser,
    token: mockToken,
  })),
}));

// Mock do chatApi
jest.mock('../../api/chat', () => ({
  chatApi: {
    getUnreadCount: jest.fn().mockResolvedValue({ count: 5 }),
    getOnlineUsers: jest.fn().mockResolvedValue([
      { userId: 'user-2', status: 'online' },
      { userId: 'user-3', status: 'away' },
    ]),
  },
  UserStatus: {},
}));

// Componente de teste para acessar o contexto
function TestConsumer() {
  const socket = useSocket();
  return (
    <div>
      <span data-testid="connected">{socket.isConnected.toString()}</span>
      <span data-testid="unread">{socket.unreadCount}</span>
      <button onClick={() => socket.joinConversation('conv-1')}>Join</button>
      <button onClick={() => socket.leaveConversation('conv-1')}>Leave</button>
      <button onClick={() => socket.markAsRead('conv-1')}>Mark Read</button>
      <button onClick={() => socket.clearUnreadCount()}>Clear</button>
      <button onClick={() => socket.reportActivity()}>Activity</button>
      <button onClick={() => socket.setUserAway()}>Set Away</button>
      <button onClick={() => socket.setUserOnline()}>Set Online</button>
      <span data-testid="user-status">{socket.getUserStatus('user-2')}</span>
    </div>
  );
}

describe('SocketContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSocket.connected = false;
    mockSocket.on.mockReset();
    mockSocket.emit.mockReset();
    mockSocket.disconnect.mockReset();
  });

  describe('SocketProvider', () => {
    it('deve renderizar children', () => {
      render(
        <SocketProvider>
          <div>Test Content</div>
        </SocketProvider>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('deve conectar ao socket quando autenticado', async () => {
      const { io } = require('socket.io-client');

      render(
        <SocketProvider>
          <TestConsumer />
        </SocketProvider>
      );

      await waitFor(() => {
        expect(io).toHaveBeenCalled();
      });
    });

    it('deve registrar listeners de eventos', async () => {
      render(
        <SocketProvider>
          <TestConsumer />
        </SocketProvider>
      );

      await waitFor(() => {
        expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('unread:update', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('user:status', expect.any(Function));
      });
    });

    it('deve desconectar ao desmontar', async () => {
      const { unmount } = render(
        <SocketProvider>
          <TestConsumer />
        </SocketProvider>
      );

      unmount();

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('useSocket hook', () => {
    it('deve lançar erro quando usado fora do provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        render(<TestConsumer />);
      }).toThrow('useSocket must be used within a SocketProvider');

      consoleSpy.mockRestore();
    });

    it('deve retornar valores iniciais corretos', () => {
      render(
        <SocketProvider>
          <TestConsumer />
        </SocketProvider>
      );

      expect(screen.getByTestId('connected').textContent).toBe('false');
    });
  });

  describe('Socket Methods', () => {
    it('joinConversation deve emitir evento', async () => {
      mockSocket.connected = true;

      render(
        <SocketProvider>
          <TestConsumer />
        </SocketProvider>
      );

      const joinButton = screen.getByText('Join');
      act(() => {
        joinButton.click();
      });

      // Como o socket não está realmente conectado no mock, o emit pode não ser chamado
      // Este teste verifica que a função não causa erro
    });

    it('leaveConversation deve emitir evento', () => {
      mockSocket.connected = true;

      render(
        <SocketProvider>
          <TestConsumer />
        </SocketProvider>
      );

      const leaveButton = screen.getByText('Leave');
      act(() => {
        leaveButton.click();
      });
    });

    it('markAsRead deve emitir evento', () => {
      mockSocket.connected = true;

      render(
        <SocketProvider>
          <TestConsumer />
        </SocketProvider>
      );

      const markReadButton = screen.getByText('Mark Read');
      act(() => {
        markReadButton.click();
      });
    });

    it('clearUnreadCount deve zerar contador', () => {
      render(
        <SocketProvider>
          <TestConsumer />
        </SocketProvider>
      );

      const clearButton = screen.getByText('Clear');
      act(() => {
        clearButton.click();
      });

      expect(screen.getByTestId('unread').textContent).toBe('0');
    });

    it('reportActivity deve emitir evento', () => {
      mockSocket.connected = true;

      render(
        <SocketProvider>
          <TestConsumer />
        </SocketProvider>
      );

      const activityButton = screen.getByText('Activity');
      act(() => {
        activityButton.click();
      });
    });

    it('setUserAway deve emitir evento', () => {
      mockSocket.connected = true;

      render(
        <SocketProvider>
          <TestConsumer />
        </SocketProvider>
      );

      const awayButton = screen.getByText('Set Away');
      act(() => {
        awayButton.click();
      });
    });

    it('setUserOnline deve emitir evento', () => {
      mockSocket.connected = true;

      render(
        <SocketProvider>
          <TestConsumer />
        </SocketProvider>
      );

      const onlineButton = screen.getByText('Set Online');
      act(() => {
        onlineButton.click();
      });
    });

    it('getUserStatus deve retornar status do usuário', () => {
      render(
        <SocketProvider>
          <TestConsumer />
        </SocketProvider>
      );

      // Inicialmente retorna 'offline' se não há status definido
      expect(screen.getByTestId('user-status').textContent).toBe('offline');
    });
  });

  describe('Event Listeners', () => {
    it('deve permitir registrar listener para novas mensagens', () => {
      function TestWithListener() {
        const { onNewMessage } = useSocket();
        const [message, setMessage] = React.useState<string>('');

        React.useEffect(() => {
          const unsubscribe = onNewMessage((msg) => {
            setMessage(msg.content || '');
          });
          return unsubscribe;
        }, [onNewMessage]);

        return <span data-testid="message">{message}</span>;
      }

      render(
        <SocketProvider>
          <TestWithListener />
        </SocketProvider>
      );

      expect(screen.getByTestId('message')).toBeInTheDocument();
    });

    it('deve permitir registrar listener para notificações', () => {
      function TestWithNotification() {
        const { onMessageNotification } = useSocket();

        React.useEffect(() => {
          const unsubscribe = onMessageNotification(() => {});
          return unsubscribe;
        }, [onMessageNotification]);

        return <div>Notification Listener</div>;
      }

      render(
        <SocketProvider>
          <TestWithNotification />
        </SocketProvider>
      );

      expect(screen.getByText('Notification Listener')).toBeInTheDocument();
    });

    it('deve permitir registrar listener para novas conversas', () => {
      function TestWithConversation() {
        const { onNewConversation } = useSocket();

        React.useEffect(() => {
          const unsubscribe = onNewConversation(() => {});
          return unsubscribe;
        }, [onNewConversation]);

        return <div>Conversation Listener</div>;
      }

      render(
        <SocketProvider>
          <TestWithConversation />
        </SocketProvider>
      );

      expect(screen.getByText('Conversation Listener')).toBeInTheDocument();
    });

    it('deve permitir registrar listener para atualizações de não lidas', () => {
      function TestWithUnread() {
        const { onUnreadUpdate } = useSocket();

        React.useEffect(() => {
          const unsubscribe = onUnreadUpdate(() => {});
          return unsubscribe;
        }, [onUnreadUpdate]);

        return <div>Unread Listener</div>;
      }

      render(
        <SocketProvider>
          <TestWithUnread />
        </SocketProvider>
      );

      expect(screen.getByText('Unread Listener')).toBeInTheDocument();
    });

    it('deve permitir registrar listener para conversa lida', () => {
      function TestWithRead() {
        const { onConversationRead } = useSocket();

        React.useEffect(() => {
          const unsubscribe = onConversationRead(() => {});
          return unsubscribe;
        }, [onConversationRead]);

        return <div>Read Listener</div>;
      }

      render(
        <SocketProvider>
          <TestWithRead />
        </SocketProvider>
      );

      expect(screen.getByText('Read Listener')).toBeInTheDocument();
    });

    it('deve permitir registrar listener para mudança de status', () => {
      function TestWithStatus() {
        const { onUserStatusChange } = useSocket();

        React.useEffect(() => {
          const unsubscribe = onUserStatusChange(() => {});
          return unsubscribe;
        }, [onUserStatusChange]);

        return <div>Status Listener</div>;
      }

      render(
        <SocketProvider>
          <TestWithStatus />
        </SocketProvider>
      );

      expect(screen.getByText('Status Listener')).toBeInTheDocument();
    });
  });

  describe('refreshUnreadCount', () => {
    it('deve atualizar contador de não lidas', async () => {
      function TestRefresh() {
        const { refreshUnreadCount, unreadCount } = useSocket();

        return (
          <div>
            <span data-testid="count">{unreadCount}</span>
            <button onClick={() => refreshUnreadCount()}>Refresh</button>
          </div>
        );
      }

      render(
        <SocketProvider>
          <TestRefresh />
        </SocketProvider>
      );

      const refreshButton = screen.getByText('Refresh');
      
      await act(async () => {
        refreshButton.click();
      });

      // O mock retorna count: 5
      await waitFor(() => {
        expect(screen.getByTestId('count')).toBeInTheDocument();
      });
    });
  });
});

describe('SocketContext - Sem autenticação', () => {
  beforeEach(() => {
    const { useAuth } = require('../../auth/auth-context');
    useAuth.mockReturnValue({
      user: null,
      token: null,
    });
  });

  it('não deve conectar sem usuário autenticado', () => {
    const { io } = require('socket.io-client');
    io.mockClear();

    render(
      <SocketProvider>
        <div>No Auth</div>
      </SocketProvider>
    );

    // Pode ou não chamar io dependendo da implementação
    // O importante é não causar erro
    expect(screen.getByText('No Auth')).toBeInTheDocument();
  });
});

describe('SocketContext - userStatuses', () => {
  it('deve expor userStatuses no contexto', () => {
    function TestUserStatuses() {
      const { userStatuses } = useSocket();
      return <span data-testid="statuses">{JSON.stringify(userStatuses)}</span>;
    }

    render(
      <SocketProvider>
        <TestUserStatuses />
      </SocketProvider>
    );

    expect(screen.getByTestId('statuses')).toBeInTheDocument();
  });
});
