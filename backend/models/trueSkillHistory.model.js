import { Schema, model, mongoose } from 'mongoose';

const trueSkillHistorySchema = new Schema({
  playerTPId: { type: Number, required: true },
  dateTime: { type: Date, required: true },
  mean: { type: Number, required: true },
  sd: { type: Number, required: true }
}, { timestamps: false });

trueSkillHistorySchema.index({ playerTPId: 1, dateTime: 1 });

const TrueSkillHistory = mongoose.models.TrueSkillHistory || mongoose.model('TrueSkillHistory', trueSkillHistorySchema, 'trueskillhistories');

export default TrueSkillHistory;