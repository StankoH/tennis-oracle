import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Putevi
const inputCsv = path.join(__dirname, 'data', 'playerDetails.csv');
const outputDir = path.join(__dirname, '..', '..', 'data', 'playerDetails');

// 2. Konverzija vrijednosti
function parseValue(value) {
  if (value === undefined || value.trim() === '') return null;
  const num = Number(value);
  return isNaN(num) ? value.trim() : num;
}

// 3. Konverzija cijelog reda
function parseRow(row) {
  const parsed = {};
  for (const [key, value] of Object.entries(row)) {
    parsed[key] = parseValue(value);
  }
  return parsed;
}

// 4. Osiguraj da direktorij postoji
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 5. Obradi jedan red
const processRow = (row) => {
  const playerIdRaw = row.playerId || row.playerTPId || row.id || row.ID;
  if (!playerIdRaw) {
    console.warn('⚠️  Preskačem red bez playerId');
    return;
  }

  const playerId = playerIdRaw.trim();
  const playerJson = parseRow(row);

  const tempJsonPath = path.join(outputDir, `${playerId}.json`);
  const archivePath = path.join(outputDir, `${playerId}.json.7z`);

  fs.writeFileSync(tempJsonPath, JSON.stringify(playerJson, null, 2));

  const sevenZipPath = `"C:\\Program Files\\7-Zip\\7z.exe"`;

  exec(`${sevenZipPath} a -t7z "${archivePath}" "${tempJsonPath}"`, (err) => {
    if (err) {
      console.error(`❌ Greška za igrača ${playerId}:`, err.message);
    } else {
      fs.unlink(tempJsonPath, () => {});
      console.log(`✔️ player ${playerId} komprimiran.`);
    }
  });
};

// 6. Pokreni CSV obradu
fs.createReadStream(inputCsv)
  .pipe(csv({ separator: ',' }))
  .on('data', processRow)
  .on('end', () => {
    console.log('✅ Gotova obrada svih igrča iz CSV-a.');
  });
