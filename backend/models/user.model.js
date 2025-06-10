import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  // ✅ Osnovni podaci
  name: { type: String, required: true, trim: true },
  nickname: { type: String, trim: true, unique: true, sparse: true }, // alias / username
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },

  // ✅ Autentikacija
  password: {
    type: String,
    required: function () { return !this.googleId; },
  },
  country: {
    type: Number,
    ref: 'Country',
  },
  googleId: { type: String, unique: true, sparse: true },
  facebookId: { type: String, default: null, sparse: true },
  createdVia: { type: String, enum: ['manual', 'google', 'facebook'], default: 'manual' },
  provider: { type: [String], default: [] },

  // ✅ Uloge i statusi
  isAdmin: { type: Boolean, default: false },
  isUser: { type: Boolean, default: false },
  isOnline: { type: Boolean, default: false }, // možeš postavljati ručno ili preko socket.io

  // ✅ Dodatni korisnički info (neobavezno)
  avatarUrl: { type: String, default: null },
  countryTPId: { type: Number, ref: "Country" },
  gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
  dateOfBirth: { type: Date },
  lastLogin: { type: Date }, // updatea se nakon uspješne prijave

  // ✅ Player povezivanje (ako ima ulogu igrača)
  player1TPId: { type: Number, ref: "Player" },
  player2TPId: { type: Number, ref: "Player" },

  // ✅ Za reset lozinke
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  tokenVersion: { type: Number, default: 0 },
}, { timestamps: true });

// 🛡️ Hashiraj lozinku ako je promijenjena
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

const User = mongoose.model('User', userSchema);
export default User;