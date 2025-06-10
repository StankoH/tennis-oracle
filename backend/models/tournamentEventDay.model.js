import { Schema, model } from "mongoose";

const tournamentEventDaySchema = new Schema({
  tournamentEventId: { type: Number, required: true },
  matchDate: { type: Date, required: true },
  tournamentEventName: { type: String, required: true },

  countryTPId: Number,
  countryISO2: String,
  countryISO3: String,
  countryFull: String,

  tournamentLevelId: Number,
  tournamentLevel: String,
  tournamentTypeId: Number,
  tournamentType: String,

  surfaceId: Number,
  surface: String,

  prize: String,
  matches: Number
});

export default model("TournamentEventDay", tournamentEventDaySchema);