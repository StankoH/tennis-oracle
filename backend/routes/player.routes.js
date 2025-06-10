import { Router } from "express";
const router = Router();
import { getAllPlayers, createPlayer, getPlayerById, updatePlayer, deletePlayer, getPaginatedPlayers, getPlayerWithMatches, searchPlayers, getTrueSkillTimelineForPlayers } from "../controllers/player.controller.js";
import { isAuthenticated, isUser, isAdmin } from '../middleware/auth.middleware.js';

router.get("/search", searchPlayers);
router.get("/paginated", getPaginatedPlayers);
router.get("/", getAllPlayers);
router.post("/", isAuthenticated, isAdmin, createPlayer);
router.get('/trueskill-timeline', getTrueSkillTimelineForPlayers);
router.get("/:id", getPlayerById);
router.put("/:id", isAuthenticated, isAdmin, updatePlayer);
router.delete("/:id", isAuthenticated, isAdmin, deletePlayer);
router.get("/:id/matches", getPlayerWithMatches );

export default router;