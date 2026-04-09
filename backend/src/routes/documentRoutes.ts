import { Router } from 'express';
import { uploadDocument, getDocuments } from '../controllers/documentController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.post('/upload', authenticate, uploadDocument);
router.get('/', authenticate, getDocuments);

export default router;
