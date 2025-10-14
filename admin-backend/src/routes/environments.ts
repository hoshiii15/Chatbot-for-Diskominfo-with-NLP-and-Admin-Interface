import { Router } from 'express';
import { authMiddleware, requireEditor } from '../middleware/auth';
import * as envController from '../controllers/environmentsController';

const router = Router();

router.get('/', envController.listEnvironments);
router.post('/', authMiddleware, requireEditor, envController.createEnvironment);
router.put('/', authMiddleware, requireEditor, envController.renameEnvironment);
router.delete('/:name', authMiddleware, requireEditor, envController.deleteEnvironment);

export default router;
