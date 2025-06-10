import { Schema, model } from "mongoose";

const playerSchema = new Schema({
  _id: { type: Number, required: true }, //TPID
  playerName: { type: String, required: true },
  countryTPId: { type: Number, ref: "Country", required: false },
  playerBirthDate: { type: Date, required: false },
  playerHeight: { type: Number, required: false },
  playerWeight: { type: Number, required: false },
  playerTurnedPro: { type: Number, required: false },
  playsId: { type: Number, ref: "Plays", required: false },
  trueSkillMean: { type: Number, ref: "TrueSkillMean", required: false },
  careerTrueSkillMean: { type: Number, ref: "CareerTrueSkillMean", required: false },
  trueSkill: {
    overall: {
      meanM: { type: Number, required: false },
      SDM: { type: Number, required: false },
      meanSM: { type: Number, required: false },
      SDSM: { type: Number, required: false },
      meanGSM: { type: Number, required: false },
      SDGSM: { type: Number, required: false }
    },
    bySurface: {
      type: Map,
      of: new Schema({
        meanM: Number,
        SDM: Number,
        meanSM: Number,
        SDSM: Number,
        meanGSM: Number,
        SDGSM: Number
      }),
      default: {}
    }
  },
  performanceStats: {
    matches: {
      total: {
        wins: { type: Number, default: 0 },
        losses: { type: Number, default: 0 }
      },
      lastYear: {
        wins: { type: Number, default: 0 },
        losses: { type: Number, default: 0 }
      },
      lastMonth: {
        wins: { type: Number, default: 0 },
        losses: { type: Number, default: 0 }
      },
      lastWeek: {
        wins: { type: Number, default: 0 },
        losses: { type: Number, default: 0 }
      },
      bySurface: {
        type: Map,
        of: new Schema({
          total: {
            wins: { type: Number, default: 0 },
            losses: { type: Number, default: 0 }
          },
          lastYear: {
            wins: { type: Number, default: 0 },
            losses: { type: Number, default: 0 }
          },
          lastMonth: {
            wins: { type: Number, default: 0 },
            losses: { type: Number, default: 0 }
          },
          lastWeek: {
            wins: { type: Number, default: 0 },
            losses: { type: Number, default: 0 }
          }
        }),
        default: {}
      }
    },
    sets: {
      total: { wins: Number, losses: Number },
      lastYear: { wins: Number, losses: Number },
      lastMonth: { wins: Number, losses: Number },
      lastWeek: { wins: Number, losses: Number },
      bySurface: {
        type: Map,
        of: new Schema({
          total: { wins: Number, losses: Number },
          lastYear: { wins: Number, losses: Number },
          lastMonth: { wins: Number, losses: Number },
          lastWeek: { wins: Number, losses: Number }
        }),
        default: {}
      }
    },
    games: {
      total: { wins: Number, losses: Number },
      lastYear: { wins: Number, losses: Number },
      lastMonth: { wins: Number, losses: Number },
      lastWeek: { wins: Number, losses: Number },
      bySurface: {
        type: Map,
        of: new Schema({
          total: { wins: Number, losses: Number },
          lastYear: { wins: Number, losses: Number },
          lastMonth: { wins: Number, losses: Number },
          lastWeek: { wins: Number, losses: Number }
        }),
        default: {}
      }
    },
    streak: {
      current: { type: Number, default: 0 },
      bySurface: {
        type: Map,
        of: Number,
        default: {}
      }
    },
    dateSince: {
      lastWin: { type: Date },
      lastLoss: { type: Date },
      bySurface: {
        type: Map,
        of: new Schema({
          lastWin: Date,
          lastLoss: Date
        }),
        default: {}
      }
    },
    winProbabilities: {
      favourite: {
        totalWins: Number,
        avgWinProb: Number,
        avgLossProb: Number
      },
      underdog: {
        totalWins: Number,
        avgWinProb: Number,
        avgLossProb: Number
      },
      lastYear: {
        favourite: {
          totalWins: Number,
          avgWinProb: Number,
          avgLossProb: Number
        },
        underdog: {
          totalWins: Number,
          avgWinProb: Number,
          avgLossProb: Number
        }
      },
      lastMonth: {
        favourite: {
          totalWins: Number,
          avgWinProb: Number,
          avgLossProb: Number
        },
        underdog: {
          totalWins: Number,
          avgWinProb: Number,
          avgLossProb: Number
        }
      },
      lastWeek: {
        favourite: {
          totalWins: Number,
          avgWinProb: Number,
          avgLossProb: Number
        },
        underdog: {
          totalWins: Number,
          avgWinProb: Number,
          avgLossProb: Number
        }
      }
    }
  }
});

export default model("Player", playerSchema);