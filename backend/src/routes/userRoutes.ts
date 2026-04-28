import { Router } from 'express';
import { searchUsers, leaveTeam, kickMember } from '../controllers/userController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.get('/search', authenticate, searchUsers);
router.post('/leave-team', authenticate, leaveTeam);
router.post('/kick-member', authenticate, kickMember);

export default router;
