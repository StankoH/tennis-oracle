// server.js
import dotenv from "dotenv";
import express, { json, urlencoded } from "express";
import path from "path";
import cors from "cors";
import passport from "passport";

import connectDB from "./config/db.js";
import './config/passport.js';

// Rute
import countryRoutes from "./routes/country.routes.js";
import playsRoutes from "./routes/plays.routes.js";
import surfaceRoutes from "./routes/surface.routes.js";
import tournamentTypeRoutes from "./routes/tournamentType.routes.js";
import tournamentLevelRoutes from "./routes/tournamentLevel.routes.js";
import tournamentEventRoutes from "./routes/tournamentEvent.routes.js";
import playerRoutes from "./routes/player.routes.js";
import matchRoutes from "./routes/match.routes.js";
import userRoutes from './routes/user.routes.js';
import authRoutes from './routes/auth.routes.js';
import matchCollectionRoutes from './routes/match.routes.js';
import tournamentEventDayRoutes from "./routes/tournamentEventDay.routes.js";
import matchDetailsRoutes from "./routes/matchdetails.routes.js";
import trueSkillRoutes from './routes/trueSkill.routes.js';

dotenv.config();

const app = express();

// ✅ Port koji Render traži da dođe iz okoline
const PORT = process.env.PORT || 3000;

// ✅ CORS dopušta samo definirane izvore (GitHub Pages i lokalni dev)
const allowedOrigins = [
  'https://stankoh.github.io',
  'http://localhost:4200',
  'http://localhost:5000'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// ✅ Parsiranje tijela
app.use(json());
app.use(urlencoded({ extended: true }));

// ✅ Passport init
app.use(passport.initialize());

// ✅ Statika za uploadane fajlove
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ✅ API rute
app.use("/api/countries", countryRoutes);
app.use("/api/plays", playsRoutes);
app.use("/api/surfaces", surfaceRoutes);
app.use("/api/tournamentTypes", tournamentTypeRoutes);
app.use("/api/tournamentLevels", tournamentLevelRoutes);
app.use("/api/tournamentEvents", tournamentEventRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/matches", matchRoutes); // glavni match endpointi
app.use("/api", matchCollectionRoutes); // ako imaš dodatne /api/matches/... rute
app.use("/api/tournamenteventdays", tournamentEventDayRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/match-details", matchDetailsRoutes);
app.use("/api/trueskill", trueSkillRoutes);

// ✅ 404 fallback
app.use((req, res) => {
  console.warn(`[404] Nepoznata ruta: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'Ruta nije pronađena' });
});

// ✅ Pokretanje servera
const startServer = async () => {
  try {
    await connectDB();

    // ⚠️ Ako koristiš syncIndexes zbog inicijalizacije indeksa – ostavi
    // import Match from './models/match.model.js';
    // await Match.syncIndexes();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on 0.0.0.0:${PORT}`);
    });

  } catch (err) {
    console.error('❌ Greška prilikom pokretanja servera:', err.message);
    process.exit(1);
  }
};

startServer();