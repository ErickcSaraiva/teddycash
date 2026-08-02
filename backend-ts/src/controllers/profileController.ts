import type { Response } from 'express';
import { prisma } from '../config/prisma';
import type { AuthRequest } from '../middlewares/authMiddleware';

function getParamValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export const getProfile = async (req: AuthRequest, res: Response) => {
  const userId = getParamValue(req.params.userId);

  if (!userId) {
    return res.status(400).json({ error: 'userId is required.' });
  }

  if (!req.userId || req.userId !== userId) {
    return res.status(403).json({ error: 'Access denied. You can only view your own profile.' });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      avatarUrl: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  return res.json({
    user_id: user.id,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
  });
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const userId = getParamValue(req.params.userId);
  const { username, email, avatarUrl } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required.' });
  }

  if (!req.userId || req.userId !== userId) {
    return res.status(403).json({ error: 'Access denied. You can only update your own profile.' });
  }

  if (
    username === undefined &&
    email === undefined &&
    avatarUrl === undefined
  ) {
    return res.status(400).json({ error: 'At least one field must be provided to update.' });
  }

  const updateData: { username?: string; email?: string; avatarUrl?: string | null } = {};

  if (username !== undefined) {
    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be a string with at least 3 characters.' });
    }
    updateData.username = username.trim();
  }

  if (email !== undefined) {
    if (!email || typeof email !== 'string' || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }
    updateData.email = email.trim().toLowerCase();
  }

  if (avatarUrl !== undefined) {
    if (avatarUrl !== null && typeof avatarUrl !== 'string') {
      return res.status(400).json({ error: 'avatarUrl must be a string or null.' });
    }
    updateData.avatarUrl = avatarUrl === null ? null : avatarUrl.trim();
  }

  const duplicateUser = await prisma.user.findFirst({
    where: {
      OR: [
        ...(updateData.username ? [{ username: updateData.username }] : []),
        ...(updateData.email ? [{ email: updateData.email }] : []),
      ],
      NOT: { id: userId },
    },
  });

  if (duplicateUser) {
    return res.status(400).json({ error: 'Username or email already in use by another account.' });
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      username: true,
      email: true,
      avatarUrl: true,
    },
  });

  return res.json({
    user_id: updatedUser.id,
    username: updatedUser.username,
    email: updatedUser.email,
    avatarUrl: updatedUser.avatarUrl,
  });
};
