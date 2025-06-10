import dotenv from "dotenv";
import { createReadStream } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import csv from "csv-parser";
import { disconnect } from "mongoose";
import TournamentEvent from "../../models/tournamentEvent.model.js";
import connectDB from "../../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../../.env") });

const loadLookup = async (filename, keyField) => {
  const map = new Map();
  const filePath = join(__dirname, "data", filename);
  return new Promise((resolve, reject) => {
    createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        const key = Number(row[keyField]?.trim());
        if (!isNaN(key)) {
          map.set(key, row);
        }
      })
      .on("end", () => resolve(map))
      .on("error", reject);
  });
};

const importTournamentEvents = async () => {
  try {
    await connectDB();
    console.log("📡 Connected to DB");

    // 🗺️ Load lookup tables
    const [countries, surfaces, levels, types] = await Promise.all([
      loadLookup("country.csv", "countryTPId"),
      loadLookup("surface.csv", "surfaceTPId"),
      loadLookup("tournamentLevel.csv", "tournamentLevelTPId"),
      loadLookup("tournamentType.csv", "tournamentTypeTPId"),
    ]);

    const filePath = join(__dirname, "data", "tournamentEvent.csv");
    const results = [];

    createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        const tpid = Number(data.tournamentEventTPId?.trim());
        if (isNaN(tpid)) return;

        const tournamentEventDate = new Date(data.tournamentEventDate?.trim());

        const countryId = Number(data.countryTPId?.trim());
        const country = countries.get(countryId);

        const surfaceId = Number(data.surfaceId?.trim());
        const surface = surfaces.get(surfaceId);

        const levelId = Number(data.tournamentLevelId?.trim());
        const level = levels.get(levelId);

        const typeId = Number(data.tournamentTypeId?.trim());
        const type = types.get(typeId);

        const tournamentEvent = {
          _id: tpid,
          tournamentEventDate,
          tournamentEventName: data.tournamentEventName?.trim(),
          countryTPId: isNaN(countryId) ? undefined : countryId,
          countryISO2: country?.countryISO2 || '',
          countryISO3: country?.countryISO3 || '',
          countryFull: country?.countryFull || '',
          tournamentTypeId: isNaN(typeId) ? undefined : typeId,
          tournamentType: data.tournamentType?.trim() || '',
          tournamentLevelId: isNaN(levelId) ? undefined : levelId,
          tournamentLevel: data.tournamentLevel?.trim() || '',
          surfaceId: isNaN(surfaceId) ? undefined : surfaceId,
          surface: data.surface?.trim() || '',
          prize: data.prize,
          matches: isNaN(data.matches) ? undefined : data.matches,
        };

        results.push(tournamentEvent);
      })
      .on("end", async () => {
        try {
          await TournamentEvent.deleteMany({});
          await TournamentEvent.insertMany(results);
          console.log(`✅ Imported ${results.length} tournament events`);
        } catch (err) {
          console.error("❌ DB insert error:", err.message);
        } finally {
          await disconnect();
          console.log("🔌 Disconnected from DB");
        }
      });
  } catch (err) {
    console.error("❌ Import error:", err);
    await disconnect();
  }
};

importTournamentEvents();
