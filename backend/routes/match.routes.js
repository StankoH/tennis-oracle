import { Router } from "express";
const router = Router();
import {
  filterMatchesByDateRange,
  getAllMatches,
  createMatch,
  getMatchById,
  updateMatch,
  deleteMatch,
  getMatchesByDate,
  getPaginatedMatches,
  filterMatches,
  getMatchDateRange,
  getAvailableDates,
  getPaginatedMatchSummariesByDate,
} from "../controllers/match.controller.js";

import { isAuthenticated, isUser, isAdmin } from '../middleware/auth.middleware.js';

// 🔓 Osnovni dostupni endpointi
router.get("/summaries/by-date/:date", getPaginatedMatchSummariesByDate);
router.get("/available-dates", getAvailableDates);
router.get("/daterange", getMatchDateRange);
router.get("/filter", filterMatches);
router.get("/filter-by-date-range", filterMatchesByDateRange);
router.get("/paginated", getPaginatedMatches);
router.get("/", getAllMatches);
router.get("/by-date/:date", getMatchesByDate);

// 👤 Admin funkcionalnosti
router.post("/", isAuthenticated, isAdmin, createMatch);
router.put("/:id", isAuthenticated, isAdmin, updateMatch);
router.delete("/:id", isAuthenticated, isAdmin, deleteMatch);
router.get("/:id", getMatchById);

export default router;