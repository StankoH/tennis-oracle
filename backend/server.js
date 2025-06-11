import dotenv from "dotenv";
import express, { json, urlencoded } from "express";
import connectDB from "./config/db.js";
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
import passport from 'passport';
import './config/passport.js';
import path from 'path';
import cors from 'cors';
import Match from './models/match.model.js';
import matchCollectionRoutes from './routes/match.routes.js';
import tournamentEventDayRoutes from "./routes/tournamentEventDay.routes.js";
import matchDetailsRoutes from "./routes/matchdetails.routes.js";
import trueSkillRoutes from './routes/trueSkill.routes.js';

dotenv.config();

const app = express();

// ⚠️ PORT mora doći iz okoline (Render koristi process.env.PORT)
const PORT = process.env.PORT || 3000;

// ✅ CORS dopušta GitHub Pages i lokalni dev
const allowedOrigins = [
  'https://stankoh.github.io',         // GitHub Pages
  'http://localhost:4200',             // Angular lokalno
  'http://localhost:5000'              // eventualno drugi dev port
];

app.use(json());
app.use(urlencoded({ extended: true }));

// ✅ Middleware za CORS
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

// ✅ Passport
app.use(passport.initialize());

// ✅ Statika (uploadi)
app.use('/uploads', express.static(path.join(process.cwd(), '/uploads')));

// ✅ API rute
app.use("/api/countries", countryRoutes);
app.use("/api/plays", playsRoutes);
app.use("/api/surfaces", surfaceRoutes);
app.use("/api/tournamentTypes", tournamentTypeRoutes);
app.use("/api/tournamentLevels", tournamentLevelRoutes);
app.use("/api/tournamentEvents", tournamentEventRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/matches", matchRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api', matchCollectionRoutes);
app.use("/api/tournamenteventdays", tournamentEventDayRoutes);
app.use('/api/match-details', matchDetailsRoutes);
app.use('/api/trueskill', trueSkillRoutes);

// ✅ 404 fallback za nepoznate rute
app.use((req, res) => {
  console.warn(`[404] Nepoznata ruta: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'Ruta nije pronađena' });
});

// ✅ Async start servera (potrebno za `await`)
const startServer = async () => {
  try {
    await connectDB();
    await Match.syncIndexes(); // ⚠️ ovo možeš maknuti u produkciji ako ne trebaš

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Greška prilikom pokretanja servera:', err.message);
    process.exit(1);
  }
};

startServer();
