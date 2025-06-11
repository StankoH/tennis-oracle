import fs from 'fs';
import path from 'path';

const debugPath = path.join(process.cwd(), 'backend/data/matchDetails');
try {
  const files = fs.readdirSync(debugPath);
  console.log('🧪 [DEBUG] matchDetails folder contains:', files.slice(0, 10));
} catch (err) {
  console.error('🧪 [DEBUG] Failed to read matchDetails folder:', err);
}