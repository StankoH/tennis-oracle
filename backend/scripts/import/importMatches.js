import dotenv from "dotenv";
import { createReadStream } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { pipeline } from "stream/promises";
import csv from "csv-parser";
import { disconnect } from "mongoose";
import Match from "../../models/match.model.js";
import connectDB from "../../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../../.env") });

const toNumber = (val) => {
  const num = Number(val?.trim());
  return isNaN(num) ? undefined : num;
};

const toDate = (val) => {
  const d = new Date(val?.trim());
  return isNaN(d.getTime()) ? undefined : d;
};

const toStringSafe = (val) => {
  return typeof val === 'string' ? val.trim() : '';
};

const BATCH_SIZE = 1000;

const importMatches = async () => {
  try {
    await connectDB();
    console.log("📡 Connected to DB");

    const filePath = join(__dirname, "data", "match.csv");
    const readStream = createReadStream(filePath).pipe(csv());

    const batch = [];
    let totalInserted = 0;

    for await (const data of readStream) {
      const match = {
        _id: toNumber(data.matchTPId),
        dateTime: toDate(data.dateTime),
        tournamentEventTPId: toNumber(data.tournamentEventTPId),
        tournamentEventCountryTPId: toNumber(data.tournamentEventCountryTPId),
        tournamentEventCountryISO2: toStringSafe(data.tournamentEventCountryISO2),
        tournamentEventCountryISO3: toStringSafe(data.tournamentEventCountryISO3),
        tournamentEventCountryFull: toStringSafe(data.tournamentEventCountryFull),
        tournamentEventName: toStringSafe(data.tournamentEventName),
        surfaceId: toNumber(data.surfaceId),
        surface: toStringSafe(data.surface),
        tournamentLevelId: toNumber(data.tournamentLevelId),
        tournamentLevel: toStringSafe(data.tournamentLevel),
        tournamentTypeId: toNumber(data.tournamentTypeId),
        tournamentType: toStringSafe(data.tournamentType),
        player1TPId: toNumber(data.player1TPId),
        player1CountryTPId: toNumber(data.player1CountryTPId),
        player1CountryISO2: toStringSafe(data.player1CountryISO2),
        player1CountryISO3: toStringSafe(data.player1CountryISO3),
        player1CountryFull: toStringSafe(data.player1CountryFull),
        player1Name: toStringSafe(data.player1Name),
        player2TPId: toNumber(data.player2TPId),
        player2CountryTPId: toNumber(data.player2CountryTPId),
        player2CountryISO2: toStringSafe(data.player2CountryISO2),
        player2CountryISO3: toStringSafe(data.player2CountryISO3),
        player2CountryFull: toStringSafe(data.player2CountryFull),
        player2Name: toStringSafe(data.player2Name),
        result: toStringSafe(data.result),
        resultDetails: toStringSafe(data.resultDetails),
        player1Odds: toNumber(data.player1Odds),
        player2Odds: toNumber(data.player2Odds),
        prize: toNumber(data.prize),
        winProbabilityPlayer1NN: toNumber(data.winProbabilityPlayer1NN),
        winProbabilityPlayer2NN: toNumber(data.winProbabilityPlayer2NN),
        valueMarginPlayer1: toNumber(data.valueMarginPlayer1),
        valueMarginPlayer2: toNumber(data.valueMarginPlayer2),
        who2Bet: toNumber(data.who2Bet)
      };

      if (match._id !== undefined) {
        batch.push(match);
      }

      if (batch.length >= BATCH_SIZE) {
        await Match.insertMany(batch, { ordered: false });
        totalInserted += batch.length;
        console.log(`✅ Inserted batch of ${batch.length} matches (total so far: ${totalInserted})`);
        batch.length = 0;
      }
    }

    if (batch.length > 0) {
      await Match.insertMany(batch, { ordered: false });
      totalInserted += batch.length;
      console.log(`✅ Inserted remaining ${batch.length} matches (total: ${totalInserted})`);
    }

    console.log(`🎉 All matches imported successfully. Final total: ${totalInserted}`);
  } catch (err) {
    console.error("❌ Import error:", err.message);
  } finally {
    await disconnect();
    console.log("🔌 Disconnected from DB");
  }
};

importMatches();