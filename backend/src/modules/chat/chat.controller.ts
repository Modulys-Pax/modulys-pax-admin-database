import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import {
  ConversationDto,
  ConversationListDto,
  MessageDto,
  MessageListDto,
} from './dto/chat-response.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { FileProcessingService } from '../../shared/services/file-processing.service';

// Interface para o request autenticado
interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email: string;
    name: string;
    role: string;
    roleId: string;
    companyId: string;
    branchId: string;
    permissions: string[];
  };
}

// Configuração do multer para upload de arquivos
const uploadPath = join(process.cwd(), 'uploads', 'chat');
const storage = diskStorage({
  destination: uploadPath,
  filename: (
    _req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, filename: string) => void,
  ) => {
    const uniqueSuffix = uuidv4();
    const ext = extname(file.originalname);
    callback(null, `${uniqueSuffix}${ext}`);
  },
});

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
    private readonly fileProcessingService: FileProcessingService,
  ) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Listar conversas do usuário' })
  @ApiResponse({ status: 200, description: 'Lista de conversas', type: ConversationListDto })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nome' })
  async getConversations(
    @Req() req: AuthenticatedRequest,
    @Query('search') search?: string,
  ): Promise<ConversationListDto> {
    return this.chatService.getConversations(req.user.sub, search);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Buscar conversa específica' })
  @ApiResponse({ status: 200, description: 'Detalhes da conversa', type: ConversationDto })
  async getConversation(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ConversationDto> {
    return this.chatService.getConversation(id, req.user.sub);
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Criar nova conversa' })
  @ApiResponse({ status: 201, description: 'Conversa criada', type: ConversationDto })
  async createConversation(
    @Body() dto: CreateConversationDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ConversationDto> {
    return this.chatService.createConversation(dto, req.user.sub);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Listar mensagens de uma conversa' })
  @ApiResponse({ status: 200, description: 'Lista de mensagens', type: MessageListDto })
  @ApiQuery({ name: 'page', required: false, description: 'Página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite por página (padrão: 50)' })
  async getMessages(
    @Param('id') conversationId: string,
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<MessageListDto> {
    return this.chatService.getMessages(
      conversationId,
      req.user.sub,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }

  @Post('messages')
  @ApiOperation({ summary: 'Enviar mensagem de texto' })
  @ApiResponse({ status: 201, description: 'Mensagem enviada', type: MessageDto })
  async sendMessage(
    @Body() dto: CreateMessageDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<MessageDto> {
    return this.chatService.sendMessage(dto, req.user.sub);
  }

  @Post('conversations/:id/messages/upload')
  @ApiOperation({ summary: 'Enviar mensagem com mídia' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Mensagem com mídia enviada', type: MessageDto })
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      limits: {
        fileSize: 25 * 1024 * 1024, // 25MB máximo para imagens/PDFs
      },
      fileFilter: (_req, file, callback) => {
        // Tipos permitidos (imagens e PDFs apenas)
        const allowedMimes = [
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

        if (allowedMimes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new Error(`Tipo de arquivo não permitido: ${file.mimetype}. Use imagens ou PDF.`),
            false,
          );
        }
      },
    }),
  )
  async sendMessageWithAttachment(
    @Param('id') conversationId: string,
    @Req() req: AuthenticatedRequest,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 25 * 1024 * 1024 }), // 25MB máximo
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Body('content') content?: string,
  ): Promise<MessageDto> {
    const relativePath = `uploads/chat/${file.filename}`;

    // Processar e comprimir arquivo (especialmente imagens)
    const processedFile = await this.fileProcessingService.processFile(file, relativePath, {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 80,
    });

    if (processedFile.wasCompressed) {
      this.logger.log(
        `Arquivo comprimido: ${processedFile.originalSize} -> ${processedFile.fileSize} bytes`,
      );
    }

    return this.chatService.sendMessageWithAttachment(
      conversationId,
      req.user.sub,
      content || null,
      {
        fileName: processedFile.fileName,
        filePath: processedFile.filePath,
        fileSize: processedFile.fileSize,
        mimeType: processedFile.mimeType,
      },
    );
  }

  @Post('conversations/:id/read')
  @ApiOperation({ summary: 'Marcar conversa como lida' })
  @ApiResponse({ status: 200, description: 'Conversa marcada como lida' })
  async markAsRead(
    @Param('id') conversationId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    await this.chatService.markAsRead(conversationId, req.user.sub);
    return { success: true };
  }

  @Get('users')
  @ApiOperation({ summary: 'Listar usuários disponíveis para conversa' })
  @ApiResponse({ status: 200, description: 'Lista de usuários com status' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nome' })
  async getAvailableUsers(
    @Req() req: AuthenticatedRequest,
    @Query('search') search?: string,
  ): Promise<{ id: string; name: string; email: string; status: string }[]> {
    const users = await this.chatService.getAvailableUsers(req.user.sub, search);

    // Adicionar status de cada usuário
    const userIds = users.map((u) => u.id);
    const statuses = this.chatGateway.getUsersStatus(userIds);

    return users.map((user) => ({
      ...user,
      status: statuses[user.id] || 'offline',
    }));
  }

  @Get('users/status')
  @ApiOperation({ summary: 'Obter status de usuários específicos' })
  @ApiResponse({ status: 200, description: 'Status dos usuários' })
  @ApiQuery({
    name: 'userIds',
    required: true,
    description: 'IDs dos usuários separados por vírgula',
  })
  async getUsersStatus(@Query('userIds') userIds: string): Promise<Record<string, string>> {
    const ids = userIds.split(',').filter((id) => id.trim());
    return this.chatGateway.getUsersStatus(ids);
  }

  @Get('users/online')
  @ApiOperation({ summary: 'Listar todos os usuários online' })
  @ApiResponse({ status: 200, description: 'Lista de usuários online' })
  async getOnlineUsers(): Promise<Array<{ userId: string; userName?: string; status: string }>> {
    return this.chatGateway.getAllUsersPresence();
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Obter contagem de mensagens não lidas' })
  @ApiResponse({ status: 200, description: 'Contagem de não lidas' })
  async getUnreadCount(@Req() req: AuthenticatedRequest): Promise<{ count: number }> {
    const count = await this.chatService.getUnreadCount(req.user.sub);
    return { count };
  }
}
