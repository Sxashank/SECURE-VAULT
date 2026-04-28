import { Router } from 'express';
import { uploadDocument, getDocuments, deleteDocument, getDocumentContent, commitDocumentVersion, getDocumentLogs } from '../controllers/documentController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', authenticate, getDocuments);
router.post('/upload', authenticate, uploadDocument);
router.delete('/:id', authenticate, deleteDocument);
router.get('/:id/content', authenticate, getDocumentContent);
router.post('/:id/versions', authenticate, commitDocumentVersion);
router.get('/:id/logs', authenticate, getDocumentLogs);

export default router;
