import { Router } from "express";
const router = Router();
import { getAllTournamentLevels, createTournamentLevel, getTournamentLevelById, updateTournamentLevel, deleteTournamentLevel } from "../controllers/tournamentLevel.controller.js";
import { isAuthenticated, isUser, isAdmin } from '../middleware/auth.middleware.js';

router.get("/", getAllTournamentLevels);
router.post("/", isAuthenticated, isAdmin, createTournamentLevel);
router.get("/:id", getTournamentLevelById);
router.put("/:id", isAuthenticated, isAdmin, updateTournamentLevel);
router.delete("/:id", isAuthenticated, isAdmin, deleteTournamentLevel);

export default router;