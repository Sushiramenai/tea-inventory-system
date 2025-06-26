import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { loginSchema } from '../utils/validation';

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.get('/session', requireAuth, authController.getSession);
router.post('/refresh', authController.refreshSession);

export default router;