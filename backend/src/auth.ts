import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma.js';
import type { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function createToken(user: { id: number; username: string }): string {
  return jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): { id: number; username: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; username: string };
  } catch {
    return null;
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  console.log('[authMiddleware] Checking auth for', req.method, req.path);
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  console.log('[authMiddleware] Token present:', !!token, 'length:', token?.length);

  if (!token) {
    console.log('[authMiddleware] Rejected: no token');
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    console.log('[authMiddleware] Rejected: invalid or expired token');
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
  console.log('[authMiddleware] Token valid, payload:', payload);

  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user) {
    console.log('[authMiddleware] Rejected: user not found, id:', payload.id);
    res.status(401).json({ error: 'User not found' });
    return;
  }

  (req as Request & { user: typeof user }).user = user;
  console.log('[authMiddleware] Auth OK: userId', user.id, 'username', user.username);
  next();
}
