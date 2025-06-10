import { Router } from 'express';
const router = Router();
import { getMatchDetailsById } from '../controllers/matchdetails.controller.js';

router.get('/:matchTPId', getMatchDetailsById);

export default router;