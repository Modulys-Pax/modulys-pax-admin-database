import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { MessageType } from './chat-response.dto';

export class CreateMessageDto {
  @ApiProperty({
    description: 'ID da conversa',
    example: 'uuid-conversation',
  })
  @IsUUID('4', { message: 'ID da conversa deve ser um UUID válido' })
  conversationId: string;

  @ApiProperty({
    description: 'Tipo da mensagem',
    enum: MessageType,
    default: MessageType.TEXT,
    required: false,
  })
  @IsEnum(MessageType, { message: 'Tipo de mensagem inválido' })
  @IsOptional()
  type?: MessageType;

  @ApiProperty({
    description: 'Conteúdo da mensagem (texto ou descrição)',
    example: 'Olá, tudo bem?',
    required: false,
  })
  @IsString({ message: 'Conteúdo deve ser uma string' })
  @IsOptional()
  content?: string;
}
