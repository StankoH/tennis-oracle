import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

router.get('/:matchTPId', getMatchDetailsById);

// Debug log
const debugPath = path.join(__dirname, '../data/matchDetails');
try {
  const files = fs.readdirSync(debugPath);
  console.log('🧪 [DEBUG] matchDetails folder contents:', files.slice(0, 10));
} catch (err) {
  console.error('🧪 [DEBUG] cannot access matchDetails:', err.message);
}

export default router;
