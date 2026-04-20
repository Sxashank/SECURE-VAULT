import { Router } from 'express';
import { uploadDocument, getDocuments, deleteDocument } from '../controllers/documentController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.post('/upload', authenticate, uploadDocument);
router.get('/', authenticate, getDocuments);
router.delete('/:id', authenticate, deleteDocument);

export default router;
