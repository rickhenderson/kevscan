import { Router } from 'express';
import healthCheck from './health-check.js';
import uploadRouter from './upload.js';
import scanRouter from './scan.js';
import cisaSyncRouter from './cisa-sync.js';
import exportRouter from './export.js';
import scheduleConfigRouter from './schedule-config.js';

const router = Router();

export default () => {
    router.get('/health', healthCheck);
    router.use('/upload', uploadRouter);
    router.use('/scan', scanRouter);
    router.use('/cisa-kev-sync', cisaSyncRouter);
    router.use('/export-scan', exportRouter);
    router.use('/schedule-config', scheduleConfigRouter);

    return router;
};