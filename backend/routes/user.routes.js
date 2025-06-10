import express from 'express';
import protect from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';
import {
  updateUserProfile,
  getUserProfile,
  addFavouritePlayer,
  deleteFavouritePlayer,
  getFavouritePlayers,
  addFavouriteMatch,
  deleteFavouriteMatch,
  getFavouriteMatches
} from '../controllers/user.controller.js';
import {
  addPick,
  removePick,
  getMyPicks
} from '../controllers/pick.controller.js';

const router = express.Router();

router.get('/getUserProfile', protect, getUserProfile);
router.put('/updateUserProfile', protect, updateUserProfile);
// router.post('/favourites/players/:playerTPId', protect, addFavouritePlayer);
// router.get('/favourites/players', protect, getFavouritePlayers);
// router.delete('/favourites/players/:playerTPId', protect, deleteFavouritePlayer);
//router.post('/favourites/matches/:matchTPId', protect, addFavouriteMatch);
//router.get('/favourites/matches', protect, getFavouriteMatches);
//router.delete('/favourites/matches/:matchTPId', protect, deleteFavouriteMatch);
// router.post("/pick/:matchTPId", protect, addPick);
// router.delete("/pick/:matchTPId", protect, removePick);
// router.get("/my-picks", protect, getMyPicks);

// ruta za avatar upload
router.patch('/updateUserProfile', protect, upload.single('avatar'), updateUserProfile);

export default router;
