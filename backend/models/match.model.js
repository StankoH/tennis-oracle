import { Schema, model } from "mongoose";

const matchSchema = new Schema({
  _id: { type: Number, required: true },
  dateTime: { type: Date, required: true },
  tournamentEventTPId: { type: Number, required: true },
  tournamentEventCountryTPId: { type: Number },
  tournamentEventCountryISO2: { type: String },
  tournamentEventCountryISO3: { type: String },
  tournamentEventCountryFull: { type: String },
  tournamentEventName: { type: String },
  surfaceId: { type: Number },
  surface: { type: String },
  tournamentLevelId: { type: Number },
  tournamentLevel: { type: String },
  tournamentTypeId: { type: Number },
  tournamentType: { type: String },
  player1TPId: { type: Number, required: true },
  player1CountryTPId: { type: Number },
  player1CountryISO2: { type: String },
  player1CountryISO3: { type: String },
  player1CountryFull: { type: String },
  player1Name: { type: String },
  player2TPId: { type: Number, required: true },
  player2CountryTPId: { type: Number },
  player2CountryISO2: { type: String },
  player2CountryISO3: { type: String },
  player2CountryFull: { type: String },
  player2Name: { type: String },
  result: { type: String },
  resultDetails: { type: String },
  player1Odds: { type: Number },
  player2Odds: { type: Number },
  prize: { type: Number },
  winProbabilityPlayer1NN: { type: Number },
  winProbabilityPlayer2NN: { type: Number },
  valueMarginPlayer1: { type: Number },
  valueMarginPlayer2: { type: Number },
  who2Bet: { type: Number },
}, { timestamps: false });

// Indeksi za filtraciju i performanse
matchSchema.index({ surfaceId: 1, dateTime: -1 });
// matchSchema.index({ surfaceId: 1 });
// matchSchema.index({ tournamentTypeId: 1, dateTime: -1 });
// matchSchema.index({ tournamentLevelId: 1, dateTime: -1 });
// matchSchema.index({ player1TPId: 1 });
// matchSchema.index({ player2TPId: 1 });
// matchSchema.index({ player1Name: "text", player2Name: "text", tournamentEventName: "text" });

const Match = model('Match', matchSchema, 'matches');
export default Match;
