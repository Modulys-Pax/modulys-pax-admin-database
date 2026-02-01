import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { FileProcessingService } from '../../shared/services/file-processing.service';

// Mock uuid module
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

describe('ChatController', () => {
  let controller: ChatController;
  let chatService: ChatService;
  let chatGateway: ChatGateway;

  const mockChatService = {
    getConversations: jest.fn(),
    getConversation: jest.fn(),
    createConversation: jest.fn(),
    getMessages: jest.fn(),
    sendMessage: jest.fn(),
    sendMessageWithAttachment: jest.fn(),
    markAsRead: jest.fn(),
    getAvailableUsers: jest.fn(),
    getUnreadCount: jest.fn(),
  };

  const mockChatGateway = {
    getUsersStatus: jest.fn(),
    getAllUsersPresence: jest.fn(),
  };

  const mockFileProcessingService = {
    processFile: jest.fn(),
  };

  const mockReq = {
    user: { sub: 'user-1', email: 'test@test.com', name: 'Test', role: 'USER' },
  } as any;

  const mockConversation = { id: 'conv-1', participants: [] };
  const mockMessage = { id: 'msg-1', content: 'Hello' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        { provide: ChatService, useValue: mockChatService },
        { provide: ChatGateway, useValue: mockChatGateway },
        { provide: FileProcessingService, useValue: mockFileProcessingService },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
    chatService = module.get<ChatService>(ChatService);
    chatGateway = module.get<ChatGateway>(ChatGateway);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getConversations', () => {
    it('deve retornar lista de conversas', async () => {
      const response = { conversations: [mockConversation] };
      mockChatService.getConversations.mockResolvedValue(response);

      const result = await controller.getConversations(mockReq);

      expect(result).toEqual(response);
    });
  });

  describe('getConversation', () => {
    it('deve retornar uma conversa', async () => {
      mockChatService.getConversation.mockResolvedValue(mockConversation);

      const result = await controller.getConversation('conv-1', mockReq);

      expect(result).toEqual(mockConversation);
    });
  });

  describe('createConversation', () => {
    it('deve criar uma conversa', async () => {
      const createDto = { participantIds: ['user-2'] };
      mockChatService.createConversation.mockResolvedValue(mockConversation);

      const result = await controller.createConversation(createDto, mockReq);

      expect(result).toEqual(mockConversation);
    });
  });

  describe('getMessages', () => {
    it('deve retornar mensagens', async () => {
      const response = { messages: [mockMessage], total: 1 };
      mockChatService.getMessages.mockResolvedValue(response);

      const result = await controller.getMessages('conv-1', mockReq);

      expect(result).toEqual(response);
    });
  });

  describe('sendMessage', () => {
    it('deve enviar uma mensagem', async () => {
      const createDto = { conversationId: 'conv-1', content: 'Hello' };
      mockChatService.sendMessage.mockResolvedValue(mockMessage);

      const result = await controller.sendMessage(createDto, mockReq);

      expect(result).toEqual(mockMessage);
    });
  });

  describe('markAsRead', () => {
    it('deve marcar conversa como lida', async () => {
      mockChatService.markAsRead.mockResolvedValue(undefined);

      const result = await controller.markAsRead('conv-1', mockReq);

      expect(result).toEqual({ success: true });
    });
  });

  describe('getAvailableUsers', () => {
    it('deve retornar usuários disponíveis com status', async () => {
      const users = [{ id: 'user-2', name: 'User 2', email: 'user2@test.com' }];
      mockChatService.getAvailableUsers.mockResolvedValue(users);
      mockChatGateway.getUsersStatus.mockReturnValue({ 'user-2': 'online' });

      const result = await controller.getAvailableUsers(mockReq);

      expect(result[0].status).toBe('online');
    });
  });

  describe('getUsersStatus', () => {
    it('deve retornar status dos usuários', async () => {
      mockChatGateway.getUsersStatus.mockReturnValue({ 'user-1': 'online', 'user-2': 'offline' });

      const result = await controller.getUsersStatus('user-1,user-2');

      expect(result['user-1']).toBe('online');
    });
  });

  describe('getOnlineUsers', () => {
    it('deve retornar usuários online', async () => {
      const onlineUsers = [{ userId: 'user-1', status: 'online' }];
      mockChatGateway.getAllUsersPresence.mockReturnValue(onlineUsers);

      const result = await controller.getOnlineUsers();

      expect(result).toEqual(onlineUsers);
    });
  });

  describe('getUnreadCount', () => {
    it('deve retornar contagem de não lidas', async () => {
      mockChatService.getUnreadCount.mockResolvedValue(5);

      const result = await controller.getUnreadCount(mockReq);

      expect(result).toEqual({ count: 5 });
    });
  });
});
