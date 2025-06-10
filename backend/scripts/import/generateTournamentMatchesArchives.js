import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Putanje
const inputCsv = path.join(__dirname, 'data', 'tournamentMatches.csv');
const outputDir = path.join(__dirname, '..', '..', 'data', 'tournamentMatches');
const sevenZipPath = `"C:\\Program Files\\7-Zip\\7z.exe"`;

// Osiguraj direktorij
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

let currentTournamentId = null;
let currentRows = [];
let headers = [];

function parseValue(value) {
  if (value === undefined || value.trim() === '') return null;
  const num = Number(value);
  return isNaN(num) ? value.trim() : num;
}

function writeAndCompress(tournamentId, rows) {
  if (!tournamentId || rows.length === 0) return;

  const jsonArray = rows.map(row => {
    const obj = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]] = parseValue(row[i]);
    }
    return obj;
  });

  const tempJsonPath = path.join(outputDir, `${tournamentId}.json`);
  const archivePath = `${tempJsonPath}.7z`;

  fs.writeFileSync(tempJsonPath, JSON.stringify(jsonArray, null, 2));

  exec(`${sevenZipPath} a -t7z "${archivePath}" "${tempJsonPath}"`, (err) => {
    if (err) {
      console.error(`❌ Greška za turnir ${tournamentId}:`, err.message);
    } else {
      fs.unlink(tempJsonPath, () => {});
      console.log(`✔️ Turnir ${tournamentId} komprimiran.`);
    }
  });
}

fs.createReadStream(inputCsv)
  .pipe(csv({ separator: ',' }))
  .on('headers', (csvHeaders) => {
    headers = csvHeaders.slice(1).map(h => h.replace(/^"|"$/g, ''));
  })
  .on('data', (row) => {
    const tournamentId = row['tournamentEventTPId'];
    if (!tournamentId) return;

    const rowValues = Object.values(row).slice(1);

    if (tournamentId !== currentTournamentId) {
      writeAndCompress(currentTournamentId, currentRows);
      currentTournamentId = tournamentId;
      currentRows = [];
    }

    currentRows.push(rowValues);
  })
  .on('end', () => {
    writeAndCompress(currentTournamentId, currentRows);
    console.log('✅ Gotova obrada svih igrača.');
  });