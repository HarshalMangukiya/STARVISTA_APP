import { userRepository } from '../repositories/userRepository.js';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from '../utils/jwt.js';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  BadRequestError,
} from '../utils/errors.js';
import { RegisterInput, LoginInput } from '../validators/authValidators.js';
import { logger } from '../utils/logger.js';

export class AuthService {
  async register(input: RegisterInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await hashPassword(input.password);

    const user = await userRepository.create({
      email: input.email,
      password_hash: passwordHash,
      first_name: input.firstName,
      last_name: input.lastName,
      phone: input.phone,
    });

    const accessToken = generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshTokenData = generateRefreshToken();
    await userRepository.saveRefreshToken(
      user.id,
      refreshTokenData.hash,
      refreshTokenData.expiresAt
    );

    logger.info(`User registered: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
      },
      accessToken,
      refreshToken: refreshTokenData.token,
    };
  }

  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.is_active) {
      throw new UnauthorizedError('Account has been deactivated');
    }

    const isPasswordValid = await comparePassword(input.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const accessToken = generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshTokenData = generateRefreshToken();
    await userRepository.saveRefreshToken(
      user.id,
      refreshTokenData.hash,
      refreshTokenData.expiresAt
    );

    logger.info(`User logged in: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
      },
      accessToken,
      refreshToken: refreshTokenData.token,
    };
  }

  async refreshToken(refreshTokenValue: string) {
    const tokenHash = hashToken(refreshTokenValue);
    const storedToken = await userRepository.findRefreshToken(tokenHash);

    if (!storedToken || storedToken.revoked) {
      throw new UnauthorizedError('Invalid or revoked refresh token');
    }

    if (new Date() > storedToken.expires_at) {
      await userRepository.revokeRefreshToken(tokenHash);
      throw new UnauthorizedError('Refresh token has expired');
    }

    const user = await userRepository.findById(storedToken.user_id);
    if (!user || !user.is_active) {
      throw new UnauthorizedError('User account not found or deactivated');
    }

    // Revoke the old refresh token (rotation)
    await userRepository.revokeRefreshToken(tokenHash);

    // Issue new tokens
    const accessToken = generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const newRefreshTokenData = generateRefreshToken();
    await userRepository.saveRefreshToken(
      user.id,
      newRefreshTokenData.hash,
      newRefreshTokenData.expiresAt
    );

    return {
      accessToken,
      refreshToken: newRefreshTokenData.token,
    };
  }

  async logout(userId: string) {
    await userRepository.revokeAllUserTokens(userId);
    logger.info(`User logged out (all tokens revoked): ${userId}`);
  }

  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at,
    };
  }

  async updateProfile(
    userId: string,
    data: { firstName?: string; lastName?: string; phone?: string }
  ) {
    const updateData: any = {};
    if (data.firstName !== undefined) updateData.first_name = data.firstName;
    if (data.lastName !== undefined) updateData.last_name = data.lastName;
    if (data.phone !== undefined) updateData.phone = data.phone;

    const user = await userRepository.update(userId, updateData);

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      role: user.role,
    };
  }
}

export const authService = new AuthService();
