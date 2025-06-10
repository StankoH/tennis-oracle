import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Putanje
const inputCsv = path.join(__dirname, 'data', 'playersMatches.csv');
const outputDir = path.join(__dirname, '..', '..', 'data', 'playerMatches');
const sevenZipPath = `"C:\\Program Files\\7-Zip\\7z.exe"`;

// Osiguraj direktorij
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

let currentPlayerId = null;
let currentRows = [];
let headers = [];

function parseValue(value) {
  if (value === undefined || value.trim() === '') return null;
  const num = Number(value);
  return isNaN(num) ? value.trim() : num;
}

function writeAndCompress(playerId, rows) {
  if (!playerId || rows.length === 0) return;

  const jsonArray = rows.map(row => {
    const obj = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]] = parseValue(row[i]);
    }
    return obj;
  });

  const tempJsonPath = path.join(outputDir, `${playerId}.json`);
  const archivePath = `${tempJsonPath}.7z`;

  fs.writeFileSync(tempJsonPath, JSON.stringify(jsonArray, null, 2));

  exec(`${sevenZipPath} a -t7z "${archivePath}" "${tempJsonPath}"`, (err) => {
    if (err) {
      console.error(`❌ Greška za igrača ${playerId}:`, err.message);
    } else {
      fs.unlink(tempJsonPath, () => {});
      console.log(`✔️ Igrač ${playerId} komprimiran.`);
    }
  });
}

fs.createReadStream(inputCsv)
  .pipe(csv({ separator: ',' }))
  .on('headers', (csvHeaders) => {
    headers = csvHeaders.slice(1); // bez playerTPId
  })
  .on('data', (row) => {
    const playerId = row['playerTPId'];
    if (!playerId) return;

    const rowValues = Object.values(row).slice(1); // bez playerTPId

    if (playerId !== currentPlayerId) {
      writeAndCompress(currentPlayerId, currentRows);
      currentPlayerId = playerId;
      currentRows = [];
    }

    currentRows.push(rowValues);
  })
  .on('end', () => {
    writeAndCompress(currentPlayerId, currentRows);
    console.log('✅ Gotova obrada svih igrača.');
  });