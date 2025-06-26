import { Router } from 'express';
import * as usersController from '../controllers/users.controller';
import { requireRole } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createUserSchema, updateUserSchema } from '../utils/validation';
import { UserRole } from '../constants/enums';

const router = Router();

// All user management routes require admin role
router.use(requireRole(UserRole.admin));

router.get('/', usersController.getUsers);
router.post('/', validate(createUserSchema), usersController.createUser);
router.put('/:id', validate(updateUserSchema), usersController.updateUser);
router.delete('/:id', usersController.deleteUser);

export default router;