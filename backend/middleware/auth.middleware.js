import dotenv from 'dotenv';
import express, { json, urlencoded } from "express";
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

dotenv.config();

const app = express();
app.use(json());
app.use(urlencoded({ extended: true }));

const protect = async (req, res, next) => {
  let token;

  // Provjera postoji li Authorization header i počinje li s 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      console.log('HEADERS:', req.headers);
      console.log('TOKEN:', req.headers.authorization);
      console.log('JWT_SECRET from middleware:', process.env.JWT_SECRET);
      // Izvuci token (npr. iz "Bearer asdf.qwer.zxcv")
      token = req.headers.authorization.split(' ')[1];

      console.log('[VERIFY] JWT_SECRET:', process.env.JWT_SECRET);
      // Verificiraj token -> dobijemo payload iznutra (userId u našem slučaju)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token payload:', decoded);

      // Na osnovu payloada dohvatimo korisnika iz baze
      req.user = await User.findById(decoded.id).select('-password');

      // Sve OK – ide dalje na kontroler
      next();

    } catch (error) {
      console.error('Token nije validan:', error.message);
      return res.status(401).json({ message: 'Unauthorized access' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'No token. Login required' });
  }
};

export const isAuthenticated = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // sad req.user sadrži email i id
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const isUser = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  User.findById(req.user.id)
    .then((user) => {
      if (user?.isUser) {
        next();
      } else {
        res.status(403).json({ message: 'User role required' });
      }
    })
    .catch(() => res.status(500).json({ message: 'Error verifying role' }));
};

export const isAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  User.findById(req.user.id)
    .then((user) => {
      if (user?.isAdmin) {
        next();
      } else {
        res.status(403).json({ message: 'Admin access only' });
      }
    })
    .catch(() => res.status(500).json({ message: 'Error verifying role' }));
};

export default protect;