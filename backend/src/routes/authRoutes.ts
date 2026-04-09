import { Router } from 'express';
import { signup, login, joinTeam } from '../controllers/authController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/join-team', authenticate, joinTeam);

export default router;
