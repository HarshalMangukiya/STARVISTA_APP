import { prisma } from '../config/database.js';
import { User, RefreshToken, Role } from '@prisma/client';

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async create(data: {
    email: string;
    password_hash: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    role?: Role;
  }): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        password_hash: data.password_hash,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        role: data.role || 'HOSTEL_ADMIN',
      },
    });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async saveRefreshToken(userId: string, tokenHash: string, expiresAt: Date): Promise<RefreshToken> {
    return prisma.refreshToken.create({
      data: {
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });
  }

  async findRefreshToken(tokenHash: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findUnique({
      where: { token_hash: tokenHash },
    });
  }

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { token_hash: tokenHash },
      data: { revoked: true },
    });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { user_id: userId },
      data: { revoked: true },
    });
  }
}

export const userRepository = new UserRepository();
