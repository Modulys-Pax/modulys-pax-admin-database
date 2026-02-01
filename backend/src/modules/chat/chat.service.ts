import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import {
  ConversationDto,
  ConversationListDto,
  MessageDto,
  MessageListDto,
  ParticipantDto,
  MessageAttachmentDto,
  MessageType,
} from './dto/chat-response.dto';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  /**
   * Lista todas as conversas do usuário
   */
  async getConversations(userId: string, search?: string): Promise<ConversationListDto> {
    // Buscar conversas em que o usuário participa
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId,
          },
        },
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            {
              participants: {
                some: {
                  user: {
                    name: { contains: search, mode: 'insensitive' },
                  },
                },
              },
            },
          ],
        }),
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
            attachments: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Mapear para DTO
    const conversationsDto: ConversationDto[] = await Promise.all(
      conversations.map(async (conv) => {
        // Encontrar participante atual para verificar lastReadAt
        const currentParticipant = conv.participants.find((p) => p.userId === userId);

        // Contar mensagens não lidas
        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            createdAt: {
              gt: currentParticipant?.lastReadAt || new Date(0),
            },
            deletedAt: null,
          },
        });

        const lastMessage = conv.messages[0];

        return {
          id: conv.id,
          name: conv.name || undefined,
          isGroup: conv.isGroup,
          participants: conv.participants.map((p) => ({
            id: p.id,
            userId: p.userId,
            userName: p.user.name,
            joinedAt: p.joinedAt,
            lastReadAt: p.lastReadAt || undefined,
          })),
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                conversationId: lastMessage.conversationId,
                senderId: lastMessage.senderId,
                senderName: lastMessage.sender.name,
                type: lastMessage.type,
                content: lastMessage.content || undefined,
                attachments: lastMessage.attachments.map((a) => ({
                  id: a.id,
                  fileName: a.fileName,
                  filePath: a.filePath,
                  fileSize: a.fileSize || undefined,
                  mimeType: a.mimeType || undefined,
                })),
                createdAt: lastMessage.createdAt,
                updatedAt: lastMessage.updatedAt,
              }
            : undefined,
          unreadCount,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
        };
      }),
    );

    return {
      data: conversationsDto,
      total: conversations.length,
    };
  }

  /**
   * Busca uma conversa específica
   */
  async getConversation(conversationId: string, userId: string): Promise<ConversationDto> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
            attachments: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada');
    }

    // Verificar se o usuário é participante
    const isParticipant = conversation.participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      throw new ForbiddenException('Você não tem acesso a esta conversa');
    }

    const currentParticipant = conversation.participants.find((p) => p.userId === userId);
    const unreadCount = await this.prisma.message.count({
      where: {
        conversationId: conversation.id,
        senderId: { not: userId },
        createdAt: {
          gt: currentParticipant?.lastReadAt || new Date(0),
        },
        deletedAt: null,
      },
    });

    const lastMessage = conversation.messages[0];

    return {
      id: conversation.id,
      name: conversation.name || undefined,
      isGroup: conversation.isGroup,
      participants: conversation.participants.map((p) => ({
        id: p.id,
        userId: p.userId,
        userName: p.user.name,
        joinedAt: p.joinedAt,
        lastReadAt: p.lastReadAt || undefined,
      })),
      lastMessage: lastMessage
        ? {
            id: lastMessage.id,
            conversationId: lastMessage.conversationId,
            senderId: lastMessage.senderId,
            senderName: lastMessage.sender.name,
            type: lastMessage.type,
            content: lastMessage.content || undefined,
            attachments: lastMessage.attachments.map((a) => ({
              id: a.id,
              fileName: a.fileName,
              filePath: a.filePath,
              fileSize: a.fileSize || undefined,
              mimeType: a.mimeType || undefined,
            })),
            createdAt: lastMessage.createdAt,
            updatedAt: lastMessage.updatedAt,
          }
        : undefined,
      unreadCount,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  /**
   * Cria uma nova conversa ou retorna uma existente
   */
  async createConversation(dto: CreateConversationDto, userId: string): Promise<ConversationDto> {
    // Adicionar o criador aos participantes
    const allParticipantIds = [...new Set([userId, ...dto.participantIds])];

    // Validar se todos os participantes existem
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: allParticipantIds },
        active: true,
        deletedAt: null,
      },
    });

    if (users.length !== allParticipantIds.length) {
      throw new BadRequestException('Um ou mais participantes não foram encontrados');
    }

    // Se não for grupo (apenas 2 participantes), verificar se já existe conversa
    const isGroup = allParticipantIds.length > 2 || !!dto.name;

    if (!isGroup && allParticipantIds.length === 2) {
      // Buscar conversa existente entre esses dois usuários
      const existingConversation = await this.prisma.conversation.findFirst({
        where: {
          isGroup: false,
          AND: allParticipantIds.map((id) => ({
            participants: {
              some: {
                userId: id,
              },
            },
          })),
          participants: {
            every: {
              userId: {
                in: allParticipantIds,
              },
            },
          },
        },
        include: {
          participants: true,
        },
      });

      // Verificar se tem exatamente 2 participantes
      if (existingConversation && existingConversation.participants.length === 2) {
        return this.getConversation(existingConversation.id, userId);
      }
    }

    // Se for grupo, verificar se já existe um grupo com os mesmos participantes
    if (isGroup) {
      const existingGroups = await this.prisma.conversation.findMany({
        where: {
          isGroup: true,
          participants: {
            every: {
              userId: {
                in: allParticipantIds,
              },
            },
          },
        },
        include: {
          participants: true,
        },
      });

      // Verificar se algum grupo tem exatamente os mesmos participantes
      for (const group of existingGroups) {
        const groupParticipantIds = group.participants.map((p) => p.userId).sort();
        const sortedAllParticipantIds = [...allParticipantIds].sort();

        if (
          groupParticipantIds.length === sortedAllParticipantIds.length &&
          groupParticipantIds.every((id, index) => id === sortedAllParticipantIds[index])
        ) {
          throw new BadRequestException('Já existe um grupo com estes participantes');
        }
      }
    }

    // Criar a conversa
    const conversation = await this.prisma.conversation.create({
      data: {
        name: dto.name || null,
        isGroup,
        createdBy: userId,
        participants: {
          create: allParticipantIds.map((participantId) => ({
            userId: participantId,
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const conversationDto: ConversationDto = {
      id: conversation.id,
      name: conversation.name || undefined,
      isGroup: conversation.isGroup,
      participants: conversation.participants.map((p) => ({
        id: p.id,
        userId: p.userId,
        userName: p.user.name,
        joinedAt: p.joinedAt,
        lastReadAt: p.lastReadAt || undefined,
      })),
      unreadCount: 0,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };

    // Notificar participantes via WebSocket
    this.chatGateway.emitConversationUpdate(allParticipantIds, {
      id: conversation.id,
      name: conversation.name || undefined,
      isGroup: conversation.isGroup,
      createdAt: conversation.createdAt,
    });

    return conversationDto;
  }

  /**
   * Lista mensagens de uma conversa com paginação
   */
  async getMessages(
    conversationId: string,
    userId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<MessageListDto> {
    // Verificar se o usuário é participante
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException('Você não tem acesso a esta conversa');
    }

    // Buscar total de mensagens
    const total = await this.prisma.message.count({
      where: {
        conversationId,
        deletedAt: null,
      },
    });

    // Buscar mensagens com paginação (mais recentes primeiro)
    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
        deletedAt: null,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
        attachments: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Atualizar lastReadAt do participante
    await this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    const messagesDto: MessageDto[] = messages.map((msg) => ({
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      senderName: msg.sender.name,
      type: msg.type,
      content: msg.content || undefined,
      attachments: msg.attachments.map((a) => ({
        id: a.id,
        fileName: a.fileName,
        filePath: a.filePath,
        fileSize: a.fileSize || undefined,
        mimeType: a.mimeType || undefined,
      })),
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
    }));

    // Reverter para ordem cronológica
    messagesDto.reverse();

    return {
      data: messagesDto,
      total,
      hasMore: page * limit < total,
    };
  }

  /**
   * Envia uma mensagem
   */
  async sendMessage(dto: CreateMessageDto, userId: string): Promise<MessageDto> {
    // Verificar se o usuário é participante
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: dto.conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException('Você não tem acesso a esta conversa');
    }

    // Validar conteúdo
    if (dto.type === MessageType.TEXT && !dto.content) {
      throw new BadRequestException('Mensagem de texto deve ter conteúdo');
    }

    // Criar a mensagem
    const message = await this.prisma.message.create({
      data: {
        conversationId: dto.conversationId,
        senderId: userId,
        type: dto.type || MessageType.TEXT,
        content: dto.content || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
        attachments: true,
      },
    });

    // Atualizar updatedAt da conversa
    await this.prisma.conversation.update({
      where: { id: dto.conversationId },
      data: { updatedAt: new Date() },
    });

    // Atualizar lastReadAt do remetente
    await this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId: dto.conversationId,
          userId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    const messageDto: MessageDto = {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderName: message.sender.name,
      type: message.type,
      content: message.content || undefined,
      attachments: message.attachments.map((a) => ({
        id: a.id,
        fileName: a.fileName,
        filePath: a.filePath,
        fileSize: a.fileSize || undefined,
        mimeType: a.mimeType || undefined,
      })),
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };

    // Emitir via WebSocket
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId: dto.conversationId },
      select: { userId: true },
    });
    const participantIds = participants.map((p) => p.userId);

    this.chatGateway.emitNewMessage(dto.conversationId, messageDto, participantIds);

    // Atualizar contagem de não lidas para outros participantes
    for (const pid of participantIds.filter((id) => id !== userId)) {
      const count = await this.getUnreadCount(pid);
      this.chatGateway.emitUnreadCount(pid, count);
    }

    return messageDto;
  }

  /**
   * Envia mensagem com anexo (mídia)
   */
  async sendMessageWithAttachment(
    conversationId: string,
    userId: string,
    content: string | null,
    file: {
      fileName: string;
      filePath: string;
      fileSize: number;
      mimeType: string;
    },
  ): Promise<MessageDto> {
    // Verificar se o usuário é participante
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException('Você não tem acesso a esta conversa');
    }

    // Determinar tipo da mensagem baseado no mimeType
    let messageType: MessageType = MessageType.FILE;
    if (file.mimeType.startsWith('image/')) {
      messageType = MessageType.IMAGE;
    }

    // Criar mensagem com anexo em uma transação
    const message = await this.prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          conversationId,
          senderId: userId,
          type: messageType,
          content,
          attachments: {
            create: {
              fileName: file.fileName,
              filePath: file.filePath,
              fileSize: file.fileSize,
              mimeType: file.mimeType,
            },
          },
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
            },
          },
          attachments: true,
        },
      });

      // Atualizar conversa
      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      // Atualizar lastReadAt
      await tx.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId,
            userId,
          },
        },
        data: {
          lastReadAt: new Date(),
        },
      });

      return msg;
    });

    const messageDto: MessageDto = {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderName: message.sender.name,
      type: message.type,
      content: message.content || undefined,
      attachments: message.attachments.map((a) => ({
        id: a.id,
        fileName: a.fileName,
        filePath: a.filePath,
        fileSize: a.fileSize || undefined,
        mimeType: a.mimeType || undefined,
      })),
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };

    // Emitir via WebSocket
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true },
    });
    const participantIds = participants.map((p) => p.userId);

    this.chatGateway.emitNewMessage(conversationId, messageDto, participantIds);

    // Atualizar contagem de não lidas para outros participantes
    for (const pid of participantIds.filter((id) => id !== userId)) {
      const count = await this.getUnreadCount(pid);
      this.chatGateway.emitUnreadCount(pid, count);
    }

    return messageDto;
  }

  /**
   * Marca conversa como lida
   */
  async markAsRead(conversationId: string, userId: string): Promise<void> {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException('Você não tem acesso a esta conversa');
    }

    await this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });
  }

  /**
   * Lista usuários disponíveis para conversa (todos os usuários ativos)
   */
  async getAvailableUsers(
    currentUserId: string,
    search?: string,
  ): Promise<{ id: string; name: string; email: string }[]> {
    const users = await this.prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        active: true,
        deletedAt: null,
        ...(search && {
          name: { contains: search, mode: 'insensitive' },
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: 'asc' },
    });

    return users;
  }

  /**
   * Obtém contagem total de mensagens não lidas
   */
  async getUnreadCount(userId: string): Promise<number> {
    const participants = await this.prisma.conversationParticipant.findMany({
      where: {
        userId,
      },
      select: {
        conversationId: true,
        lastReadAt: true,
      },
    });

    let totalUnread = 0;

    for (const participant of participants) {
      const count = await this.prisma.message.count({
        where: {
          conversationId: participant.conversationId,
          senderId: { not: userId },
          createdAt: {
            gt: participant.lastReadAt || new Date(0),
          },
          deletedAt: null,
        },
      });
      totalUnread += count;
    }

    return totalUnread;
  }
}
