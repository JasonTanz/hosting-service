import * as express from 'express';
import hostController from '../controllers/host.controller';
import hostMiddleware from '../middlewares/host.middleware';
const router = express.Router();

router.post(
  '/create',
  hostMiddleware.getExistingHost,
  hostController.createHost,
);
router.get('/:containerName', hostController.getHostByContainerName);

export default router;
