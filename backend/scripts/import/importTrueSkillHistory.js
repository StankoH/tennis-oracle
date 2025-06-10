import dotenv from 'dotenv';
import { createReadStream } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import { disconnect } from 'mongoose';
import TrueSkillHistory from '../../models/TrueSkillHistory.model.js';
import connectDB from '../../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Eksplicitno specificiraj path do .env datoteke
dotenv.config({ path: join(__dirname, '../../.env') });

const filePath = join(__dirname, 'data', 'matchDetails.csv');
const BATCH_SIZE = 1000;
const buffer = [];

let totalRows = 0;
let validRecords = 0;

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
    console.warn(`⚠️ Invalid data for player ${playerTPId} at ${dateTime}`, {
      meanM, meanSM, meanGSM, sdM, sdSM, sdGSM
    });
    return null;
  }

  return {
    playerTPId,
    dateTime: new Date(dateTime),
    mean: Math.round(((parsedMeanM + parsedMeanSM + parsedMeanGSM) / 3) * 100) / 100,
    sd: Math.round(((parsedSDM + parsedSDSM + parsedSDGSM) / 3) * 100) / 100
  };
}


const importTrueSkillHistory = async () => {
  try {
    await connectDB();

    createReadStream(filePath)
      .pipe(csv())
      .on('data', async (row) => {
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
        totalRows++;
        if (record1) validRecords++;
        if (record2) validRecords++;
        if (!record1 && !record2) {
          console.warn("⛔ No valid records in row:", row.dateTime, row.player1TPId, row.player2TPId);
        }
        if (record1) {
          buffer.push(record1);
          console.log("✅ Record1:", record1);
        }

        if (record2) {
          buffer.push(record2);
          console.log("✅ Record2:", record2);
        }

        if (buffer.length >= BATCH_SIZE) {
          await TrueSkillHistory.insertMany(buffer);
          console.log(`💾 Inserted batch of ${buffer.length} records`);
          buffer.length = 0;
        }
      })
      
      .on('end', async () => {
        if (buffer.length > 0) {
          await TrueSkillHistory.insertMany(buffer);
          console.log(`Inserted final ${buffer.length} records`);
        }
        console.log('✅ CSV import finished');
        console.log(`🏁 Finished processing ${totalRows} rows`);
        console.log(`📥 Valid records ready for insert: ${validRecords}`);
        disconnect();
      });
  } catch (err) {
    console.error('❌ Error during import:', err.message);
    disconnect();
  }
};

importTrueSkillHistory();