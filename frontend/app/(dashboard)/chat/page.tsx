'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/auth-context';
import { useSocket } from '@/lib/contexts/socket-context';
import { chatApi, Conversation, Message, AvailableUser } from '@/lib/api/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toastSuccess, toastError } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { processMediaFile, formatFileSize } from '@/lib/utils/media-compression';
import {
  Search,
  Plus,
  Send,
  Paperclip,
  File,
  FileText,
  Users,
  MessageCircle,
  X,
  ArrowLeft,
  CheckCheck,
  Wifi,
  WifiOff,
  Download,
  Maximize2,
} from 'lucide-react';

// Tipos de arquivo permitidos (imagens e PDFs apenas)
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/avif',
  'image/svg+xml',
  'image/tiff',
  'application/pdf',
];

const ACCEPTED_FILE_TYPES = ALLOWED_FILE_TYPES.join(',');
const MAX_FILE_SIZE_MB = 25; // Máximo 25MB para imagens/PDFs

// Polling como fallback quando WebSocket não está conectado
const POLLING_INTERVAL = 30000; // 30 segundos (aumentado pois WebSocket é o principal)

// Componente de indicador de status
function StatusIndicator({ 
  status, 
  size = 'sm',
  showLabel = false 
}: { 
  status: 'online' | 'away' | 'offline'; 
  size?: 'xs' | 'sm' | 'md';
  showLabel?: boolean;
}) {
  const sizeClasses = {
    xs: 'h-2 w-2',
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
  };

  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    offline: 'bg-gray-400',
  };

  const statusLabels = {
    online: 'Online',
    away: 'Ausente',
    offline: 'Offline',
  };

  return (
    <div className="flex items-center gap-1.5">
      <span 
        className={cn(
          'rounded-full ring-2 ring-background',
          sizeClasses[size],
          statusColors[status]
        )}
        title={statusLabels[status]}
      />
      {showLabel && (
        <span className="text-xs text-muted-foreground">
          {statusLabels[status]}
        </span>
      )}
    </div>
  );
}

