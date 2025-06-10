import { Router } from "express";
const router = Router();

import {
  getPaginatedTournamentSummariesByDate,
  getAvailableTournamentDates,
  getTournamentDateRange,
  filterTournamentEvents,
  filterTournamentEventsByDateRange,
  getPaginatedTournamentEvents,
} from "../controllers/tournamentEvent.controller.js";

import { isAuthenticated, isUser, isAdmin } from '../middleware/auth.middleware.js';

// 🔓 Osnovni dostupni endpointi
router.get("/summaries/by-date/:date", getPaginatedTournamentSummariesByDate);
router.get("/available-dates", getAvailableTournamentDates);
router.get("/daterange", getTournamentDateRange);
router.get("/filter", filterTournamentEvents);
router.get("/filter-by-date-range", filterTournamentEventsByDateRange);
 router.get("/paginated", getPaginatedTournamentEvents);
// router.get("/", getAllTournamentEvents);

// 👤 Admin funkcionalnosti
// router.post("/", isAuthenticated, isAdmin, createTournamentEvent);
// router.put("/:id", isAuthenticated, isAdmin, updateTournamentEvent);
// router.delete("/:id", isAuthenticated, isAdmin, deleteTournamentEvent);
// router.get("/:id", getTournamentEventById);

export default router;
