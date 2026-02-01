import { chatApi, Conversation, Message, CreateConversationDto, AvailableUser } from '../chat';
import api from '../../axios';

jest.mock('../../axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('chatApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockConversation: Conversation = {
    id: 'conv-123',
    isGroup: false,
    participants: [
      { id: 'p-1', userId: 'user-1', userName: 'João', joinedAt: '2024-01-01', status: 'online' },
      { id: 'p-2', userId: 'user-2', userName: 'Maria', joinedAt: '2024-01-01', status: 'offline' },
    ],
    unreadCount: 2,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15',
  };

  const mockMessage: Message = {
    id: 'msg-123',
    conversationId: 'conv-123',
    senderId: 'user-1',
    senderName: 'João',
    type: 'TEXT',
    content: 'Olá!',
    attachments: [],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  };

  describe('getConversations', () => {
    it('deve buscar todas as conversas', async () => {
      const mockResponse = { data: [mockConversation], total: 1 };
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const result = await chatApi.getConversations();

      expect(mockApi.get).toHaveBeenCalledWith('/chat/conversations?');
      expect(result).toEqual(mockResponse);
    });

    it('deve buscar conversas com filtro de busca', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: { data: [], total: 0 } });

      await chatApi.getConversations('João');

      expect(mockApi.get).toHaveBeenCalledWith('/chat/conversations?search=Jo%C3%A3o');
    });
  });

  describe('getConversation', () => {
    it('deve buscar conversa por ID', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockConversation });

      const result = await chatApi.getConversation('conv-123');

      expect(mockApi.get).toHaveBeenCalledWith('/chat/conversations/conv-123');
      expect(result).toEqual(mockConversation);
    });
  });

  describe('createConversation', () => {
    it('deve criar nova conversa', async () => {
      const dto: CreateConversationDto = { participantIds: ['user-2'] };
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockConversation });

      const result = await chatApi.createConversation(dto);

      expect(mockApi.post).toHaveBeenCalledWith('/chat/conversations', dto);
      expect(result).toEqual(mockConversation);
    });

    it('deve criar conversa em grupo', async () => {
      const dto: CreateConversationDto = { name: 'Grupo Trabalho', participantIds: ['user-2', 'user-3'] };
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: { ...mockConversation, isGroup: true } });

      await chatApi.createConversation(dto);

      expect(mockApi.post).toHaveBeenCalledWith('/chat/conversations', dto);
    });
  });

  describe('getMessages', () => {
    it('deve buscar mensagens de uma conversa', async () => {
      const mockResponse = { data: [mockMessage], total: 1, hasMore: false };
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const result = await chatApi.getMessages('conv-123');

      expect(mockApi.get).toHaveBeenCalledWith('/chat/conversations/conv-123/messages?page=1&limit=50');
      expect(result).toEqual(mockResponse);
    });

    it('deve aceitar paginação', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: { data: [], total: 0, hasMore: false } });

      await chatApi.getMessages('conv-123', 2, 20);

      expect(mockApi.get).toHaveBeenCalledWith('/chat/conversations/conv-123/messages?page=2&limit=20');
    });
  });

  describe('sendMessage', () => {
    it('deve enviar mensagem de texto', async () => {
      const dto = { conversationId: 'conv-123', content: 'Olá!' };
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockMessage });

      const result = await chatApi.sendMessage(dto);

      expect(mockApi.post).toHaveBeenCalledWith('/chat/messages', dto);
      expect(result).toEqual(mockMessage);
    });
  });

  describe('sendMessageWithAttachment', () => {
    it('deve enviar mensagem com arquivo', async () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockMessage });

      await chatApi.sendMessageWithAttachment('conv-123', file, 'Arquivo anexo');

      expect(mockApi.post).toHaveBeenCalledWith(
        '/chat/conversations/conv-123/messages/upload',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
    });
  });

  describe('markAsRead', () => {
    it('deve marcar conversa como lida', async () => {
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: { success: true } });

      const result = await chatApi.markAsRead('conv-123');

      expect(mockApi.post).toHaveBeenCalledWith('/chat/conversations/conv-123/read');
      expect(result.success).toBe(true);
    });
  });

  describe('getAvailableUsers', () => {
    it('deve buscar usuários disponíveis', async () => {
      const mockUsers: AvailableUser[] = [
        { id: 'user-2', name: 'Maria', email: 'maria@test.com', status: 'online' },
      ];
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockUsers });

      const result = await chatApi.getAvailableUsers();

      expect(mockApi.get).toHaveBeenCalledWith('/chat/users?');
      expect(result).toEqual(mockUsers);
    });
  });

  describe('getUnreadCount', () => {
    it('deve buscar contagem de não lidas', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: { count: 5 } });

      const result = await chatApi.getUnreadCount();

      expect(mockApi.get).toHaveBeenCalledWith('/chat/unread-count');
      expect(result.count).toBe(5);
    });
  });

  describe('getUsersStatus', () => {
    it('deve buscar status dos usuários', async () => {
      const mockStatus = { 'user-1': 'online', 'user-2': 'offline' };
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockStatus });

      const result = await chatApi.getUsersStatus(['user-1', 'user-2']);

      expect(mockApi.get).toHaveBeenCalledWith('/chat/users/status?userIds=user-1,user-2');
      expect(result).toEqual(mockStatus);
    });
  });

  describe('getOnlineUsers', () => {
    it('deve buscar usuários online', async () => {
      const mockOnline = [{ userId: 'user-1', userName: 'João', status: 'online' }];
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockOnline });

      const result = await chatApi.getOnlineUsers();

      expect(mockApi.get).toHaveBeenCalledWith('/chat/users/online');
      expect(result).toEqual(mockOnline);
    });
  });
});
