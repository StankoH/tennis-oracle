import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Putevi
const inputCsv = path.join(__dirname, 'data', 'matchDetails.csv');
const outputDir = 'd:\\Development\\My Projects\\TennisOracle\\backend\\data\\matchDetails';

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
  const matchIdRaw = row.matchId || row.matchTPId || row.id || row.ID;
  if (!matchIdRaw) {
    console.warn('⚠️  Preskačem red bez matchId');
    return;
  }

  const matchId = matchIdRaw.trim();
  const archivePath = path.join(outputDir, `${matchId}.json.7z`);

  // ✨ Provjera postoji li već arhiva
  if (fs.existsSync(archivePath)) {
    console.log(`⏭️  Arhiva za meč ${matchId} već postoji. Preskačem.`);
    return;
  }

  // Ako ne postoji, nastavi s generiranjem
  const matchJson = parseRow(row);
  const tempJsonPath = path.join(outputDir, `${matchId}.json`);
  fs.writeFileSync(tempJsonPath, JSON.stringify(matchJson, null, 2));

  const sevenZipPath = `"C:\\Program Files\\7-Zip\\7z.exe"`;

  exec(`${sevenZipPath} a -t7z "${archivePath}" "${tempJsonPath}"`, (err) => {
    if (err) {
      console.error(`❌ Greška za meč ${matchId}:`, err.message);
    } else {
      fs.unlink(tempJsonPath, () => {});
      console.log(`✔️ Match ${matchId} komprimiran.`);
    }
  });
};

// 6. Pokreni CSV obradu
fs.createReadStream(inputCsv)
  .pipe(csv({ separator: ',' }))
  .on('data', processRow)
  .on('end', () => {
    console.log('✅ Gotova obrada svih mečeva iz CSV-a.');
  });
