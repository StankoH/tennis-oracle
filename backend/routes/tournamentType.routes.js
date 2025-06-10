import { Router } from "express";
const router = Router();
import { getAllTournamentTypes, createTournamentType, getTournamentTypeById, updateTournamentType, deleteTournamentType } from "../controllers/tournamentType.controller.js";
import { isAuthenticated, isUser, isAdmin } from '../middleware/auth.middleware.js';

router.get("/", getAllTournamentTypes);
router.post("/", isAuthenticated, isAdmin, createTournamentType);
router.get("/:id", getTournamentTypeById);
router.put("/:id", isAuthenticated, isAdmin, updateTournamentType);
router.delete("/:id", isAuthenticated, isAdmin, deleteTournamentType);

export default router;