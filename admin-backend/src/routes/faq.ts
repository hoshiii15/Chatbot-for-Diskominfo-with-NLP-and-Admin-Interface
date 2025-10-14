import { Router } from 'express';
import { authMiddleware, requireEditor } from '../middleware/auth';
import * as faqController from '../controllers/faqController';

const router = Router();

// Public endpoints
router.get('/debug/files', faqController.debugFiles);
router.get('/file', faqController.fileFaqsDebug);
router.get('/:env/categories', faqController.getCategories);
// audit log for category changes
router.get('/categories/audit', authMiddleware, requireEditor, faqController.getCategoryAudit);
// category management
router.post('/:env/categories', authMiddleware, requireEditor, faqController.createCategory);
router.put('/:env/categories', authMiddleware, requireEditor, faqController.renameCategory);
router.delete('/:env/categories', authMiddleware, requireEditor, faqController.deleteCategory);
router.get('/:env', faqController.getFaqsByEnv);
router.get('/', faqController.getFaqs);

// Protected endpoints
router.post('/', authMiddleware, requireEditor, faqController.createFaq);
router.put('/:id', authMiddleware, requireEditor, faqController.updateFaq);
router.delete('/:id', authMiddleware, requireEditor, faqController.deleteFaq);

export default router;
