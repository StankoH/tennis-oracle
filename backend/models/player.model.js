import { Schema, model } from "mongoose";

const playerSchema = new Schema({
  _id: { type: Number, required: true }, // PlayerTPId
  playerName: { type: String, required: true },
  countryTPId: { type: Number },
  countryISO2: { type: String },
  countryISO3: { type: String },
  countryFull: { type: String },
  playerBirthDate: { type: Date },
  age: { type: Number },
  playerHeight: { type: Number },
  playerWeight: { type: Number },
  playerTurnedPro: { type: Number },
  playsId: { type: Number },
  plays: { type: String },
  tournamentTypeId: { type: Number },
  tournamentType: { type: String }, 
  winRatio: { type: Number },
  matches: { type: Number },
  trueSkillMean: { type: Number },
  careerTrueSkillMean: { type: Number }
}, { timestamps: false });

// 📈 Indeksi za grid prikaz
playerSchema.index({ playerName: 1 });
playerSchema.index({ plays: 1 });
playerSchema.index({ winRatio: -1 });
playerSchema.index({ matches: -1 });
playerSchema.index({ trueSkillMean: -1 });
playerSchema.index({ careerTrueSkillMean: -1 });

export const schema = playerSchema;
export default model("Player", playerSchema, "players");
