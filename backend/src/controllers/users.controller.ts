import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { hashPassword } from '../utils/password';
import { createUserSchema, updateUserSchema } from '../utils/validation';
import { UserRole } from '../constants/enums';

export async function getUsers(req: Request, res: Response): Promise<Response> {
  try {
    const { role, active } = req.query;
    
    const users = await prisma.user.findMany({
      where: {
        ...(role && { role: role as UserRole }),
        ...(active !== undefined && { isActive: active === 'true' }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch users' },
    });
  }
}

export async function createUser(req: Request, res: Response): Promise<Response> {
  try {
    const data = createUserSchema.parse(req.body);
    
    // Check if username or email already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: data.username },
          { email: data.email },
        ],
      },
    });

    if (existing) {
      return res.status(400).json({
        error: { 
          code: 'USER_EXISTS', 
          message: existing.username === data.username 
            ? 'Username already exists' 
            : 'Email already exists',
        },
      });
    }

    const passwordHash = await hashPassword(data.password);
    
    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash,
        role: data.role,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    });

    return res.status(201).json({ user });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create user' },
    });
  }
}

export async function updateUser(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = req.params;
    const data = updateUserSchema.parse(req.body);

    // Check if email is being changed and already exists
    if (data.email) {
      const existing = await prisma.user.findFirst({
        where: {
          email: data.email,
          NOT: { id },
        },
      });

      if (existing) {
        return res.status(400).json({
          error: { code: 'EMAIL_EXISTS', message: 'Email already in use' },
        });
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    return res.json({ user });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      });
    }
    
    console.error('Update user error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update user' },
    });
  }
}

export async function deleteUser(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = req.params;

    // Don't allow deleting yourself
    if (id === req.user?.id) {
      return res.status(400).json({
        error: { code: 'CANNOT_DELETE_SELF', message: 'Cannot delete your own account' },
      });
    }

    await prisma.user.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      });
    }
    
    console.error('Delete user error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete user' },
    });
  }
}