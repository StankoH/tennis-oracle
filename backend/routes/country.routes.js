import { Router } from "express";
const router = Router();
import { getAllCountries, createCountry, getCountryById, updateCountry, deleteCountry } from "../controllers/country.controller.js";
import { isAuthenticated, isUser, isAdmin } from '../middleware/auth.middleware.js';

router.get("/", getAllCountries);
router.post("/", isAuthenticated, isAdmin, createCountry);
router.get("/:id", getCountryById);
router.put("/:id", isAuthenticated, isAdmin, updateCountry);
router.delete("/:id", isAuthenticated, isAdmin, deleteCountry);

export default router;
