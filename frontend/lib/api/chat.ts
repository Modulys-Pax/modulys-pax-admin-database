import api from '../axios';

// Tipos
export type UserStatus = 'online' | 'away' | 'offline';

export interface Participant {
  id: string;
  userId: string;
  userName: string;
  joinedAt: string;
  lastReadAt?: string;
  status?: UserStatus;
}

export interface MessageAttachment {
  id: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
}

export type MessageType = 'TEXT' | 'IMAGE' | 'FILE';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  type: MessageType;
  content?: string;
  attachments: MessageAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  name?: string;
  isGroup: boolean;
  participants: Participant[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationList {
  data: Conversation[];
  total: number;
}

export interface MessageList {
  data: Message[];
  total: number;
  hasMore: boolean;
}

export interface CreateConversationDto {
  name?: string;
  participantIds: string[];
}

export interface CreateMessageDto {
  conversationId: string;
  type?: MessageType;
  content?: string;
}

export interface AvailableUser {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
}

// API
export const chatApi = {
  // Listar conversas
  getConversations: async (search?: string): Promise<ConversationList> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    
    const response = await api.get(`/chat/conversations?${params.toString()}`);
    return response.data;
  },

  // Buscar conversa específica
  getConversation: async (id: string): Promise<Conversation> => {
    const response = await api.get(`/chat/conversations/${id}`);
    return response.data;
  },

  // Criar nova conversa
  createConversation: async (dto: CreateConversationDto): Promise<Conversation> => {
    const response = await api.post('/chat/conversations', dto);
    return response.data;
  },

  // Listar mensagens de uma conversa
  getMessages: async (
    conversationId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<MessageList> => {
    const response = await api.get(
      `/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
    );
    return response.data;
  },

  // Enviar mensagem de texto
  sendMessage: async (dto: CreateMessageDto): Promise<Message> => {
    const response = await api.post('/chat/messages', dto);
    return response.data;
  },

  // Enviar mensagem com mídia
  sendMessageWithAttachment: async (
    conversationId: string,
    file: File,
    content?: string,
  ): Promise<Message> => {
    const formData = new FormData();
    formData.append('file', file);
    if (content) formData.append('content', content);

    const response = await api.post(
      `/chat/conversations/${conversationId}/messages/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data;
  },

  // Marcar conversa como lida
  markAsRead: async (conversationId: string): Promise<{ success: boolean }> => {
    const response = await api.post(`/chat/conversations/${conversationId}/read`);
    return response.data;
  },

  // Listar usuários disponíveis para conversa
  getAvailableUsers: async (search?: string): Promise<AvailableUser[]> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);

    const response = await api.get(`/chat/users?${params.toString()}`);
    return response.data;
  },

  // Obter contagem de mensagens não lidas
  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await api.get('/chat/unread-count');
    return response.data;
  },

  // Obter status de usuários específicos
  getUsersStatus: async (userIds: string[]): Promise<Record<string, UserStatus>> => {
    const response = await api.get(`/chat/users/status?userIds=${userIds.join(',')}`);
    return response.data;
  },

  // Obter todos os usuários online
  getOnlineUsers: async (): Promise<Array<{ userId: string; userName?: string; status: UserStatus }>> => {
    const response = await api.get('/chat/users/online');
    return response.data;
  },
};
