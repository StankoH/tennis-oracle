import { Router } from 'express';
const router = Router();
import { getMatchDetailsById } from '../controllers/matchdetails.controller.js';

router.get('/:matchTPId', getMatchDetailsById);
console.log('Files here:', fs.readdirSync(path.join(__dirname, '../data/matchDetails')).slice(0,10));
export default router;