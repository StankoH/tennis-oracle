import dotenv from "dotenv";
import { createReadStream } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import csv from "csv-parser";
import { disconnect } from "mongoose";
import Player from "../../models/player.model.js";
import PlayerATP from "../../models/playeratp.model.js";
import PlayerWTA from "../../models/playerwta.model.js";
import connectDB from "../../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../../.env") });

const clean = (val) => {
  if (typeof val !== "string") return val;
  return val.trim();
};

const toNumber = (val) => {
  const num = Number(clean(val));
  return isNaN(num) ? undefined : num;
};

const toDate = (val) => {
  const d = new Date(clean(val));
  return isNaN(d.getTime()) ? undefined : d;
};

const toStringSafe = (val) => {
  const str = clean(val);
  return str === "" ? undefined : str;
};

const BATCH_SIZE = 1000;

const importPlayers = async () => {
  try {
    await connectDB();
    console.log("📡 Connected to DB");

    const filePath = join(__dirname, "data", "player.csv");

    const batch = [];
    const batchATP = [];
    const batchWTA = [];
    let totalInserted = 0;

    const readStream = createReadStream(filePath).pipe(csv());
    for await (const data of readStream) {
      const player = {
        _id: toNumber(data.playerTPId),
        playerName: toStringSafe(data.playerName),
        countryTPId: toNumber(data.countryTPId),
        countryISO2: toStringSafe(data.countryISO2),
        countryISO3: toStringSafe(data.countryISO3),
        countryFull: toStringSafe(data.countryFull),
        playerBirthDate: toDate(data.playerBirthDate),
        age: toNumber(data.age),
        playerHeight: toNumber(data.playerHeight),
        playerWeight: toNumber(data.playerWeight),
        playerTurnedPro: toNumber(data.playerTurnedPro),
        playsId: toNumber(data.playsId),
        plays: toStringSafe(data.plays),
        tournamentTypeId: toNumber(data.tournamentTypeId),
        tournamentType: toStringSafe(data.tournamentType),
        winRatio: toNumber(data.winRatio),
        matches: toNumber(data.matches),
        trueSkillMean: toNumber(data.trueSkillMean),
        careerTrueSkillMean: toNumber(data.careerTrueSkillMean),
      };

      if (player._id !== undefined) {
        batch.push(player);

        if (player.tournamentTypeId === 2) {
          batchATP.push(player);
        } else if (player.tournamentTypeId === 4) {
          batchWTA.push(player);
        }
      }

      if (batch.length >= BATCH_SIZE) {
        await Player.insertMany(batch, { ordered: false });
        await PlayerATP.insertMany(batchATP, { ordered: false });
        await PlayerWTA.insertMany(batchWTA, { ordered: false });

        totalInserted += batch.length;
        console.log(`✅ Inserted batch of ${batch.length} players (total so far: ${totalInserted})`);

        batch.length = 0;
        batchATP.length = 0;
        batchWTA.length = 0;
      }
    }

    // Insert remaining
    if (batch.length > 0) {
      await Player.insertMany(batch, { ordered: false });
      await PlayerATP.insertMany(batchATP, { ordered: false });
      await PlayerWTA.insertMany(batchWTA, { ordered: false });

      totalInserted += batch.length;
      console.log(`✅ Inserted remaining ${batch.length} players (total: ${totalInserted})`);
    }

    console.log(`🎉 All players imported successfully. Final total: ${totalInserted}`);
  } catch (err) {
    console.error("❌ Import error:", err.message);
  } finally {
    await disconnect();
    console.log("🔌 Disconnected from DB");
  }
};

importPlayers();
