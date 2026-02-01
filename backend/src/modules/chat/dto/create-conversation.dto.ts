import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, ArrayMinSize, IsUUID } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({
    description: 'Nome do grupo (opcional, apenas para grupos)',
    required: false,
    example: 'Equipe de Manutenção',
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'IDs dos participantes da conversa (sem incluir o criador)',
    type: [String],
    example: ['uuid-1', 'uuid-2'],
  })
  @IsArray({ message: 'Participantes deve ser um array' })
  @ArrayMinSize(1, { message: 'Deve haver pelo menos 1 participante' })
  @IsUUID('4', { each: true, message: 'Cada participante deve ser um UUID válido' })
  participantIds: string[];
}
