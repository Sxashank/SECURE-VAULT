import { Router } from 'express';
import { searchUsers } from '../controllers/userController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.get('/search', authenticate, searchUsers);

export default router;
