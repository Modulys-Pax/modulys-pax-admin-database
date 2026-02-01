import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') || 'change-me-in-production',
    });
  }

  async validate(payload: any) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Token inválido');
    }

    // Buscar usuário no banco para garantir que ainda existe e está ativo
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    if (!user.active) {
      throw new UnauthorizedException('Usuário inativo');
    }

    // Extrair permissões do usuário
    const permissions = user.role.permissions.map((rp) => rp.permission.name);

    // Retornar payload enriquecido com dados do usuário e permissões
    return {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role.name,
      roleId: user.role.id,
      companyId: user.companyId,
      branchId: user.branchId,
      permissions,
    };
  }
}
