import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { generateToken, generateVerificationToken } from '../utils/generateToken.js';
import sendVerificationEmail from '../utils/sendVerificationEmail.js';
import sendResetPasswordEmail from '../utils/sendResetPasswordEmail.js';
import sendEmail from '../utils/sendEmail.js';

// ✅ Helper funkcija za slanje odgovora s greškom
const handleError = (res, statusCode, message) => {
  return res.status(statusCode).json({ message });
};

// ✅ REGISTER
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, country } = req.body;

    if (!name || !email || !password) {
      return handleError(res, 400, 'All Fields are Mandatory');
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (!existingUser.password) {
        const salt = await bcrypt.genSalt(10);
        existingUser.password = await bcrypt.hash(password, salt);
        existingUser.name = existingUser.name || name;
        if (!existingUser.provider.includes('local')) {
          existingUser.provider.push('local');
        }
        await existingUser.save();

        const verificationToken = generateVerificationToken(existingUser._id);
        await sendVerificationEmail(existingUser.email, existingUser, verificationToken);

        return res.status(200).json({ message: 'Password Addes, Verify Through Your Email Verification Link' });
      } else {
        return res.status(400).json({ message: 'User with this Email Allready Exist' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password,
      country,
      provider: ['local'],
      createdVia: 'manual',
      isUser: false,
    });

    await user.save();

    const verificationToken = generateVerificationToken(user._id);
    await sendVerificationEmail(user.email, user, verificationToken);
    return res.status(201).json({ message: 'Registration Succesfull. Verify Your Account' });

  } catch (error) {
    console.error('Greška u registerUser:', error);
    res.status(500).json({ message: 'Something get Wrong' });
  }
};

// ✅ LOGIN
export const loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    console.log(identifier);
    console.log(password);
    // 1. Validacija ulaza
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Email or Username are Mandatory' });
    }

    // 2. Nađi korisnika
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { nickname: identifier },
      ],
    }).populate('country', 'countryISO3 countryISO2 countryFull');

    //console.log(user);

    if (!user) {
      return res.status(404).json({
        message: 'User with thi Email doesn\'t exist',
        reason: 'user_not_found'
      });
    }

    // 3. Ako nema lozinku (Google login)
    if (!user.password) {
      return res.status(400).json({
        message: 'This user registered with Google. Sign in with Google',
      });
    }

    // 4. Provjera lozinke
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Incorrect password',
        offerPasswordReset: true,
      });
    }

    // 5. Provjera je li verificiran
    //console.log('User found:', user);
    console.log('user.isUser =', user.isUser);
    if (!user.isUser) {
      console.log("The User is not Verified");
      res.status(403);
      return res.json({
        message: 'Email is not Verified.',
        offerResendVerification: true,
        userId: user._id,
      });
    }

    // ✅ 6. Ažuriraj login podatke
    user.lastLogin = new Date();
    user.isOnline = true;
    await user.save();

    // 7. Generiraj token
    const token = generateToken(user._id);

    // 8. Vrati podatke
    return res.status(200).json({
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        nickname: user.nickname,
        email: user.email,
        isAdmin: user.isAdmin,
        isOnline: user.isOnline,
        lastLogin: user.lastLogin,
        avatarUrl: user.avatarUrl || null,
        country: user.country || null,
      },
    });

  } catch (error) {
    console.error('[LOGIN ERROR]:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// ✅ LOGOUT
export const logoutUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isOnline = false;
    await user.save();

    return res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('[LOGOUT ERROR]:', error);
    res.status(500).json({ message: 'Error while logging out' });
  }
};

// ✅ VERIFY EMAIL
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return handleError(res, 404, 'User not found');

    user.isVerified = true;
    user.isUser = true;
    await user.save();

    res.status(200).json({ message: 'Email successfully verified' });

  } catch (error) {
    console.error('[VERIFY EMAIL ERROR]:', error);
    handleError(res, 400, 'The token is invalid or has expired');
  }
};

