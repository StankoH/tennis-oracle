import express from "express";
import { getTournamentEventsByDay } from "../controllers/tournamentEventDay.controller.js";

const router = express.Router();

router.get("/by-date/:date", getTournamentEventsByDay);

export default router;