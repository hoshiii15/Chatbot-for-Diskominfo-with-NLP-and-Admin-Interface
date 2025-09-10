import { Router } from 'express';
import { authMiddleware, requireEditor } from '../middleware/auth';
import * as faqController from '../controllers/faqController';

const router = Router();

// Public endpoints
router.get('/debug/files', faqController.debugFiles);
router.get('/file', faqController.fileFaqsDebug);
router.get('/:env/categories', faqController.getCategories);
router.get('/:env', faqController.getFaqsByEnv);
router.get('/', faqController.getFaqs);

// Protected endpoints
router.post('/', authMiddleware, requireEditor, faqController.createFaq);
router.put('/:id', authMiddleware, requireEditor, faqController.updateFaq);
router.delete('/:id', authMiddleware, requireEditor, faqController.deleteFaq);

export default router;
