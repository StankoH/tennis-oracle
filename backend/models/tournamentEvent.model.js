import { Schema, model } from "mongoose";

const tournamentEventSchema = new Schema({
  _id: { type: Number, required: true }, // koristiš TPID kao _id — super
  tournamentEventName: { type: String, required: false, minlength: 0, maxlength: 100 },
  tournamentEventDate: { type: Date, required: true },

  // Reference
  countryTPId: { type: Number, ref: "Country", required: false },
  tournamentLevelId: { type: Number, ref: "TournamentLevel", required: true },
  tournamentTypeId: { type: Number, ref: "TournamentType", required: true },
  surfaceId: { type: Number, ref: "Surface" },

  // Denormalizirano
  countryISO2: { type: String },
  countryISO3: { type: String },
  countryFull: { type: String },

  surface: { type: String },
  tournamentLevel: { type: String },
  tournamentType: { type: String },

  prize: { type: String },
  matches: { type: Number }
});

export default model("TournamentEvent", tournamentEventSchema);
