import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../constants/enums';
import { prisma } from '../utils/prisma';

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  if (!req.session.userId) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId, isActive: true },
    });

    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid session' } });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Authentication error' } });
  }
}

export function requireRole(...roles: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    // First check if user is authenticated
    if (!req.session.userId) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: req.session.userId, isActive: true },
      });

      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid session' } });
      }

      req.user = user;

      // Then check if user has required role
      if (!roles.includes(user.role as UserRole)) {
        return res.status(403).json({ 
          error: { 
            code: 'FORBIDDEN', 
            message: 'Insufficient permissions',
            details: { requiredRoles: roles, userRole: user.role }
          } 
        });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Authorization error' } });
    }
  };
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    return next();
  }

  prisma.user.findUnique({
    where: { id: req.session.userId, isActive: true },
  })
  .then(user => {
    req.user = user || undefined;
    next();
  })
  .catch(error => {
    console.error('Optional auth error:', error);
    next();
  });
}