import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { env } from '../config/env.js';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    // @ts-ignore
    expiresIn: env.JWT_ACCESS_EXPIRATION,
  });
};

export const generateRefreshToken = (): { token: string; hash: string; expiresAt: Date } => {
  const token = crypto.randomBytes(40).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  
  // 7 days expiration
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  return { token, hash, expiresAt };
};

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
};
