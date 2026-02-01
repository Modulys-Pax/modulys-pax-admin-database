import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userName?: string;
}

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockJwtService = {
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret'),
  };

  const mockServer = {
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    // Injetar server mockado
    gateway.server = mockServer as unknown as Server;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockSocket = (overrides = {}): AuthenticatedSocket =>
    ({
      id: 'socket-123',
      handshake: {
        auth: { token: 'valid-token' },
        headers: {},
        query: {},
      },
      disconnect: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      ...overrides,
    }) as unknown as AuthenticatedSocket;

  describe('handleConnection', () => {
    it('deve autenticar usuário com token válido', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-123',
        name: 'João Silva',
      });

      const socket = createMockSocket();

      await gateway.handleConnection(socket);

      expect(socket.userId).toBe('user-123');
      expect(socket.userName).toBe('João Silva');
      expect(socket.join).toHaveBeenCalledWith('user:user-123');
    });

    it('deve desconectar socket sem token', async () => {
      const socket = createMockSocket({
        handshake: {
          auth: {},
          headers: {},
          query: {},
        },
      });

      await gateway.handleConnection(socket);

      expect(socket.disconnect).toHaveBeenCalled();
    });

    it('deve extrair token do header Authorization', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-123',
        name: 'João',
      });

      const socket = createMockSocket({
        handshake: {
          auth: {},
          headers: { authorization: 'Bearer header-token' },
          query: {},
        },
      });

      await gateway.handleConnection(socket);

      expect(mockJwtService.verify).toHaveBeenCalledWith('header-token', {
        secret: 'test-secret',
      });
    });

    it('deve extrair token da query string', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-123',
        name: 'João',
      });

      const socket = createMockSocket({
        handshake: {
          auth: {},
          headers: {},
          query: { token: 'query-token' },
        },
      });

      await gateway.handleConnection(socket);

      expect(mockJwtService.verify).toHaveBeenCalledWith('query-token', {
        secret: 'test-secret',
      });
    });

    it('deve desconectar se verificação JWT falhar', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const socket = createMockSocket();

      await gateway.handleConnection(socket);

      expect(socket.disconnect).toHaveBeenCalled();
    });

    it('deve broadcast status online quando usuário conecta', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-new',
        name: 'Novo Usuário',
      });

      const socket = createMockSocket();

      await gateway.handleConnection(socket);

      expect(mockServer.emit).toHaveBeenCalledWith('user:status', {
        userId: 'user-new',
        status: 'online',
        userName: 'Novo Usuário',
        timestamp: expect.any(Date),
      });
    });
  });

  describe('handleDisconnect', () => {
    it('deve remover socket do mapa de usuários', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-123',
        name: 'João',
      });

      const socket = createMockSocket();
      await gateway.handleConnection(socket);

      expect(gateway.isUserOnline('user-123')).toBe(true);

      gateway.handleDisconnect(socket);

      expect(gateway.isUserOnline('user-123')).toBe(false);
    });

    it('deve broadcast status offline quando último socket desconecta', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-123',
        name: 'João',
      });

      const socket = createMockSocket();
      await gateway.handleConnection(socket);

      jest.clearAllMocks();
      gateway.handleDisconnect(socket);

      expect(mockServer.emit).toHaveBeenCalledWith('user:status', {
        userId: 'user-123',
        status: 'offline',
        userName: 'João',
        timestamp: expect.any(Date),
      });
    });

    it('não deve fazer nada se socket não tem userId', () => {
      const socket = createMockSocket();
      // Sem userId

      gateway.handleDisconnect(socket);

      expect(mockServer.emit).not.toHaveBeenCalled();
    });
  });

  describe('handleJoinConversation', () => {
    it('deve fazer join no room da conversa', () => {
      const socket = createMockSocket({ userId: 'user-123' });

      const result = gateway.handleJoinConversation(socket, 'conv-456');

      expect(socket.join).toHaveBeenCalledWith('conversation:conv-456');
      expect(result).toEqual({ event: 'joined', data: { conversationId: 'conv-456' } });
    });

    it('deve retornar undefined se socket não tem userId', () => {
      const socket = createMockSocket();

      const result = gateway.handleJoinConversation(socket, 'conv-456');

      expect(result).toBeUndefined();
    });
  });

  describe('handleLeaveConversation', () => {
    it('deve fazer leave do room da conversa', () => {
      const socket = createMockSocket({ userId: 'user-123' });

      const result = gateway.handleLeaveConversation(socket, 'conv-456');

      expect(socket.leave).toHaveBeenCalledWith('conversation:conv-456');
      expect(result).toEqual({ event: 'left', data: { conversationId: 'conv-456' } });
    });

    it('deve retornar undefined se socket não tem userId', () => {
      const socket = createMockSocket();

      const result = gateway.handleLeaveConversation(socket, 'conv-456');

      expect(result).toBeUndefined();
    });
  });

  describe('handleMarkAsRead', () => {
    it('deve notificar outros participantes', () => {
      const mockSocketTo = jest.fn().mockReturnValue({
        emit: jest.fn(),
      });
      const socket = createMockSocket({ userId: 'user-123', to: mockSocketTo });

      const result = gateway.handleMarkAsRead(socket, 'conv-456');

      expect(mockSocketTo).toHaveBeenCalledWith('conversation:conv-456');
      expect(result).toEqual({ event: 'marked', data: { conversationId: 'conv-456' } });
    });
  });

  describe('handleUserActivity', () => {
    it('deve atualizar lastActivity', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-123',
        name: 'João',
      });

      const socket = createMockSocket();
      await gateway.handleConnection(socket);

      const result = gateway.handleUserActivity(socket);

      expect(result).toEqual({ event: 'activity:ack' });
    });

    it('deve mudar status de away para online', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-123',
        name: 'João',
      });

      const socket = createMockSocket();
      await gateway.handleConnection(socket);

      // Setar como away
      gateway.handleSetAway(socket);
      expect(gateway.getUserStatus('user-123')).toBe('away');

      jest.clearAllMocks();
      gateway.handleUserActivity(socket);

      expect(gateway.getUserStatus('user-123')).toBe('online');
    });
  });

  describe('handleSetAway', () => {
    it('deve mudar status para away', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-123',
        name: 'João',
      });

      const socket = createMockSocket();
      await gateway.handleConnection(socket);

      const result = gateway.handleSetAway(socket);

      expect(result).toEqual({ event: 'status:updated', data: { status: 'away' } });
      expect(gateway.getUserStatus('user-123')).toBe('away');
    });
  });

  describe('handleSetOnline', () => {
    it('deve mudar status para online', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-123',
        name: 'João',
      });

      const socket = createMockSocket();
      await gateway.handleConnection(socket);
      gateway.handleSetAway(socket);

      const result = gateway.handleSetOnline(socket);

      expect(result).toEqual({ event: 'status:updated', data: { status: 'online' } });
      expect(gateway.getUserStatus('user-123')).toBe('online');
    });
  });

  describe('handleGetUsersStatus', () => {
    it('deve retornar status de múltiplos usuários', async () => {
      mockJwtService.verify.mockReturnValueOnce({ sub: 'user-1', name: 'User 1' });
      mockJwtService.verify.mockReturnValueOnce({ sub: 'user-2', name: 'User 2' });

      const socket1 = createMockSocket({ id: 'socket-1' });
      const socket2 = createMockSocket({ id: 'socket-2' });

      await gateway.handleConnection(socket1);
      await gateway.handleConnection(socket2);

      const result = gateway.handleGetUsersStatus(socket1, ['user-1', 'user-2', 'user-3']);

      expect(result).toEqual({
        event: 'users:status',
        data: {
          'user-1': 'online',
          'user-2': 'online',
          'user-3': 'offline',
        },
      });
    });
  });

  describe('isUserOnline', () => {
    it('deve retornar false para usuário não conectado', () => {
      expect(gateway.isUserOnline('user-999')).toBe(false);
    });

    it('deve retornar true para usuário conectado', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-123',
        name: 'João',
      });

      const socket = createMockSocket();
      await gateway.handleConnection(socket);

      expect(gateway.isUserOnline('user-123')).toBe(true);
    });
  });

  describe('getUserStatus', () => {
    it('deve retornar offline para usuário não conectado', () => {
      expect(gateway.getUserStatus('user-999')).toBe('offline');
    });
  });

  describe('getUsersStatus', () => {
    it('deve retornar status para lista de usuários', () => {
      const result = gateway.getUsersStatus(['user-1', 'user-2']);

      expect(result).toEqual({
        'user-1': 'offline',
        'user-2': 'offline',
      });
    });
  });

  describe('getAllUsersPresence', () => {
    it('deve retornar array vazio quando não há usuários', () => {
      const result = gateway.getAllUsersPresence();

      expect(result).toEqual([]);
    });

    it('deve retornar usuários conectados com presença', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-123',
        name: 'João',
      });

      const socket = createMockSocket();
      await gateway.handleConnection(socket);

      const result = gateway.getAllUsersPresence();

      expect(result).toEqual([
        {
          userId: 'user-123',
          userName: 'João',
          status: 'online',
        },
      ]);
    });
  });

  describe('emitNewMessage', () => {
    it('deve emitir mensagem para room da conversa e notificar participantes', () => {
      const message = {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'user-1',
        senderName: 'João',
        type: 'text',
        content: 'Olá',
        attachments: [],
        createdAt: new Date(),
      };

      gateway.emitNewMessage('conv-1', message, ['user-1', 'user-2', 'user-3']);

      expect(mockServer.to).toHaveBeenCalledWith('conversation:conv-1');
      expect(mockServer.to).toHaveBeenCalledWith('user:user-2');
      expect(mockServer.to).toHaveBeenCalledWith('user:user-3');
    });

    it('não deve notificar o remetente', () => {
      const message = {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'user-1',
        senderName: 'João',
        type: 'text',
        content: 'Olá',
        attachments: [],
        createdAt: new Date(),
      };

      gateway.emitNewMessage('conv-1', message, ['user-1']);

      // Não deve chamar to com user:user-1 para notificação
      expect(mockServer.to).not.toHaveBeenCalledWith('user:user-1');
    });
  });

  describe('emitConversationUpdate', () => {
    it('deve emitir nova conversa para todos os participantes', () => {
      const conversation = {
        id: 'conv-1',
        name: 'Grupo',
        isGroup: true,
        createdAt: new Date(),
      };

      gateway.emitConversationUpdate(['user-1', 'user-2'], conversation);

      expect(mockServer.to).toHaveBeenCalledWith('user:user-1');
      expect(mockServer.to).toHaveBeenCalledWith('user:user-2');
    });
  });

  describe('emitUnreadCount', () => {
    it('deve emitir contagem de não lidas para usuário', () => {
      gateway.emitUnreadCount('user-123', 5);

      expect(mockServer.to).toHaveBeenCalledWith('user:user-123');
    });
  });
});
