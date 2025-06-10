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
import mongoose from 'mongoose';
import Match from './models/match.model.js';
import matchCollectionRoutes from './routes/match.routes.js';
import tournamentEventDayRoutes from "./routes/tournamentEventDay.routes.js";
import matchDetailsRoutes  from "./routes/matchdetails.routes.js";
import trueSkillRoutes from './routes/trueSkill.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(json());
app.use(urlencoded({ extended: true }));
connectDB();

await Match.syncIndexes();

app.use(cors({
  origin: 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use("/api/countries", countryRoutes);
app.use("/api/plays", playsRoutes);
app.use("/api/surfaces", surfaceRoutes);
app.use("/api/tournamentTypes", tournamentTypeRoutes);
app.use("/api/tournamentLevels", tournamentLevelRoutes);
app.use("/api/tournamentEvents", tournamentEventRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/matches", matchRoutes);
app.use(passport.initialize());
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/uploads', express.static(path.join(process.cwd(), '/uploads')));
app.use('/api', matchCollectionRoutes);
app.use("/api/tournamenteventdays", tournamentEventDayRoutes);
app.use('/api/match-details', matchDetailsRoutes);
app.use('/api/trueskill', trueSkillRoutes);

app.use((req, res, next) => {
  console.warn(`[404] Nepoznata ruta: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'Ruta nije pronađena' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} 🚀`);
});