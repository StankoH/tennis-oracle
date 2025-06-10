import dotenv from "dotenv";
import { createReadStream } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import csv from "csv-parser";
import { disconnect } from "mongoose";
import TournamentEventDay from "../../models/tournamentEventDay.model.js";
import connectDB from "../../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../../.env") });

const importTournamentEventDays = async () => {
  try {
    await connectDB();
    console.log("📡 Connected to DB");

    const filePath = join(__dirname, "data", "tournamentEventsByDays.csv");
    const results = [];

    createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        const tournamentEventId = Number(data.tournamentEventTPId?.trim());
        const matchDate = new Date(data.matchDate?.trim());

        if (isNaN(tournamentEventId) || isNaN(matchDate.getTime())) return;

        const eventDay = {
          tournamentEventId,
          matchDate,
          tournamentEventName: data.tournamentEventName?.trim(),

          countryTPId: Number(data.countryTPId) || undefined,
          countryISO2: data.countryISO2?.trim(),
          countryISO3: data.countryISO3?.trim(),
          countryFull: data.countryFull?.trim(),

          tournamentLevelId: Number(data.tournamentLevelId) || undefined,
          tournamentLevel: data.tournamentLevel?.trim(),

          tournamentTypeId: Number(data.tournamentTypeId) || undefined,
          tournamentType: data.tournamentType?.trim(),

          surfaceId: Number(data.surfaceId) || undefined,
          surface: data.surface?.trim(),

          prize: data.prize?.trim(),
          matches: Number(data.matches) || 0
        };

        results.push(eventDay);
      })
      .on("end", async () => {
        try {
          await TournamentEventDay.deleteMany({});
          await TournamentEventDay.insertMany(results);
          console.log(`✅ Imported ${results.length} tournament event day entries`);
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

importTournamentEventDays();