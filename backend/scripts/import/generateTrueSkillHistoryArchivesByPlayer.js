import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const inputCsv = path.join(__dirname, 'data', 'matchDetails.csv');
const outputDir = path.join(__dirname, '../../data/trueskill');
const sevenZipPath = `"C:\\Program Files\\7-Zip\\7z.exe"`;

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function parseNumber(value) {
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

function createRecord(playerTPId, dateTime, meanM, meanSM, meanGSM, sdM, sdSM, sdGSM) {
  const parsedMeanM = parseNumber(meanM);
  const parsedMeanSM = parseNumber(meanSM);
  const parsedMeanGSM = parseNumber(meanGSM);
  const parsedSDM = parseNumber(sdM);
  const parsedSDSM = parseNumber(sdSM);
  const parsedSDGSM = parseNumber(sdGSM);

  if (
    [parsedMeanM, parsedMeanSM, parsedMeanGSM, parsedSDM, parsedSDSM, parsedSDGSM].includes(null)
  ) {
    return null;
  }

  return {
    playerTPId,
    dateTime: new Date(dateTime),
    mean: Math.round(((parsedMeanM + parsedMeanSM + parsedMeanGSM) / 3) * 100) / 100,
    sd: Math.round(((parsedSDM + parsedSDSM + parsedSDGSM) / 3) * 100) / 100
  };
}

const grouped = {};

const processRow = (row) => {
  const record1 = createRecord(
    parseInt(row.player1TPId),
    row.dateTime,
    row.player1TrueSkillMeanOldM,
    row.player1TrueSkillMeanOldSM,
    row.player1TrueSkillMeanOldGSM,
    row.player1TrueSkillStandardDeviationOldM,
    row.player1TrueSkillStandardDeviationOldSM,
    row.player1TrueSkillStandardDeviationOldGSM
  );

  const record2 = createRecord(
    parseInt(row.player2TPId),
    row.dateTime,
    row.player2TrueSkillMeanOldM,
    row.player2TrueSkillMeanOldSM,
    row.player2TrueSkillMeanOldGSM,
    row.player2TrueSkillStandardDeviationOldM,
    row.player2TrueSkillStandardDeviationOldSM,
    row.player2TrueSkillStandardDeviationOldGSM
  );

  if (record1) {
    if (!grouped[record1.playerTPId]) grouped[record1.playerTPId] = [];
    grouped[record1.playerTPId].push(record1);
  }

  if (record2) {
    if (!grouped[record2.playerTPId]) grouped[record2.playerTPId] = [];
    grouped[record2.playerTPId].push(record2);
  }
};

fs.createReadStream(inputCsv)
  .pipe(csv({ separator: ',' }))
  .on('data', processRow)
  .on('end', () => {
    console.log(`✅ Grupirano igrača: ${Object.keys(grouped).length}`);
    for (const [playerTPId, records] of Object.entries(grouped)) {
      const jsonPath = path.join(outputDir, `player-${playerTPId}.json`);
      const archivePath = `${jsonPath}.7z`;

      // 🧠 Provjera postoji li već arhiva
      if (fs.existsSync(archivePath)) {
        console.log(`⏭️  Arhiva za player-${playerTPId} već postoji. Preskačem.`);
        continue;
      }

      fs.writeFileSync(jsonPath, JSON.stringify(records, null, 2));

      exec(`${sevenZipPath} a -t7z "${archivePath}" "${jsonPath}"`, (err) => {
        if (err) {
          console.error(`❌ Greška za igrača ${playerTPId}:`, err.message);
        } else {
          fs.unlink(jsonPath, () => {});
          console.log(`✔️ Player ${playerTPId} komprimiran.`);
        }
      });
    }
  });