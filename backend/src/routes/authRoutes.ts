import { Router } from 'express';
import { signup, login, joinTeam, createTeam } from '../controllers/authController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/join-team', authenticate, joinTeam);
router.post('/create-team', authenticate, createTeam);

export default router;
