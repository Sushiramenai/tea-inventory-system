import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { verifyPassword } from '../utils/password';
import { loginSchema } from '../utils/validation';

export async function login(req: Request, res: Response): Promise<Response | void> {
  try {
    const { username, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username },
        ],
        isActive: true,
      },
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password' },
      });
    }

    req.session.userId = user.id;
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({
          error: { code: 'SESSION_ERROR', message: 'Failed to create session' },
        });
      }

      return res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Login failed' },
    });
  }
}

export async function logout(req: Request, res: Response): Promise<Response | void> {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({
        error: { code: 'LOGOUT_ERROR', message: 'Failed to logout' },
      });
    }
    return res.json({ message: 'Logged out successfully' });
  });
}

export async function getSession(req: Request, res: Response): Promise<Response> {
  if (!req.user) {
    return res.status(401).json({
      error: { code: 'NO_SESSION', message: 'Not authenticated' },
    });
  }

  return res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
    },
  });
}

export async function refreshSession(req: Request, res: Response): Promise<Response> {
  if (!req.session.userId) {
    return res.status(401).json({
      error: { code: 'NO_SESSION', message: 'Not authenticated' },
    });
  }

  req.session.touch();
  return res.json({ message: 'Session refreshed' });
}