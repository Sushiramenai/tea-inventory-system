import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { loginSchema } from '../utils/validation';

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.get('/session', requireAuth, authController.getSession);
router.get('/me', requireAuth, authController.getSession);
router.post('/refresh', authController.refreshSession);

// Debug endpoint to check session without auth middleware
router.get('/check-session', (req, res) => {
  res.json({
    hasSession: !!req.session,
    sessionId: req.sessionID,
    userId: req.session?.userId,
    isAuthenticated: !!req.session?.userId,
    cookie: req.headers.cookie,
    sessionData: process.env.NODE_ENV === 'development' ? req.session : undefined
  });
});

export default router;