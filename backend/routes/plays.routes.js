import { Router } from "express";
const router = Router();
import { getAllPlays, createPlays, getPlaysById, updatePlays, deletePlays } from "../controllers/plays.controller.js";
import { isAuthenticated, isUser, isAdmin } from '../middleware/auth.middleware.js';

router.get("/", getAllPlays);
router.post("/", isAuthenticated, isAdmin, createPlays);
router.get("/:id", getPlaysById);
router.put("/:id", isAuthenticated, isAdmin, updatePlays);
router.delete("/:id", isAuthenticated, isAdmin, deletePlays);

export default router;
