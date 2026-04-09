import { Router } from 'express';
import { getAuditLogs, getSuspiciousActivity, getTeamInsights } from '../controllers/auditController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', authenticate, getAuditLogs);
router.get('/suspicious', authenticate, getSuspiciousActivity);
router.get('/team', authenticate, getTeamInsights);

export default router;
