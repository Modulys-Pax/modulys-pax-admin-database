import { ApiProperty } from '@nestjs/swagger';
import { MessageType } from '@prisma/client';

export { MessageType };

export type UserStatus = 'online' | 'away' | 'offline';

export class UserStatusDto {
  @ApiProperty({ description: 'ID do usuário' })
  userId: string;

  @ApiProperty({ description: 'Nome do usuário', required: false })
  userName?: string;

  @ApiProperty({ description: 'Status do usuário', enum: ['online', 'away', 'offline'] })
  status: UserStatus;
}

export class ParticipantDto {
  @ApiProperty({ description: 'ID do participante' })
  id: string;

  @ApiProperty({ description: 'ID do usuário' })
  userId: string;

  @ApiProperty({ description: 'Nome do usuário' })
  userName: string;

  @ApiProperty({ description: 'Data de entrada na conversa' })
  joinedAt: Date;

  @ApiProperty({ description: 'Última leitura', required: false })
  lastReadAt?: Date;

  @ApiProperty({
    description: 'Status do usuário',
    enum: ['online', 'away', 'offline'],
    required: false,
  })
  status?: UserStatus;
}

export class MessageAttachmentDto {
  @ApiProperty({ description: 'ID do anexo' })
  id: string;

  @ApiProperty({ description: 'Nome do arquivo' })
  fileName: string;

  @ApiProperty({ description: 'Caminho do arquivo' })
  filePath: string;

  @ApiProperty({ description: 'Tamanho do arquivo em bytes', required: false })
  fileSize?: number;

  @ApiProperty({ description: 'Tipo MIME do arquivo', required: false })
  mimeType?: string;
}

export class MessageDto {
  @ApiProperty({ description: 'ID da mensagem' })
  id: string;

  @ApiProperty({ description: 'ID da conversa' })
  conversationId: string;

  @ApiProperty({ description: 'ID do remetente' })
  senderId: string;

  @ApiProperty({ description: 'Nome do remetente' })
  senderName: string;

  @ApiProperty({ description: 'Tipo da mensagem', enum: MessageType })
  type: MessageType;

  @ApiProperty({ description: 'Conteúdo da mensagem', required: false })
  content?: string;

  @ApiProperty({ description: 'Anexos da mensagem', type: [MessageAttachmentDto] })
  attachments: MessageAttachmentDto[];

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}

export class ConversationDto {
  @ApiProperty({ description: 'ID da conversa' })
  id: string;

  @ApiProperty({ description: 'Nome do grupo', required: false })
  name?: string;

  @ApiProperty({ description: 'Se é um grupo' })
  isGroup: boolean;

  @ApiProperty({ description: 'Participantes da conversa', type: [ParticipantDto] })
  participants: ParticipantDto[];

  @ApiProperty({ description: 'Última mensagem', type: MessageDto, required: false })
  lastMessage?: MessageDto;

  @ApiProperty({ description: 'Quantidade de mensagens não lidas' })
  unreadCount: number;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}

export class ConversationListDto {
  @ApiProperty({ description: 'Lista de conversas', type: [ConversationDto] })
  data: ConversationDto[];

  @ApiProperty({ description: 'Total de conversas' })
  total: number;
}

export class MessageListDto {
  @ApiProperty({ description: 'Lista de mensagens', type: [MessageDto] })
  data: MessageDto[];

  @ApiProperty({ description: 'Total de mensagens' })
  total: number;

  @ApiProperty({ description: 'Se há mais mensagens antigas' })
  hasMore: boolean;
}
