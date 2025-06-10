import User from '../models/user.model.js';
import FavouritePlayer from '../models/favouritePlayer.model.js';
import FavouriteMatch from '../models/favouriteMatch.model.js';

// ✅ GET PROFILE
export const getUserProfile = async (req, res) => {
    try {
        console.log('bla');
      const user = await User.findById(req.user.id).populate('country', 'countryISO3 countryISO2 countryFull');
  
      if (!user) return res.status(404).json({ message: 'Korisnik nije pronađen.' });
  
      res.status(200).json({
        id: user._id,
        name: user.name,
        nickname: user.nickname,
        email: user.email,
        avatarUrl: user.avatarUrl || null,
        country: user.country || null,
      });
    } catch (err) {
      console.error('Greška kod dohvaćanja profila:', err);
      res.status(500).json({ message: 'Nešto je pošlo po zlu.' });
    }
  };
  
  export const updateUserProfile = async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
  
      if (!user) return res.status(404).json({ message: 'Korisnik nije pronađen.' });
      console.log('dohvacamo podatke o korisniku iz requesta');
  
      user.name = req.body.name || user.name;
      user.nickname = req.body.nickname || user.nickname;
      user.country = req.body.country || user.country;
      user.avatarUrl = req.file
      ? `/uploads/${req.file.filename}`
      : req.body.avatarUrl || user.avatarUrl;
  
      await user.save();
  
      console.log('pocinjemo updateanje korisnika');
      console.log(req.body.country);
      const updatedUser = await User.findById(req.user.id).populate('country', 'countryISO3 countryISO2 countryFull');
  
      res.status(200).json({
        message: 'Profil ažuriran.',
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          nickname: updatedUser.nickname,
          email: updatedUser.email,
          avatarUrl: updatedUser.avatarUrl || null,
          country: updatedUser.country || null,
        },
      });
    } catch (err) {
      console.error('Greška kod ažuriranja profila:', err);
      res.status(500).json({ message: 'Nešto je pošlo po zlu.' });
    }
  };

  export const addFavouritePlayer = async (req, res) => {
    const { playerTPId } = req.params;
  
    try {
      const exists = await FavouritePlayer.findOne({
        userId: req.user._id,
        playerTPId: Number(playerTPId)
      });
  
      if (exists) {
        return res.status(400).json({ message: 'Player already in favourites' });
      }
  
      const fav = await FavouritePlayer.create({
        userId: req.user._id,
        playerTPId: Number(playerTPId)
      });
  
      res.status(201).json(fav);
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  };

  export const deleteFavouritePlayer = async (req, res) => {
    const { playerTPId } = req.params;
  
    try {
      const removed = await FavouritePlayer.findOneAndDelete({ userId: req.user._id, playerTPID: playerTPId });
  
      if (!removed) {
        return res.status(404).json({ message: 'Player not found in favourites' });
      }
  
      res.json({ message: 'Player removed from favourites' });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  };

  export const getFavouritePlayers = async (req, res) => {
    try {
      const favourites = await FavouritePlayer.find({ userId: req.user._id });
      res.json(favourites);
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  };

  export const addFavouriteMatch = async (req, res) => {
    const { matchTPId } = req.params; // tip: String iz URL-a
  
    try {
      const exists = await FavouriteMatch.findOne({
        userId: req.user._id, // ovo protect middleware dodaje
        matchTPId: Number(matchTPId) // dodaj konverziju!
      });
  
      if (exists) {
        return res.status(400).json({ message: 'Match is already in favourites' });
      }
  
      const fav = await FavouriteMatch.create({
        userId: req.user._id,
        matchTPId: Number(matchTPId)
      });
  
      res.status(201).json(fav);
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  };
  
  export const deleteFavouriteMatch = async (req, res) => {
    const { matchTPId } = req.params;
  
    try {
      const removed = await FavouriteMatch.findOneAndDelete({ userId: req.user._id, matchTPId });
  
      if (!removed) {
        return res.status(404).json({ message: 'Match not found in favourites' });
      }
  
      res.json({ message: 'Match removed from favourites' });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  };

  export const getFavouriteMatches = async (req, res) => {
    try {
      const favourites = await FavouriteMatch.find({ userId: req.user._id });
      res.json(favourites);
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  };