import { Router } from "express";
const router = Router();
import { getAllSurfaces, createSurface, getSurfaceById, updateSurface, deleteSurface } from "../controllers/surface.controller.js";
import { isAuthenticated, isUser, isAdmin } from '../middleware/auth.middleware.js';

router.get("/", getAllSurfaces);
router.post("/", isAuthenticated, isAdmin, createSurface);
router.get("/:id", getSurfaceById);
router.put("/:id", isAuthenticated, isAdmin, updateSurface);
router.delete("/:id", isAuthenticated, isAdmin, deleteSurface);

export default router;