export default function ChatPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const {
    isConnected,
    joinConversation,
    leaveConversation,
    markAsRead,
    refreshUnreadCount,
    getUserStatus,
    userStatuses,
    onNewMessage,
    onMessageNotification,
    onNewConversation,
    onUserStatusChange,
  } = useSocket();
  
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const [newConversationName, setNewConversationName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMobileConversationOpen, setIsMobileConversationOpen] = useState(false);
  const previousConversationRef = useRef<string | null>(null);
  
  // Estado para visualização de imagem em fullscreen
  const [mediaViewer, setMediaViewer] = useState<{
    isOpen: boolean;
    url: string;
    fileName: string;
  }>({ isOpen: false, url: '', fileName: '' });

  // Buscar conversas (polling como fallback)
  const { data: conversationsData, isLoading: loadingConversations } = useQuery({
    queryKey: ['chat-conversations', searchQuery],
    queryFn: () => chatApi.getConversations(searchQuery || undefined),
    refetchInterval: isConnected ? false : POLLING_INTERVAL, // Desabilitar polling se WebSocket conectado
  });

  // Buscar mensagens da conversa selecionada
  const { data: messagesData, isLoading: loadingMessages } = useQuery({
    queryKey: ['chat-messages', selectedConversation],
    queryFn: () =>
      selectedConversation ? chatApi.getMessages(selectedConversation) : null,
    enabled: !!selectedConversation,
    refetchInterval: isConnected ? false : POLLING_INTERVAL, // Desabilitar polling se WebSocket conectado
  });

  // Gerenciar join/leave de conversas via WebSocket
  useEffect(() => {
    if (!isConnected) return;

    // Sair da conversa anterior
    if (previousConversationRef.current && previousConversationRef.current !== selectedConversation) {
      leaveConversation(previousConversationRef.current);
    }

    // Entrar na nova conversa
    if (selectedConversation) {
      joinConversation(selectedConversation);
      markAsRead(selectedConversation);
      
      // Marcar como lida no backend e atualizar cache local
      chatApi.markAsRead(selectedConversation).then(() => {
        // Atualizar o cache da conversa para zerar o unreadCount
        queryClient.setQueryData(['chat-conversations', searchQuery], (old: { data: Conversation[]; total: number } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((conv) =>
              conv.id === selectedConversation
                ? { ...conv, unreadCount: 0 }
                : conv
            ),
          };
        });
        
        // Atualizar contador global
        refreshUnreadCount();
      }).catch(() => {});
    }

    previousConversationRef.current = selectedConversation;
  }, [selectedConversation, isConnected, joinConversation, leaveConversation, markAsRead, queryClient, searchQuery, refreshUnreadCount]);

  // Listener para novas mensagens (na conversa atual)
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = onNewMessage((message) => {
      // Atualizar cache de mensagens se for da conversa atual
      if (message.conversationId === selectedConversation) {
        queryClient.setQueryData(['chat-messages', selectedConversation], (old: { data: Message[] } | undefined) => {
          if (!old) return old;
          
          // Verificar se a mensagem já existe (evitar duplicatas)
          if (old.data.some((m) => m.id === message.id)) {
            return old;
          }
          
          return {
            ...old,
            data: [...old.data, {
              ...message,
              createdAt: new Date(message.createdAt).toISOString(),
            }],
          };
        });

        // Marcar como lida via WebSocket
        markAsRead(message.conversationId);
        
        // Chamar API para marcar como lida no backend
        chatApi.markAsRead(message.conversationId).then(() => {
          // Atualizar contador global
          refreshUnreadCount();
        }).catch(() => {});
      }
    });

    return unsubscribe;
  }, [isConnected, selectedConversation, onNewMessage, queryClient, markAsRead, refreshUnreadCount]);

  // Listener para notificações de mensagem (para outras conversas)
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = onMessageNotification((notification) => {
      // Atualizar lista de conversas para refletir nova mensagem
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    });

    return unsubscribe;
  }, [isConnected, onMessageNotification, queryClient]);

  // Listener para novas conversas
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = onNewConversation((conversation) => {
      // Atualizar lista de conversas
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    });

    return unsubscribe;
  }, [isConnected, onNewConversation, queryClient]);

  // Buscar usuários disponíveis para nova conversa
  const { data: availableUsers } = useQuery({
    queryKey: ['chat-users', userSearchQuery],
    queryFn: () => chatApi.getAvailableUsers(userSearchQuery || undefined),
    enabled: isNewConversationOpen,
  });

  // Mutations
  const sendMessageMutation = useMutation({
    mutationFn: (data: { conversationId: string; content: string }) =>
      chatApi.sendMessage({
        conversationId: data.conversationId,
        content: data.content,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      setMessageInput('');
    },
    onError: () => {
      toastError('Erro ao enviar mensagem');
    },
  });

  const sendAttachmentMutation = useMutation({
    mutationFn: (data: { conversationId: string; file: File }) =>
      chatApi.sendMessageWithAttachment(data.conversationId, data.file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    },
    onError: () => {
      toastError('Erro ao enviar arquivo');
    },
  });

  const createConversationMutation = useMutation({
    mutationFn: () =>
      chatApi.createConversation({
        name: selectedUsers.length > 1 ? newConversationName || undefined : undefined,
        participantIds: selectedUsers,
      }),
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      setSelectedConversation(conversation.id);
      setIsNewConversationOpen(false);
      setNewConversationName('');
      setSelectedUsers([]);
      setIsMobileConversationOpen(true);
      toastSuccess('Conversa criada com sucesso');
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Erro ao criar conversa');
    },
  });

  // Scroll para a última mensagem
  useEffect(() => {
    if (messagesData?.data) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messagesData?.data]);

  // Marcar como lida quando selecionar conversa
  useEffect(() => {
    if (selectedConversation) {
      chatApi.markAsRead(selectedConversation);
    }
  }, [selectedConversation]);

  // Conversas filtradas
  const conversations = conversationsData?.data || [];
  const messages = messagesData?.data || [];

  // Conversa selecionada
  const currentConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversation),
    [conversations, selectedConversation],
  );

  // Nome da conversa (para conversas individuais, mostra o nome do outro participante)
  const getConversationName = (conversation: Conversation) => {
    if (conversation.isGroup && conversation.name) {
      return conversation.name;
    }
    const otherParticipants = conversation.participants.filter(
      (p) => p.userId !== user?.id,
    );
    return otherParticipants.map((p) => p.userName).join(', ') || 'Conversa';
  };

  // Status da conversa (para conversas individuais, mostra o status do outro participante)
  const getConversationStatus = useCallback((conversation: Conversation): 'online' | 'away' | 'offline' | null => {
    // Em grupos, não mostrar status único
    if (conversation.isGroup) {
      return null;
    }
    
    const otherParticipant = conversation.participants.find(
      (p) => p.userId !== user?.id,
    );
    
    if (!otherParticipant) return null;
    
    return getUserStatus(otherParticipant.userId);
  }, [user?.id, getUserStatus]);

  // Enviar mensagem
  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;
    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      content: messageInput.trim(),
    });
  };

  // Estado para progresso de compressão
  const [isCompressing, setIsCompressing] = useState(false);

  // Enviar arquivo com compressão no cliente
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedConversation) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Verificar tipo de arquivo
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toastError('Tipo de arquivo não permitido. Use: imagens (JPEG, PNG, GIF, WebP, BMP, AVIF, SVG, TIFF) ou PDF');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Verificar tamanho máximo inicial
    const maxSizeBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toastError(`Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE_MB}MB`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    try {
      setIsCompressing(true);

      // Processar arquivo no cliente (compressão para imagens, validação para vídeos)
      const result = await processMediaFile(file, {
        maxSizeMB: 1, // Comprimir imagens para máx 1MB
        maxWidthOrHeight: 1920, // Máximo 1920px
        quality: 0.8, // 80% qualidade
      });

      // Se houver erro (ex: vídeo muito grande), mostrar mensagem
      if (result.error) {
        toastError(result.error);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // Mostrar info de compressão se houve
      if (result.compressionInfo?.wasCompressed) {
        const { originalSize, compressedSize, compressionRatio } = result.compressionInfo;
        console.log(
          `Imagem comprimida no cliente: ${formatFileSize(originalSize)} → ${formatFileSize(compressedSize)} (${compressionRatio.toFixed(1)}% redução)`
        );
      }

      // Enviar arquivo processado
      sendAttachmentMutation.mutate({
        conversationId: selectedConversation,
        file: result.file,
      });
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toastError('Erro ao processar arquivo');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Toggle usuário na seleção
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  // Download de arquivo
  const handleDownload = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch {
      toastError('Erro ao baixar arquivo');
    }
  };

  // Abrir visualizador de imagem
  const openImageViewer = (url: string, fileName: string) => {
    setMediaViewer({ isOpen: true, url, fileName });
  };

  // Fechar visualizador de imagem
  const closeImageViewer = () => {
    setMediaViewer({ isOpen: false, url: '', fileName: '' });
  };

  // Criar conversa
  const handleCreateConversation = () => {
    if (selectedUsers.length === 0) {
      toastError('Selecione pelo menos um participante');
      return;
    }
    createConversationMutation.mutate();
  };

  // Formatar hora da mensagem
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Formatar data da mensagem
  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    }
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  };

  // Agrupar mensagens por data
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';

    messages.forEach((message) => {
      const messageDate = formatMessageDate(message.createdAt);
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({ date: messageDate, messages: [message] });
      } else {
        groups[groups.length - 1].messages.push(message);
      }
    });

    return groups;
  }, [messages]);

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Chat Container - Fullscreen */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Lista de Conversas */}
        <div
          className={cn(
            'w-full md:w-80 lg:w-96 border-r flex flex-col bg-background min-h-0',
            isMobileConversationOpen && 'hidden md:flex',
          )}
        >
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-foreground">Chat</h1>
              {isConnected ? (
                <span title="Conectado em tempo real">
                  <Wifi className="h-4 w-4 text-green-500" />
                </span>
              ) : (
                <span title="Modo offline">
                  <WifiOff className="h-4 w-4 text-muted-foreground" />
                </span>
              )}
            </div>
            <Button size="sm" onClick={() => setIsNewConversationOpen(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Pesquisa */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conversas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>

          {/* Lista */}
          <ScrollArea className="flex-1 min-h-0">
            {loadingConversations ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Nenhuma conversa ainda</p>
                <Button
                  variant="link"
                  onClick={() => setIsNewConversationOpen(true)}
                  className="mt-2"
                >
                  Iniciar uma conversa
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => {
                      setSelectedConversation(conversation.id);
                      setIsMobileConversationOpen(true);
                    }}
                    className={cn(
                      'w-full p-4 text-left hover:bg-muted/50 transition-colors flex items-start gap-3',
                      selectedConversation === conversation.id && 'bg-muted',
                    )}
                  >
                    {/* Avatar com indicador de status */}
                    <div className="relative flex-shrink-0">
                      <div
                        className={cn(
                          'h-12 w-12 rounded-full flex items-center justify-center',
                          conversation.isGroup
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted',
                        )}
                      >
                        {conversation.isGroup ? (
                          <Users className="h-5 w-5" />
                        ) : (
                          <span className="text-lg font-semibold">
                            {getConversationName(conversation).charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {/* Indicador de status */}
                      {!conversation.isGroup && (() => {
                        const status = getConversationStatus(conversation);
                        return status ? (
                          <div className="absolute -bottom-0.5 -right-0.5">
                            <StatusIndicator status={status} size="sm" />
                          </div>
                        ) : null;
                      })()}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-foreground truncate">
                          {getConversationName(conversation)}
                        </span>
                        {conversation.lastMessage && (
                          <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                            {formatMessageTime(conversation.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage ? (
                            <>
                              {conversation.lastMessage.senderId === user?.id && (
                                <span className="text-muted-foreground/70">Você: </span>
                              )}
                              {conversation.lastMessage.type === 'TEXT'
                                ? conversation.lastMessage.content
                                : conversation.lastMessage.type === 'IMAGE'
                                  ? '📷 Imagem'
                                  : '📎 Arquivo'}
                            </>
                          ) : (
                            'Nenhuma mensagem ainda'
                          )}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <Badge
                            variant="default"
                            className="ml-2 h-5 min-w-[20px] flex items-center justify-center text-xs"
                          >
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Área de Mensagens */}
        <div
          className={cn(
            'flex-1 flex flex-col min-h-0',
            !isMobileConversationOpen && 'hidden md:flex',
          )}
        >
          {selectedConversation && currentConversation ? (
            <>
              {/* Header da Conversa */}
              <div className="p-4 border-b flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setIsMobileConversationOpen(false)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="relative flex-shrink-0">
                  <div
                    className={cn(
                      'h-10 w-10 rounded-full flex items-center justify-center',
                      currentConversation.isGroup
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted',
                    )}
                  >
                    {currentConversation.isGroup ? (
                      <Users className="h-5 w-5" />
                    ) : (
                      <span className="text-lg font-semibold">
                        {getConversationName(currentConversation).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {/* Indicador de status no avatar */}
                  {!currentConversation.isGroup && (() => {
                    const status = getConversationStatus(currentConversation);
                    return status ? (
                      <div className="absolute -bottom-0.5 -right-0.5">
                        <StatusIndicator status={status} size="sm" />
                      </div>
                    ) : null;
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-foreground truncate">
                    {getConversationName(currentConversation)}
                  </h2>
                  <div className="flex items-center gap-1.5">
                    {currentConversation.isGroup ? (
                      <p className="text-xs text-muted-foreground">
                        {currentConversation.participants.length} participantes
                      </p>
                    ) : (() => {
                      const status = getConversationStatus(currentConversation);
                      return status ? (
                        <StatusIndicator status={status} size="xs" showLabel />
                      ) : (
                        <p className="text-xs text-muted-foreground">Conversa individual</p>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Mensagens */}
              <ScrollArea className="flex-1 min-h-0 p-4">
                {loadingMessages ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={cn('flex', i % 2 === 0 ? 'justify-end' : '')}
                      >
                        <Skeleton className="h-16 w-64 rounded-2xl" />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground">
                        Nenhuma mensagem ainda. Envie a primeira!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {groupedMessages.map((group) => (
                      <div key={group.date}>
                        {/* Separador de Data */}
                        <div className="flex items-center justify-center my-4">
                          <span className="px-3 py-1 text-xs text-muted-foreground bg-muted rounded-full">
                            {group.date}
                          </span>
                        </div>

                        {/* Mensagens do Grupo */}
                        <div className="space-y-2">
                          {group.messages.map((message) => {
                            const isOwn = message.senderId === user?.id;
                            return (
                              <div
                                key={message.id}
                                className={cn(
                                  'flex',
                                  isOwn ? 'justify-end' : 'justify-start',
                                )}
                              >
                                <div
                                  className={cn(
                                    'max-w-[70%] rounded-2xl px-4 py-2',
                                    isOwn
                                      ? 'bg-primary text-primary-foreground rounded-br-md'
                                      : 'bg-muted rounded-bl-md',
                                  )}
                                >
                                  {/* Nome do remetente (em grupos) */}
                                  {!isOwn && currentConversation.isGroup && (
                                    <p className="text-xs font-medium mb-1 opacity-70">
                                      {message.senderName}
                                    </p>
                                  )}

                                  {/* Conteúdo */}
                                  {message.type === 'TEXT' && (
                                    <p className="text-sm whitespace-pre-wrap break-words">
                                      {message.content}
                                    </p>
                                  )}

                                  {/* Imagem */}
                                  {message.type === 'IMAGE' &&
                                    message.attachments[0] && (() => {
                                      const attachment = message.attachments[0];
                                      const fileUrl = `${process.env.NEXT_PUBLIC_API_URL}/${attachment.filePath}`;
                                      return (
                                        <div className="relative group">
                                          <img
                                            src={fileUrl}
                                            alt={attachment.fileName}
                                            className="max-w-full max-h-[300px] rounded-lg cursor-pointer object-contain"
                                            onClick={() => openImageViewer(fileUrl, attachment.fileName)}
                                          />
                                          {/* Overlay com ações */}
                                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                              variant="secondary"
                                              size="icon"
                                              className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openImageViewer(fileUrl, attachment.fileName);
                                              }}
                                              title="Ver em tela cheia"
                                            >
                                              <Maximize2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              variant="secondary"
                                              size="icon"
                                              className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownload(fileUrl, attachment.fileName);
                                              }}
                                              title="Baixar"
                                            >
                                              <Download className="h-4 w-4" />
                                            </Button>
                                          </div>
                                          {message.content && (
                                            <p className="text-sm mt-2">{message.content}</p>
                                          )}
                                        </div>
                                      );
                                    })()}

                                  {/* PDF e outros arquivos */}
                                  {message.type === 'FILE' &&
                                    message.attachments[0] && (() => {
                                      const attachment = message.attachments[0];
                                      const fileUrl = `${process.env.NEXT_PUBLIC_API_URL}/${attachment.filePath}`;
                                      const isPdf = attachment.mimeType === 'application/pdf';
                                      return (
                                        <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                                          <div className="flex-shrink-0">
                                            {isPdf ? (
                                              <FileText className="h-10 w-10 text-red-500" />
                                            ) : (
                                              <File className="h-10 w-10 text-muted-foreground" />
                                            )}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                              {attachment.fileName}
                                            </p>
                                            {attachment.fileSize && (
                                              <p className="text-xs text-muted-foreground">
                                                {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                                              </p>
                                            )}
                                          </div>
                                          <div className="flex gap-1">
                                            {isPdf && (
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => window.open(fileUrl, '_blank')}
                                                title="Abrir PDF"
                                              >
                                                <Maximize2 className="h-4 w-4" />
                                              </Button>
                                            )}
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8"
                                              onClick={() => handleDownload(fileUrl, attachment.fileName)}
                                              title="Baixar"
                                            >
                                              <Download className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      );
                                    })()}

                                  {/* Hora */}
                                  <div
                                    className={cn(
                                      'flex items-center gap-1 mt-1',
                                      isOwn ? 'justify-end' : 'justify-start',
                                    )}
                                  >
                                    <span className="text-[10px] opacity-70">
                                      {formatMessageTime(message.createdAt)}
                                    </span>
                                    {isOwn && (
                                      <CheckCheck className="h-3 w-3 opacity-70" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input de Mensagem */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept={ACCEPTED_FILE_TYPES}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sendAttachmentMutation.isPending || isCompressing}
                    title={isCompressing ? "Comprimindo arquivo..." : "Anexar arquivo"}
                  >
                    {isCompressing ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      <Paperclip className="h-5 w-5" />
                    )}
                  </Button>
                  <Input
                    placeholder="Digite uma mensagem..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={sendMessageMutation.isPending}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sendMessageMutation.isPending}
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Bem-vindo ao Chat
                </h3>
                <p className="text-muted-foreground mb-4">
                  Selecione uma conversa ou inicie uma nova
                </p>
                <Button onClick={() => setIsNewConversationOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Conversa
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Nova Conversa */}
      <Dialog open={isNewConversationOpen} onOpenChange={setIsNewConversationOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Conversa</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Nome do grupo (se mais de 1 participante) */}
            {selectedUsers.length > 1 && (
              <div className="space-y-2">
                <Label>Nome do grupo (opcional)</Label>
                <Input
                  placeholder="Ex: Equipe de Manutenção"
                  value={newConversationName}
                  onChange={(e) => setNewConversationName(e.target.value)}
                />
              </div>
            )}

            {/* Pesquisa de usuários */}
            <div className="space-y-2">
              <Label>Selecione os participantes</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar funcionários..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Usuários selecionados */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((userId) => {
                  const selectedUser = availableUsers?.find((u) => u.id === userId);
                  return (
                    <Badge
                      key={userId}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {selectedUser?.name}
                      <button
                        onClick={() => toggleUserSelection(userId)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}

            {/* Lista de usuários */}
            <ScrollArea className="h-64 border rounded-md">
              {availableUsers?.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  Nenhum usuário encontrado
                </div>
              ) : (
                <div className="divide-y">
                  {availableUsers?.map((availableUser) => (
                    <button
                      key={availableUser.id}
                      onClick={() => toggleUserSelection(availableUser.id)}
                      className="w-full p-3 text-left hover:bg-muted/50 transition-colors flex items-center gap-3"
                    >
                      <Checkbox
                        checked={selectedUsers.includes(availableUser.id)}
                        className="pointer-events-none"
                      />
                      <div className="relative flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {availableUser.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5">
                          <StatusIndicator status={availableUser.status || 'offline'} size="xs" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground truncate">
                            {availableUser.name}
                          </p>
                          <StatusIndicator status={availableUser.status || 'offline'} size="xs" showLabel />
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {availableUser.email}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsNewConversationOpen(false);
                setSelectedUsers([]);
                setNewConversationName('');
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateConversation}
              disabled={selectedUsers.length === 0 || createConversationMutation.isPending}
            >
              {createConversationMutation.isPending ? 'Criando...' : 'Criar Conversa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização de Imagem */}
      <Dialog open={mediaViewer.isOpen} onOpenChange={(open) => !open && closeImageViewer()}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black/95">
          <div className="relative w-full h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-black/50">
              <p className="text-white font-medium truncate flex-1 mr-4">
                {mediaViewer.fileName}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => handleDownload(mediaViewer.url, mediaViewer.fileName)}
                  title="Baixar"
                >
                  <Download className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={closeImageViewer}
                  title="Fechar"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
              <img
                src={mediaViewer.url}
                alt={mediaViewer.fileName}
                className="max-w-full max-h-[80vh] object-contain"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
