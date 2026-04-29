import { Router } from 'express';
import { searchUsers, leaveTeam, kickMember, getAllUsers, updateUserRole } from '../controllers/userController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.get('/search', authenticate, searchUsers);
router.post('/leave-team', authenticate, leaveTeam);
router.post('/kick-member', authenticate, kickMember);
router.get('/', authenticate, getAllUsers);
router.patch('/role', authenticate, updateUserRole);

export default router;
