import express from 'express';
import { registerUser, loginUser, logoutUser, verifyEmail, forgotPassword, resetPassword, resendVerificationEmail, contactUs, getCurrentUser, getMe, requestResetPassword, updateUserProfile } from '../controllers/auth.controller.js';
import protect from '../middleware/auth.middleware.js';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import generateToken from '../utils/generateToken.js';
import path from 'path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname); // npr. '.png' ili '.jpg'
    const uniqueName = uuidv4() + ext;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only .jpg and .png formats are allowed.'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  }
});

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', protect, logoutUser);
router.post('/verify-email', verifyEmail);
router.post('/forgotPassword', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/request-reset-password', requestResetPassword);
router.post('/resend-verification', resendVerificationEmail);
router.post('/contact', contactUs);
router.get('/me', protect, getMe);
router.post('/update', protect, upload.single('avatar'), updateUserProfile);


router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));
router.get('/facebook', passport.authenticate('facebook', {
  scope: ['profile', 'email'],
}));

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id, isAdmin: req.user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Redirekcija natrag na frontend – za sad samo token kao query param
    res.redirect(`http://localhost:4200/oauth-success?token=${token}`);
  }
);

// Početak Facebook login procesa
router.get('/facebook',
  passport.authenticate('facebook', { scope: 'public_profile,email' })
);

// Callback nakon Facebook login-a
router.get('/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const token = generateToken(req.user._id);
    res.redirect(`http://localhost:4200/oauth-success?token=${token}`);
  }
);

router.get('/nickname-exists/:nickname', async (req, res) => {
  const existing = await User.findOne({ nickname: req.params.nickname });
  res.json(!!existing);
});

console.log('Auth rute učitane');
export default router;