// ✅ RESEND VERIFY EMAIL
export const resendVerificationEmail = async (req, res) => {
  try {
    console.log("start verification");
    const { email } = req.body;
    console.log('[RESEND] Email primljen:', email); // <-- sada ok

    const user = await User.findOne({ email });
    console.log('[RESEND] User pronađen:', user);

    if (!user) {
      return res.status(400).json({ message: 'The user does not exist' });
    }

    if (user.isUser) {
      return res.status(400).json({ message: 'The account is already verified' });
    }

    const token = generateVerificationToken(user._id);
    console.log('[RESEND] Token generiran:', token);

    await sendVerificationEmail(user.email, user, token);
    console.log('[RESEND] Email poslan');

    return res.status(200).json({ message: 'Verification email resent' });

  } catch (error) {
    console.error('[RESEND VERIFICATION ERROR]:', error);
    res.status(500).json({ message: 'Error sending verification' });
  }
};

export async function login(req, res) {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, isUser: user.isUser, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // token vrijedi 7 dana
    );

    res.json({ token });

  } catch (error) {
    console.error('Greška u login:', error);
    res.status(500).json({ message: 'Error during login' });
  }
}

export async function forgotPassword(req, res) {
  console.log('Pozvana funkcija forgotPassword');
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'A user with that email address does not exist' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 3600000; // 1 sat

    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;
    await user.save();

    const resetUrl = `http://localhost:4200/reset-password?token=${token}&email=${email}`;
    const message = `
      <p>To reset your password, click on the link below:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>The link is valid for 1 hour</p>
    `;

    console.log('Reset Token:', token);

    await sendEmail({
      to: email,
      subject: 'Password reset - Bonzobyte',
      html: message
    });

    res.json({ message: 'Password reset email has been sent' });

  } catch (err) {
    console.error('Greška u forgotPassword:', err);
    res.status(500).json({ message: 'Error sending email' });
  }
}

export async function contactUs(req, res) {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const htmlMessage = `
    <h3>New message from the contact form</h3>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Message:</strong></p>
    <p>${message}</p>
  `;

  try {
    await sendEmail({
      to: 'noreply@bonzobyte.com', // ili bilo koja adresa na koju želiš primati poruke
      subject: `Contact message from ${name}`,
      html: htmlMessage
    });

    res.json({ message: 'The message was sent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error sending message' });
  }
}

export async function resetPassword(req, res) {
  const { token, email, password } = req.body;

  if (!token || !email || !password) {
    return res.status(400).json({ message: 'Token, email and new password are required' });
  }

  try {
    const user = await User.findOne({
      email: email,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    //const salt = await bcrypt.genSalt(10);
    user.password = password;//await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();  // obavezno await i save()

    res.json({ message: 'Password successfully changed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while resetting the password' });
  }
}

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('country', 'countryISO3 countryISO2 countryFull');

    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        nickname: user.nickname,
        email: user.email,
        isAdmin: user.isAdmin,
        isOnline: user.isOnline,
        lastLogin: user.lastLogin,
        avatarUrl: user.avatarUrl || null,
        country: user.country || null,
      },
    });
  } catch (err) {
    console.error('Greška kod dohvaćanja korisnika:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const requestResetPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "The user with this email does not exist" });
    }
    const token = jwt.sign({ email: user.email, id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // Token vrijedi 1 sat
    await user.save();

    // POŠALJI EMAIL
    await sendResetPasswordEmail(user.email, user);

    res.status(200).json({ message: "Password reset link sent" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error sending password reset link" });
  }
};

export const getMe = (req, res) => {
  res.status(200).json({ user: req.user });
};

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { nickname } = req.body;

    const updatedData = { nickname };

    if (req.file) {
      updatedData.avatarUrl = `${process.env.BASE_URL}/uploads/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updatedData, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user: updatedUser });
  } catch (err) {
    console.error(err);
  
    if (err.code === 11000 && err.keyPattern?.nickname) {
      return res.status(409).json({ message: 'That username is already taken' });
    }
  
    res.status(500).json({ message: 'Error updating user profile.' });
  }
};