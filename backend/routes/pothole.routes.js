import { Router } from 'express';
import { uploadPotholes, getAllPotholes, updatePothole, getPotholeStats } from '../controllers/pothole.controller.js';

const router = Router();

router.post('/upload', uploadPotholes);
router.get('/', getAllPotholes);
router.get('/stats', getPotholeStats);
router.patch('/:id', updatePothole);

export default router;

