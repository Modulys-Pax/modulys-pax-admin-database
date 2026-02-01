import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ChatGateway } from './chat.gateway';
import { createMockPrismaService, PrismaMock } from '../../shared/testing/prisma.mock';

describe('ChatService', () => {
  let service: ChatService;
  let prisma: PrismaMock;

  const mockUser = {
    id: 'user-123',
    name: 'João Silva',
    email: 'joao@example.com',
    active: true,
    deletedAt: null,
  };

  const mockUser2 = {
    id: 'user-456',
    name: 'Maria Santos',
    email: 'maria@example.com',
    active: true,
    deletedAt: null,
  };

  const mockConversation = {
    id: 'conv-123',
    name: null,
    isGroup: false,
    createdBy: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    participants: [
      {
        id: 'part-123',
        userId: 'user-123',
        conversationId: 'conv-123',
        joinedAt: new Date(),
        lastReadAt: new Date(),
        user: { id: 'user-123', name: 'João Silva' },
      },
      {
        id: 'part-456',
        userId: 'user-456',
        conversationId: 'conv-123',
        joinedAt: new Date(),
        lastReadAt: new Date(),
        user: { id: 'user-456', name: 'Maria Santos' },
      },
    ],
    messages: [],
  };

  const mockMessage = {
    id: 'msg-123',
    conversationId: 'conv-123',
    senderId: 'user-123',
    type: 'TEXT',
    content: 'Olá!',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    sender: { id: 'user-123', name: 'João Silva' },
    attachments: [],
  };

  const mockChatGateway = {
    emitConversationUpdate: jest.fn(),
    emitNewMessage: jest.fn(),
    emitUnreadCount: jest.fn(),
  };

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: ChatGateway,
          useValue: mockChatGateway,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    prisma = module.get(PrismaService) as unknown as PrismaMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getConversations', () => {
    it('deve retornar lista de conversas do usuário', async () => {
      prisma.conversation.findMany.mockResolvedValue([mockConversation]);
      prisma.message.count.mockResolvedValue(0);

      const result = await service.getConversations('user-123');

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('deve retornar lista vazia quando usuário não tem conversas', async () => {
      prisma.conversation.findMany.mockResolvedValue([]);

      const result = await service.getConversations('user-123');

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('deve filtrar por busca', async () => {
      prisma.conversation.findMany.mockResolvedValue([mockConversation]);
      prisma.message.count.mockResolvedValue(0);

      await service.getConversations('user-123', 'Maria');

      expect(prisma.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
    });
  });

  describe('getConversation', () => {
    it('deve retornar conversa específica', async () => {
      prisma.conversation.findUnique.mockResolvedValue(mockConversation);
      prisma.message.count.mockResolvedValue(0);

      const result = await service.getConversation('conv-123', 'user-123');

      expect(result.id).toBe('conv-123');
      expect(result.participants).toHaveLength(2);
    });

    it('deve lançar NotFoundException quando conversa não existe', async () => {
      prisma.conversation.findUnique.mockResolvedValue(null);

      await expect(service.getConversation('invalid-id', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getConversation('invalid-id', 'user-123')).rejects.toThrow(
        'Conversa não encontrada',
      );
    });

    it('deve lançar ForbiddenException quando usuário não é participante', async () => {
      prisma.conversation.findUnique.mockResolvedValue(mockConversation);

      await expect(
        service.getConversation('conv-123', 'user-999'), // Usuário não é participante
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('createConversation', () => {
    const createDto = {
      participantIds: ['user-456'],
    };

    it('deve criar conversa com sucesso', async () => {
      prisma.user.findMany.mockResolvedValue([mockUser, mockUser2]);
      prisma.conversation.findFirst.mockResolvedValue(null); // Não existe conversa
      prisma.conversation.create.mockResolvedValue(mockConversation);
      prisma.message.count.mockResolvedValue(0);

      const result = await service.createConversation(createDto, 'user-123');

      expect(result).toHaveProperty('id');
      expect(result.isGroup).toBe(false);
    });

    it('deve lançar BadRequestException quando participante não existe', async () => {
      prisma.user.findMany.mockResolvedValue([mockUser]); // Só encontra 1 usuário

      await expect(service.createConversation(createDto, 'user-123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createConversation(createDto, 'user-123')).rejects.toThrow(
        /participantes não foram encontrados/,
      );
    });

    it('deve retornar conversa existente entre dois usuários', async () => {
      prisma.user.findMany.mockResolvedValue([mockUser, mockUser2]);
      prisma.conversation.findFirst.mockResolvedValue(mockConversation);
      prisma.conversation.findUnique.mockResolvedValue(mockConversation);
      prisma.message.count.mockResolvedValue(0);

      const result = await service.createConversation(createDto, 'user-123');

      expect(result.id).toBe('conv-123');
    });

    it('deve criar grupo quando há mais de 2 participantes', async () => {
      const groupDto = { participantIds: ['user-456', 'user-789'], name: 'Grupo Teste' };
      const mockUser3 = { ...mockUser, id: 'user-789', name: 'Pedro Costa' };
      const mockGroupConv = { ...mockConversation, isGroup: true, name: 'Grupo Teste' };

      prisma.user.findMany.mockResolvedValue([mockUser, mockUser2, mockUser3]);
      prisma.conversation.findMany.mockResolvedValue([]); // Não existe grupo igual
      prisma.conversation.create.mockResolvedValue(mockGroupConv);

      const result = await service.createConversation(groupDto, 'user-123');

      expect(result.isGroup).toBe(true);
    });
  });

  describe('getMessages', () => {
    it('deve retornar mensagens da conversa', async () => {
      prisma.conversationParticipant.findUnique.mockResolvedValue({
        userId: 'user-123',
        conversationId: 'conv-123',
        lastReadAt: new Date(),
      });
      prisma.message.count.mockResolvedValue(1);
      prisma.message.findMany.mockResolvedValue([mockMessage]);
      prisma.conversationParticipant.update.mockResolvedValue({});

      const result = await service.getMessages('conv-123', 'user-123');

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('deve lançar ForbiddenException quando usuário não é participante', async () => {
      prisma.conversationParticipant.findUnique.mockResolvedValue(null);

      await expect(service.getMessages('conv-123', 'user-999')).rejects.toThrow(ForbiddenException);
    });

    it('deve aplicar paginação', async () => {
      prisma.conversationParticipant.findUnique.mockResolvedValue({
        userId: 'user-123',
        conversationId: 'conv-123',
      });
      prisma.message.count.mockResolvedValue(100);
      prisma.message.findMany.mockResolvedValue([]);
      prisma.conversationParticipant.update.mockResolvedValue({});

      const result = await service.getMessages('conv-123', 'user-123', 2, 50);

      expect(result.hasMore).toBe(false);
      expect(prisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 50,
          take: 50,
        }),
      );
    });
  });

  describe('sendMessage', () => {
    const messageDto = {
      conversationId: 'conv-123',
      content: 'Nova mensagem',
      type: 'TEXT',
    };

    it('deve enviar mensagem com sucesso', async () => {
      prisma.conversationParticipant.findUnique.mockResolvedValue({
        userId: 'user-123',
        conversationId: 'conv-123',
      });
      prisma.message.create.mockResolvedValue(mockMessage);
      prisma.conversation.update.mockResolvedValue({});
      prisma.conversationParticipant.update.mockResolvedValue({});
      prisma.conversationParticipant.findMany.mockResolvedValue([
        { userId: 'user-123' },
        { userId: 'user-456' },
      ]);
      prisma.message.count.mockResolvedValue(0);

      const result = await service.sendMessage(messageDto as any, 'user-123');

      expect(result.content).toBe('Olá!');
      expect(mockChatGateway.emitNewMessage).toHaveBeenCalled();
    });

    it('deve lançar ForbiddenException quando usuário não é participante', async () => {
      prisma.conversationParticipant.findUnique.mockResolvedValue(null);

      await expect(service.sendMessage(messageDto as any, 'user-999')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('deve lançar BadRequestException quando mensagem de texto não tem conteúdo', async () => {
      prisma.conversationParticipant.findUnique.mockResolvedValue({
        userId: 'user-123',
        conversationId: 'conv-123',
      });

      await expect(
        service.sendMessage({ conversationId: 'conv-123', type: 'TEXT' } as any, 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('markAsRead', () => {
    it('deve marcar conversa como lida', async () => {
      prisma.conversationParticipant.findUnique.mockResolvedValue({
        userId: 'user-123',
        conversationId: 'conv-123',
      });
      prisma.conversationParticipant.update.mockResolvedValue({});

      await service.markAsRead('conv-123', 'user-123');

      expect(prisma.conversationParticipant.update).toHaveBeenCalledWith({
        where: {
          conversationId_userId: {
            conversationId: 'conv-123',
            userId: 'user-123',
          },
        },
        data: {
          lastReadAt: expect.any(Date),
        },
      });
    });

    it('deve lançar ForbiddenException quando usuário não é participante', async () => {
      prisma.conversationParticipant.findUnique.mockResolvedValue(null);

      await expect(service.markAsRead('conv-123', 'user-999')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getAvailableUsers', () => {
    it('deve retornar usuários disponíveis para conversa', async () => {
      prisma.user.findMany.mockResolvedValue([mockUser2]);

      const result = await service.getAvailableUsers('user-123');

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe('user-456');
    });

    it('deve filtrar por nome', async () => {
      prisma.user.findMany.mockResolvedValue([mockUser2]);

      await service.getAvailableUsers('user-123', 'Maria');

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'Maria', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('deve excluir o próprio usuário', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await service.getAvailableUsers('user-123');

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { not: 'user-123' },
          }),
        }),
      );
    });
  });

  describe('getUnreadCount', () => {
    it('deve retornar contagem de mensagens não lidas', async () => {
      prisma.conversationParticipant.findMany.mockResolvedValue([
        { conversationId: 'conv-123', lastReadAt: new Date() },
      ]);
      prisma.message.count.mockResolvedValue(5);

      const result = await service.getUnreadCount('user-123');

      expect(result).toBe(5);
    });

    it('deve retornar zero quando não há mensagens não lidas', async () => {
      prisma.conversationParticipant.findMany.mockResolvedValue([]);

      const result = await service.getUnreadCount('user-123');

      expect(result).toBe(0);
    });
  });
});
